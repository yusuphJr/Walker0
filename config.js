// ============================================
// config.js - Centralized Configuration
// ============================================

require('dotenv').config();

// ============================================
// BOT CONFIGURATION
// ============================================
const config = {
    // Command System
    prefix: process.env.COMMAND_PREFIX || '!',
    
    // Bot Identity
    botName: process.env.BOT_NAME || 'AnonBot',
    botVersion: '2.0.0',
    
    // Session
    sessionId: process.env.SESSION_ID,
    mongoUri: process.env.MONGODB_URI,
    encryptionKey: process.env.ENCRYPTION_KEY,
    
    // Ports
    port: process.env.RUNTIME_PORT || 3000,
    
    // Features
    features: {
        moderation: true,
        welcomeMessage: true,
        availabilityMessenger: true,
        dynamicAbout: true,
        groupMetrics: true,
        typingIndicator: true
    },
    
    // Typing Indicator
    typing: {
        enabled: true,
        intervalMs: 3000 // Send typing every 3 seconds
    },
    
    // Availability Messenger
    availability: {
        enabled: false, // Toggle via command
        defaultMessage: "I'm currently unavailable. I'll respond when I'm back.",
        cooldownMinutes: 30 // Don't reply to same user for 30 mins
    },
    
    // Dynamic About
    aboutTexts: [
        process.env.ABOUT_1 || '🤖 AnonBot - Your WhatsApp Assistant',
        process.env.ABOUT_2 || '⚡ Powered by AI & Automation',
        process.env.ABOUT_3 || '🔐 Secure | Fast | Reliable',
        process.env.ABOUT_4 || '💬 24/7 Active | Multi-Tenant',
        process.env.ABOUT_5 || '🚀 Built with whatsapp-web.js'
    ],
    aboutRotationMinutes: 15, // Change every 15 minutes
    
    // Moderation
    moderation: {
        enabled: true,
        maxWarnings: 3,
        muteTimeMinutes: 30,
        escalation: {
            1: 'warn',
            2: 'mute',
            3: 'kick'
        }
    },
    
    // Welcome Message
    welcome: {
        enabled: true,
        defaultMessage: `👋 Welcome to the group, @user!

Please read the group rules and be respectful to everyone.

Need help? Type !help to see available commands.`,
        joinVerification: false // Anti-bot challenge (future feature)
    }
};

// ============================================
// PERMISSION LEVELS
// ============================================
const PERMISSIONS = {
    PUBLIC: 0,      // Everyone
    TRUSTED: 1,     // Trusted role
    MODERATOR: 2,   // Moderator role
    ADMIN: 3,       // WhatsApp group admin
    OWNER: 4        // Bot owner/creator
};

// ============================================
// ROLE DEFINITIONS
// ============================================
const ROLES = {
    OWNER: {
        level: PERMISSIONS.OWNER,
        name: 'Owner',
        permissions: ['*'] // All permissions
    },
    ADMIN: {
        level: PERMISSIONS.ADMIN,
        name: 'Admin',
        permissions: ['kick', 'ban', 'mute', 'warn', 'moderation', 'settings']
    },
    MODERATOR: {
        level: PERMISSIONS.MODERATOR,
        name: 'Moderator',
        permissions: ['warn', 'mute', 'moderate']
    },
    TRUSTED: {
        level: PERMISSIONS.TRUSTED,
        name: 'Trusted',
        permissions: ['bypass_spam', 'bypass_moderation']
    },
    MUTED: {
        level: -1,
        name: 'Muted',
        permissions: []
    }
};

// ============================================
// COMMAND DEFINITIONS
// ============================================
const COMMANDS = {
    // Public Commands
    help: {
        category: 'general',
        description: 'Show available commands',
        usage: '!help [command]',
        permission: PERMISSIONS.PUBLIC,
        aliases: ['h', 'commands']
    },
    ping: {
        category: 'general',
        description: 'Test bot response',
        usage: '!ping',
        permission: PERMISSIONS.PUBLIC,
        aliases: ['p']
    },
    info: {
        category: 'general',
        description: 'Bot information',
        usage: '!info',
        permission: PERMISSIONS.PUBLIC,
        aliases: ['about']
    },
    
    // Weather
    weather: {
        category: 'information',
        description: 'Get weather information',
        usage: '!weather <city>',
        permission: PERMISSIONS.PUBLIC,
        aliases: ['w', 'forecast']
    },
    
    // News
    news: {
        category: 'information',
        description: 'Get latest news',
        usage: '!news [topic]',
        permission: PERMISSIONS.PUBLIC,
        aliases: ['n']
    },
    
    // Media Downloader
    download: {
        category: 'media',
        description: 'Download video/audio',
        usage: '!download <url>',
        permission: PERMISSIONS.PUBLIC,
        aliases: ['dl', 'vid', 'audio']
    },
    
    // Group Moderation (Admin Only)
    warn: {
        category: 'moderation',
        description: 'Warn a user',
        usage: '!warn @user [reason]',
        permission: PERMISSIONS.MODERATOR,
        aliases: []
    },
    mute: {
        category: 'moderation',
        description: 'Mute a user',
        usage: '!mute @user [duration]',
        permission: PERMISSIONS.MODERATOR,
        aliases: []
    },
    kick: {
        category: 'moderation',
        description: 'Kick a user from group',
        usage: '!kick @user [reason]',
        permission: PERMISSIONS.ADMIN,
        aliases: ['remove']
    },
    ban: {
        category: 'moderation',
        description: 'Ban a user',
        usage: '!ban @user [reason]',
        permission: PERMISSIONS.ADMIN,
        aliases: []
    },
    
    // Group Settings (Admin Only)
    setrules: {
        category: 'settings',
        description: 'Set group rules',
        usage: '!setrules <rule_type> <value>',
        permission: PERMISSIONS.ADMIN,
        aliases: ['rules']
    },
    blocklinks: {
        category: 'settings',
        description: 'Toggle link blocking',
        usage: '!blocklinks <on|off>',
        permission: PERMISSIONS.ADMIN,
        aliases: []
    },
    banword: {
        category: 'settings',
        description: 'Add banned word',
        usage: '!banword <word>',
        permission: PERMISSIONS.ADMIN,
        aliases: ['addban']
    },
    
    // Role Management (Admin Only)
    setrole: {
        category: 'roles',
        description: 'Assign role to user',
        usage: '!setrole @user <role>',
        permission: PERMISSIONS.ADMIN,
        aliases: ['role']
    },
    
    // Metrics (Admin Only)
    stats: {
        category: 'analytics',
        description: 'Group health metrics',
        usage: '!stats [timeframe]',
        permission: PERMISSIONS.ADMIN,
        aliases: ['metrics', 'analytics']
    },
    
    // Availability (Personal)
    away: {
        category: 'personal',
        description: 'Set away status',
        usage: '!away [message]',
        permission: PERMISSIONS.OWNER,
        aliases: ['afk', 'unavailable']
    },
    back: {
        category: 'personal',
        description: 'Remove away status',
        usage: '!back',
        permission: PERMISSIONS.OWNER,
        aliases: []
    }
};

