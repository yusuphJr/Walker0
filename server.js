// ============================================
// SERVICE 2: COMPLETE RUNTIME SERVICE
// With ALL Features Integrated
// ============================================

const express = require('express');
const cors = require('cors');
const { Client, RemoteAuth } = require('whatsapp-web.js');
const mongoose = require('mongoose');
const { MongoStore } = require('wwebjs-mongo');
const crypto = require('crypto');
require('dotenv').config();

// Import modules
const CommandHandler = require('./commandHandler');
const {
    config,
    getGroupRules,
    getUserRole,
    trackMessage,
    trackSpam,
    canReplyAvailability,
    setAvailabilityCooldown
} = require('./config');

const app = express();
app.use(cors());
app.use(express.json());

let client = null;
let commandHandler = null;
let isConnected = false;
let currentSession = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let mongoStore = null;

// Dynamic About rotation
let aboutIndex = 0;
let aboutInterval = null;

// Availability messenger state
let isAway = false;
let awayMessage = config.availability.defaultMessage;

// ============================================
// CHECK SESSION_ID
// ============================================
if (!process.env.SESSION_ID) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ CRITICAL: SESSION_ID not found in .env');
    console.error('='.repeat(60));
    console.error('\nAuthenticate with Service 1 and add SESSION_ID to .env');
    console.error('='.repeat(60) + '\n');
    process.exit(1);
}

// ============================================
// DECRYPTION UTILITIES
// ============================================
const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
    ? Buffer.from(process.env.ENCRYPTION_KEY.substring(0, 64), 'hex')
    : (() => {
        console.error('❌ ENCRYPTION_KEY missing');
        process.exit(1);
    })();

function decryptData(encryptedData) {
    try {
        const decipher = crypto.createDecipheriv(
            ALGORITHM,
            ENCRYPTION_KEY,
            Buffer.from(encryptedData.iv, 'hex')
        );
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        throw new Error('Decryption failed - check ENCRYPTION_KEY');
    }
}

// ============================================
// MONGODB SESSION SCHEMA
// ============================================
const SessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    phoneNumber: { type: String, required: true, index: true },
    authData: {
        serialized: { type: String, required: true },
        remoteAuthPath: { type: String, required: true }
    },
    metadata: {
        deviceName: String,
        platform: String,
        whatsappVersion: String,
        createdAt: { type: Date, default: Date.now },
        lastActive: { type: Date, default: Date.now },
        lastSync: { type: Date, default: Date.now }
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'inactive', 'expired'],
        default: 'pending',
        index: true
    },
    encryption: {
        algorithm: { type: String, default: 'aes-256-gcm' },
        iv: String,
        authTag: String
    }
}, { timestamps: true });

const Session = mongoose.model('Session', SessionSchema);

// ============================================
// LOAD SESSION FROM MONGODB
// ============================================
async function loadSessionFromDB() {
    try {
        const sessionId = process.env.SESSION_ID;
        console.log('🔍 Loading session:', sessionId);
        
        const session = await Session.findOne({ sessionId });

        if (!session) {
            throw new Error('Session not found in database');
        }

        console.log('✅ Session found');
        console.log('📞 Phone:', session.phoneNumber);
        
        const decrypted = decryptData({
            encrypted: session.authData.serialized,
            iv: session.encryption.iv,
            authTag: session.encryption.authTag
        });

        const sessionData = JSON.parse(decrypted);
        currentSession = session;
        return { session, sessionData };

    } catch (error) {
        throw error;
    }
}

// ============================================
// INITIALIZE BOT
// ============================================
async function initializeBot() {
    try {
        console.log('🤖 Initializing bot...');

        const { session, sessionData } = await loadSessionFromDB();

        client = new Client({
            authStrategy: new RemoteAuth({
                clientId: session.authData.remoteAuthPath,
                store: mongoStore,
                backupSyncIntervalMs: 300000
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ],
            }
        });

        // Initialize command handler
        commandHandler = new CommandHandler(client);

        setupClientHandlers();
        await client.initialize();
        
        console.log('✅ Bot initialization started');

    } catch (error) {
        console.error('❌ Bot initialization failed:', error);
        throw error;
    }
}

