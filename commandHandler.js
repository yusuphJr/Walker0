// ============================================
// commandHandler.js - Modular Command Handler
// ============================================

const {
    config,
    PERMISSIONS,
    ROLES,
    COMMANDS,
    getGroupRules,
    getUserRole,
    getWarnings,
    trackMessage,
    isBotOwner
} = require('./config');

// Import command modules
const generalCommands = require('./commands/general');
const moderationCommands = require('./commands/moderation');
const informationCommands = require('./commands/information');
const mediaCommands = require('./commands/media');
const roleCommands = require('./commands/roles');
const settingsCommands = require('./commands/settings');
const analyticsCommands = require('./commands/analytics');

// ============================================
// COMMAND HANDLER CLASS
// ============================================
class CommandHandler {
    constructor(client) {
        this.client = client;
        this.prefix = config.prefix;
        this.commands = new Map();
        this.aliases = new Map();
        
        // Load all commands
        this.loadCommands();
    }
    
    // ============================================
    // LOAD ALL COMMANDS
    // ============================================
    loadCommands() {
        const commandModules = [
            generalCommands,
            moderationCommands,
            informationCommands,
            mediaCommands,
            roleCommands,
            settingsCommands,
            analyticsCommands
        ];
        
        for (const module of commandModules) {
            for (const [name, handler] of Object.entries(module)) {
                this.commands.set(name, handler);
                
                // Register aliases
                const commandDef = COMMANDS[name];
                if (commandDef && commandDef.aliases) {
                    for (const alias of commandDef.aliases) {
                        this.aliases.set(alias, name);
                    }
                }
            }
        }
        
        console.log(`✅ Loaded ${this.commands.size} commands`);
    }
    
    // ============================================
    // PARSE MESSAGE FOR COMMAND
    // ============================================
    parseCommand(messageBody) {
        if (!messageBody.startsWith(this.prefix)) {
            return null;
        }
        
        const args = messageBody.slice(this.prefix.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();
        
        return {
            command: commandName,
            args: args
        };
    }
    
    // ============================================
    // GET USER PERMISSION LEVEL
    // ============================================
    async getUserPermissionLevel(message) {
        const chat = await message.getChat();
        const userId = message.author || message.from;
        
        // Bot owner has highest permission
        if (isBotOwner(userId)) {
            return PERMISSIONS.OWNER;
        }
        
        // Check if in group
        if (chat.isGroup) {
            const groupId = chat.id._serialized;
            
            // Check WhatsApp admin status
            const participant = chat.participants.find(
                p => p.id._serialized === userId
            );
            
            if (participant && participant.isAdmin) {
                return PERMISSIONS.ADMIN;
            }
            
            // Check bot-managed roles
            const role = getUserRole(userId, groupId);
            
            switch(role) {
                case 'MODERATOR':
                    return PERMISSIONS.MODERATOR;
                case 'TRUSTED':
                    return PERMISSIONS.TRUSTED;
                case 'MUTED':
                    return -1; // Below public
                default:
                    return PERMISSIONS.PUBLIC;
            }
        }
        
        // Private chat - public level
        return PERMISSIONS.PUBLIC;
    }
    
    // ============================================
    // CHECK IF USER CAN EXECUTE COMMAND
    // ============================================
    async canExecute(commandName, message) {
        const commandDef = COMMANDS[commandName];
        if (!commandDef) return false;
        
        const userLevel = await this.getUserPermissionLevel(message);
        const requiredLevel = commandDef.permission;
        
        return userLevel >= requiredLevel;
    }
    
    // ============================================
    // HANDLE COMMAND EXECUTION
    // ============================================
    async handleCommand(message) {
        try {
            const parsed = this.parseCommand(message.body);
            if (!parsed) return false;
            
            let { command, args } = parsed;
            
            // Check aliases
            if (this.aliases.has(command)) {
                command = this.aliases.get(command);
            }
            
            // Check if command exists
            if (!this.commands.has(command)) {
                return false;
            }
            
            // Check permissions
            const canExecute = await this.canExecute(command, message);
            if (!canExecute) {
                await this.sendKaliStyle(
                    message,
                    `❌ ERROR: Permission denied\n` +
                    `Command: ${command}\n` +
                    `Required: ${this.getPermissionName(COMMANDS[command].permission)}\n` +
                    `Your level: ${this.getPermissionName(await this.getUserPermissionLevel(message))}`
                );
                return true;
            }
            
            // Track command usage
            const chat = await message.getChat();
            if (chat.isGroup) {
                const userId = message.author || message.from;
                trackMessage(chat.id._serialized, userId);
            }
            
            // Start typing indicator
            const typingInterval = this.startTyping(chat);
            
            try {
                // Execute command
                const handler = this.commands.get(command);
                await handler(message, args, this);
                
            } finally {
                // Stop typing
                clearInterval(typingInterval);
            }
            
            return true;
            
        } catch (error) {
            console.error('Command execution error:', error);
            await this.sendKaliStyle(
                message,
                `❌ FATAL ERROR\n` +
                `Command execution failed\n` +
                `Error: ${error.message}\n` +
                `Type: ${error.name}`
            );
            return true;
        }
    }
    
    // ============================================
    // START TYPING INDICATOR
    // ============================================
    startTyping(chat) {
        if (!config.typing.enabled) return null;
        
        // Send typing immediately
        chat.sendStateTyping();
        
        // Keep sending typing every 3 seconds
        return setInterval(() => {
            chat.sendStateTyping();
        }, config.typing.intervalMs);
    }
    
    // ============================================
    // SEND KALI LINUX STYLE MESSAGE
    // (Edit original message with result)
    // ============================================
    async sendKaliStyle(message, content) {
        try {
            const timestamp = new Date().toLocaleTimeString('en-US', { 
                hour12: false 
            });
            
            const formattedContent = 
                `┌──[${config.botName}@whatsapp]-[${timestamp}]\n` +
                `└─$ ${content}\n`;
            
            // Try to edit the original message
            try {
                await message.edit(formattedContent);
            } catch (editError) {
                // If edit fails (message too old, not sent by bot, etc.)
                // Send as reply instead
                await message.reply(formattedContent);
            }
            
        } catch (error) {
            console.error('Failed to send Kali-style message:', error);
            // Fallback to regular reply
            await message.reply(content);
        }
    }
    
    // ============================================
    // SEND KALI STYLE (Alternative - Reply format)
    // ============================================
    async replyKaliStyle(message, content) {
        const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour12: false 
        });
        