// ============================================
// GROUP-SPECIFIC RULES STORAGE
// (In-memory for now, move to MongoDB later)
// ============================================
const groupRules = new Map();

function getGroupRules(groupId) {
    if (!groupRules.has(groupId)) {
        groupRules.set(groupId, {
            blockLinks: false,
            bannedWords: [],
            welcomeMessage: config.welcome.defaultMessage,
            moderationEnabled: true
        });
    }
    return groupRules.get(groupId);
}

function updateGroupRule(groupId, rule, value) {
    const rules = getGroupRules(groupId);
    rules[rule] = value;
    groupRules.set(groupId, rules);
}

// ============================================
// USER ROLES STORAGE
// (In-memory for now, move to MongoDB later)
// ============================================
const userRoles = new Map();

function getUserRole(userId, groupId) {
    const key = `${userId}_${groupId}`;
    return userRoles.get(key) || 'USER';
}

function setUserRole(userId, groupId, role) {
    const key = `${userId}_${groupId}`;
    userRoles.set(key, role);
}

// ============================================
// USER WARNINGS STORAGE
// ============================================
const userWarnings = new Map();

function getWarnings(userId, groupId) {
    const key = `${userId}_${groupId}`;
    return userWarnings.get(key) || [];
}

function addWarning(userId, groupId, reason, by) {
    const key = `${userId}_${groupId}`;
    const warnings = getWarnings(userId, groupId);
    warnings.push({
        reason,
        by,
        timestamp: new Date()
    });
    userWarnings.set(key, warnings);
    return warnings.length;
}

function clearWarnings(userId, groupId) {
    const key = `${userId}_${groupId}`;
    userWarnings.delete(key);
}

// ============================================
// GROUP METRICS STORAGE
// ============================================
const groupMetrics = new Map();

function initGroupMetrics(groupId) {
    if (!groupMetrics.has(groupId)) {
        groupMetrics.set(groupId, {
            messageCount: {},
            warningCount: {},
            spamCount: 0,
            hourlyActivity: new Array(24).fill(0)
        });
    }
    return groupMetrics.get(groupId);
}

function trackMessage(groupId, userId) {
    const metrics = initGroupMetrics(groupId);
    metrics.messageCount[userId] = (metrics.messageCount[userId] || 0) + 1;
    
    const hour = new Date().getHours();
    metrics.hourlyActivity[hour]++;
}

function trackWarning(groupId, userId) {
    const metrics = initGroupMetrics(groupId);
    metrics.warningCount[userId] = (metrics.warningCount[userId] || 0) + 1;
}

function trackSpam(groupId) {
    const metrics = initGroupMetrics(groupId);
    metrics.spamCount++;
}

// ============================================
// AVAILABILITY MESSENGER COOLDOWN
// ============================================
const availabilityCooldowns = new Map();

function canReplyAvailability(userId) {
    const lastReply = availabilityCooldowns.get(userId);
    if (!lastReply) return true;
    
    const cooldownMs = config.availability.cooldownMinutes * 60 * 1000;
    return (Date.now() - lastReply) > cooldownMs;
}

function setAvailabilityCooldown(userId) {
    availabilityCooldowns.set(userId, Date.now());
}

// ============================================
// BOT OWNER DETECTION
// ============================================
function isBotOwner(userId) {
    const ownerNumber = process.env.BOT_OWNER_NUMBER;
    if (!ownerNumber) return false;
    return userId.includes(ownerNumber);
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
    config,
    PERMISSIONS,
    ROLES,
    COMMANDS,
    
    // Group Rules
    getGroupRules,
    updateGroupRule,
    
    // User Roles
    getUserRole,
    setUserRole,
    
    // Warnings
    getWarnings,
    addWarning,
    clearWarnings,
    
    // Metrics
    initGroupMetrics,
    trackMessage,
    trackWarning,
    trackSpam,
    groupMetrics,
    
    // Availability
    canReplyAvailability,
    setAvailabilityCooldown,
    
    // Owner
    isBotOwner
};