// ============================================
// SETUP CLIENT EVENT HANDLERS
// ============================================
function setupClientHandlers() {
    
    // Ready Event
    client.on('ready', async () => {
        console.log('\n' + '='.repeat(60));
        console.log('✅ BOT IS READY!');
        console.log('='.repeat(60));
        isConnected = true;
        reconnectAttempts = 0;

        await Session.updateOne(
            { sessionId: currentSession.sessionId },
            { 
                status: 'active',
                'metadata.lastActive': new Date()
            }
        );

        const info = client.info;
        console.log(`📱 ${info.pushname} (${info.wid.user})`);
        console.log(`🔑 Session: ${currentSession.sessionId}`);
        console.log('='.repeat(60) + '\n');

        // Start dynamic about rotation
        startAboutRotation();
    });

    // Message Handler - THE BIG ONE
    client.on('message_create', async (message) => {
        try {
            if (message.isStatus) return;

            const chat = await message.getChat();
            const userId = message.author || message.from;
            const isFromMe = message.fromMe;

            // Log message
            console.log(`📩 ${chat.isGroup ? `[${chat.name}]` : '[DM]'} ${message.body}`);

            // Track metrics (groups only)
            if (chat.isGroup && !isFromMe) {
                trackMessage(chat.id._serialized, userId);
            }

            // FEATURE: Auto-Moderation (Groups)
            if (chat.isGroup && !isFromMe) {
                const modResult = await handleAutoModeration(message, chat, userId);
                if (modResult.violated) return; // Message was handled
            }

            // FEATURE: Availability Messenger (DMs & Mentions)
            if (isAway && !isFromMe) {
                const shouldReply = 
                    !chat.isGroup || // DM
                    (message.mentionedIds && message.mentionedIds.includes(client.info.wid._serialized)); // Mentioned
                
                if (shouldReply && canReplyAvailability(userId)) {
                    await message.reply(awayMessage);
                    setAvailabilityCooldown(userId);
                    console.log('📤 Away message sent');
                }
            }

            // FEATURE: Command Handling
            if (message.body.startsWith(config.prefix)) {
                const handled = await commandHandler.handleCommand(message);
                if (handled) return;
            }

        } catch (error) {
            console.error('❌ Message handling error:', error);
        }
    });

    // FEATURE: Welcome Message (New Members)
    client.on('group_join', async (notification) => {
        try {
            if (!config.features.welcomeMessage) return;

            const chat = await notification.getChat();
            const rules = getGroupRules(chat.id._serialized);
            
            // Replace @user with mention
            let welcomeMsg = rules.welcomeMessage;
            welcomeMsg = welcomeMsg.replace('@user', `@${notification.id.participant.split('@')[0]}`);
            
            await chat.sendMessage(welcomeMsg, {
                mentions: [notification.id.participant]
            });

            console.log(`👋 Welcome message sent in ${chat.name}`);

        } catch (error) {
            console.error('❌ Welcome message error:', error);
        }
    });

    // Authenticated
    client.on('authenticated', () => {
        console.log('🔐 Authenticated');
    });

    // Auth Failure
    client.on('auth_failure', async (msg) => {
        console.error('❌ Authentication Failed:', msg);
        
        if (currentSession) {
            await Session.updateOne(
                { sessionId: currentSession.sessionId },
                { status: 'expired' }
            );
        }
    });

    // Disconnected - Auto Reconnect
    client.on('disconnected', async (reason) => {
        console.log('🔌 Disconnected:', reason);
        isConnected = false;

        stopAboutRotation();

        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            const delay = 5000 * reconnectAttempts;
            
            console.log(`🔄 Reconnecting in ${delay/1000}s (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
            
            setTimeout(async () => {
                try {
                    await client.initialize();
                } catch (error) {
                    console.error('❌ Reconnection failed:', error);
                }
            }, delay);
        } else {
            console.error('❌ Max reconnection attempts reached');
        }
    });

    // Loading Screen
    client.on('loading_screen', (percent, message) => {
        console.log(`⏳ Loading: ${percent}%`);
    });

    // QR Code - Should NOT happen
    client.on('qr', () => {
        console.error('⚠️  QR CODE REQUESTED - Session issue detected');
    });

    // Remote session saved
    client.on('remote_session_saved', () => {
        console.log('💾 Remote session saved');
    });
}

// ============================================
// AUTO-MODERATION SYSTEM
// ============================================
async function handleAutoModeration(message, chat, userId) {
    const rules = getGroupRules(chat.id._serialized);
    
    if (!rules.moderationEnabled) {
        return { violated: false };
    }

    // Check user role - Trusted users bypass
    const userRole = getUserRole(userId, chat.id._serialized);
    if (userRole === 'TRUSTED') {
        return { violated: false };
    }

    // Check if user is muted
    if (userRole === 'MUTED') {
        try {
            await message.delete(true);
            console.log(`🔇 Deleted message from muted user`);
            return { violated: true, reason: 'muted' };
        } catch (error) {
            console.error('Failed to delete muted user message:', error);
        }
    }

    const messageBody = message.body.toLowerCase();

    // Check banned words
    for (const word of rules.bannedWords) {
        if (messageBody.includes(word.toLowerCase())) {
            try {
                await message.delete(true);
                await chat.sendMessage(
                    `⚠️ Message deleted: Contains banned word\nUser: @${userId.split('@')[0]}`,
                    { mentions: [userId] }
                );
                
                trackSpam(chat.id._serialized);
                console.log(`🚫 Banned word detected: ${word}`);
                return { violated: true, reason: 'banned_word' };
            } catch (error) {
                console.error('Failed to delete message:', error);
            }
        }
    }

    // Check links (if blocking enabled)
    if (rules.blockLinks) {
        const hasLink = /https?:\/\/|www\./i.test(messageBody);
        
        if (hasLink) {
            // Check if user is admin
            const participant = chat.participants.find(p => p.id._serialized === userId);
            const isAdmin = participant && participant.isAdmin;
            
            if (!isAdmin) {
                try {
                    await message.delete(true);
                    await chat.sendMessage(
                        `🔗 Link blocked\nUser: @${userId.split('@')[0]}\nLinks are not allowed`,
                        { mentions: [userId] }
                    );
                    
                    trackSpam(chat.id._serialized);
                    console.log(`🔗 Link blocked from ${userId}`);
                    return { violated: true, reason: 'link' };
                } catch (error) {
                    console.error('Failed to delete link:', error);
                }
            }
        }
    }

    return { violated: false };
}

// ============================================
// DYNAMIC ABOUT ROTATION
// ============================================
function startAboutRotation() {
    if (!config.features.dynamicAbout || config.aboutTexts.length === 0) {
        return;
    }

    console.log('🔄 Starting dynamic about rotation');

    // Set initial about
    updateAbout();

    // Rotate periodically
    aboutInterval = setInterval(() => {
        updateAbout();
    }, config.aboutRotationMinutes * 60 * 1000);
}

function stopAboutRotation() {
    if (aboutInterval) {
        clearInterval(aboutInterval);
        aboutInterval = null;
        console.log('⏹️  Stopped about rotation');
    }
}

async function updateAbout() {
    try {
        const newAbout = config.aboutTexts[aboutIndex];
        await client.setStatus(newAbout);
        
        console.log(`✏️  About updated: "${newAbout}"`);
        
        // Next index
        aboutIndex = (aboutIndex + 1) % config.aboutTexts.length;
        
    } catch (error) {
        console.error('Failed to update about:', error);
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
async function updateLastActive() {
    try {
        if (currentSession) {
            await Session.updateOne(
                { sessionId: currentSession.sessionId },
                { 'metadata.lastActive': new Date() }
            );
        }
    } catch (error) {
        console.error('Failed to update last active:', error);
    }
}

// ============================================
// API ROUTES
// ============================================

app.get('/api/health', (req, res) => {
    res.json({
        service: 'runtime',
        status: 'ok',
        connected: isConnected,
        sessionId: process.env.SESSION_ID,
        features: {
            commands: commandHandler ? commandHandler.commands.size : 0,
            moderation: config.features.moderation,
            availability: isAway,
            dynamicAbout: config.features.dynamicAbout
        },
        timestamp: new Date().toISOString()
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        service: 'runtime',
        connected: isConnected,
        sessionId: process.env.SESSION_ID,
        session: currentSession ? {
            sessionId: currentSession.sessionId,
            phoneNumber: currentSession.phoneNumber,
            deviceName: currentSession.metadata.deviceName,
            platform: currentSession.metadata.platform,
            lastActive: currentSession.metadata.lastActive,
            status: currentSession.status
        } : null,
        features: {
            away: isAway,
            awayMessage: isAway ? awayMessage : null,
            commandsLoaded: commandHandler ? commandHandler.commands.size : 0
        },
        reconnectAttempts,
        timestamp: new Date().toISOString()
    });
});

// Toggle away status
app.post('/api/away', async (req, res) => {
    const { enabled, message: customMessage } = req.body;
    
    isAway = enabled;
    if (customMessage) {
        awayMessage = customMessage;
    }
    
    res.json({
        success: true,
        away: isAway,
        message: awayMessage
    });
});

app.post('/api/send', async (req, res) => {
    try {
        const { to, message } = req.body;

        if (!isConnected) {
            return res.status(503).json({
                success: false,
                message: 'Bot not connected'
            });
        }

        const chatId = to.includes('@') ? to : `${to}@c.us`;
        await client.sendMessage(chatId, message);

        res.json({
            success: true,
            message: 'Message sent'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/stop', async (req, res) => {
    try {
        if (client) {
            stopAboutRotation();
            await client.destroy();
            client = null;
            isConnected = false;
            reconnectAttempts = 0;
        }

        res.json({
            success: true,
            message: 'Bot stopped'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// AUTO-START BOT
// ============================================
async function autoStartBot() {
    try {
        console.log('🔄 Auto-starting bot...');
        await initializeBot();
    } catch (error) {
        console.error('❌ Auto-start failed:', error.message);
        process.exit(1);
    }
}

// ============================================
// START SERVER
// ============================================
const PORT = process.env.RUNTIME_PORT || 3000;

async function startServer() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        mongoStore = new MongoStore({ mongoose });
        console.log('✅ MongoDB Store initialized');

        app.listen(PORT, () => {
            console.log('\n' + '='.repeat(60));
            console.log('🎉 RUNTIME SERVICE STARTED');
            console.log('='.repeat(60));
            console.log(`🔌 API: http://localhost:${PORT}/api`);
            console.log(`🔑 Session: ${process.env.SESSION_ID.substring(0, 30)}...`);
            console.log('='.repeat(60));
            console.log('\n📦 Features Enabled:');
            console.log(`   ✓ Modular Commands (${config.prefix})`);
            console.log('   ✓ Group Moderation');
            console.log('   ✓ Role System');
            console.log('   ✓ Auto-Moderation');
            console.log('   ✓ Welcome Messages');
            console.log('   ✓ Group Analytics');
            console.log('   ✓ Availability Messenger');
            console.log('   ✓ Dynamic About');
            console.log('   ✓ Typing Indicator');
            console.log('   ✓ Kali Linux Style\n');
        });

        await autoStartBot();

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    
    stopAboutRotation();
    
    if (client && isConnected) {
        await client.destroy();
    }
    
    await mongoose.connection.close();
    console.log('✅ Shutdown complete');
    process.exit(0);
});