        const formattedContent = 
            `┌──[${config.botName}@whatsapp]-[${timestamp}]\n` +
            `└─$ ${content}`;
        
        await message.reply(formattedContent);
    }
    
    // ============================================
    // GET PERMISSION NAME
    // ============================================
    getPermissionName(level) {
        const names = {
            [PERMISSIONS.PUBLIC]: 'Public',
            [PERMISSIONS.TRUSTED]: 'Trusted',
            [PERMISSIONS.MODERATOR]: 'Moderator',
            [PERMISSIONS.ADMIN]: 'Admin',
            [PERMISSIONS.OWNER]: 'Owner'
        };
        return names[level] || 'Unknown';
    }
    
    // ============================================
    // CHECK IF BOT IS ADMIN (for moderation)
    // ============================================
    async isBotAdmin(chat) {
        if (!chat.isGroup) return false;
        
        try {
            const botNumber = this.client.info.wid.user;
            const participant = chat.participants.find(
                p => p.id.user === botNumber
            );
            
            return participant && participant.isAdmin;
        } catch (error) {
            console.error('Failed to check bot admin status:', error);
            return false;
        }
    }
    
    // ============================================
    // EXTRACT MENTIONED USERS
    // ============================================
    getMentionedUsers(message) {
        return message.mentionedIds || [];
    }
    
    // ============================================
    // GET COMMAND HELP
    // ============================================
    getCommandHelp(commandName) {
        const commandDef = COMMANDS[commandName];
        if (!commandDef) return null;
        
        return {
            name: commandName,
            description: commandDef.description,
            usage: commandDef.usage,
            permission: this.getPermissionName(commandDef.permission),
            aliases: commandDef.aliases.join(', ') || 'None',
            category: commandDef.category
        };
    }
    
    // ============================================
    // LIST COMMANDS BY PERMISSION
    // ============================================
    async getAvailableCommands(message) {
        const userLevel = await this.getUserPermissionLevel(message);
        const available = [];
        
        for (const [name, def] of Object.entries(COMMANDS)) {
            if (userLevel >= def.permission) {
                available.push({
                    name,
                    category: def.category,
                    description: def.description
                });
            }
        }
        
        // Group by category
        const grouped = {};
        for (const cmd of available) {
            if (!grouped[cmd.category]) {
                grouped[cmd.category] = [];
            }
            grouped[cmd.category].push(cmd);
        }
        
        return grouped;
    }
}

// ============================================
// EXPORTS
// ============================================
module.exports = CommandHandler;