// ============================================
// commands/personal.js - Personal/Owner Commands
// ============================================

const { config } = require('../config');

// Global state (imported from server.js via handler)
let isAway = false;
let awayMessage = config.availability.defaultMessage;

// ============================================
// AWAY COMMAND (Set away status)
// ============================================
async function away(message, args, handler) {
    const customMessage = args.length > 0 
        ? args.join(' ') 
        : config.availability.defaultMessage;
    
    // Update global state via server
    if (handler.client.setAwayStatus) {
        handler.client.setAwayStatus(true, customMessage);
    }
    
    isAway = true;
    awayMessage = customMessage;
    
    const output = 
        `🌙 AWAY STATUS SET\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Status: Away\n` +
        `Message: ${customMessage}\n\n` +
        `Auto-reply will be sent to:\n` +
        `• Direct messages\n` +
        `• When mentioned in groups\n\n` +
        `Cooldown: ${config.availability.cooldownMinutes} minutes\n` +
        `Use !back to disable`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// BACK COMMAND (Remove away status)
// ============================================
async function back(message, args, handler) {
    // Update global state via server
    if (handler.client.setAwayStatus) {
        handler.client.setAwayStatus(false, '');
    }
    
    isAway = false;
    
    const output = 
        `✅ BACK ONLINE\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Status: Available\n` +
        `Away message: Disabled\n` +
        `Auto-reply: OFF`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// STATUS COMMAND (Check away status)
// ============================================
async function status(message, args, handler) {
    const output = 
        `📊 AVAILABILITY STATUS\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Current Status: ${isAway ? '🌙 Away' : '✅ Available'}\n` +
        `Away Message: ${isAway ? awayMessage : 'Not set'}\n` +
        `Auto-Reply: ${isAway ? 'Enabled' : 'Disabled'}\n` +
        `Cooldown: ${config.availability.cooldownMinutes} minutes\n\n` +
        `Commands:\n` +
        `• !away [message] - Set away\n` +
        `• !back - Set available`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// SETPREFIX COMMAND (Change command prefix)
// ============================================
async function setprefix(message, args, handler) {
    if (args.length === 0) {
        await handler.sendKaliStyle(
            message,
            `Current prefix: ${config.prefix}\n\n` +
            `Usage: !setprefix <new_prefix>\n` +
            `Example: !setprefix /`
        );
        return;
    }
    
    const newPrefix = args[0];
    
    // Update config (note: this is in-memory, restart will reset)
    config.prefix = newPrefix;
    handler.prefix = newPrefix;
    
    const output = 
        `✅ PREFIX UPDATED\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Old Prefix: ${config.prefix}\n` +
        `New Prefix: ${newPrefix}\n\n` +
        `All commands now use: ${newPrefix}\n` +
        `Example: ${newPrefix}help\n\n` +
        `⚠️ Note: Restarting bot will reset to .env prefix`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// BROADCAST COMMAND (Send to all chats)
// ============================================
async function broadcast(message, args, handler) {
    if (args.length === 0) {
        await handler.sendKaliStyle(
            message,
            'Usage: !broadcast <message>\n' +
            'Send message to all groups and contacts\n\n' +
            '⚠️ Use carefully! This sends to EVERYONE'
        );
        return;
    }
    
    const broadcastMsg = args.join(' ');
    
    await handler.sendKaliStyle(
        message,
        `📢 BROADCASTING...\n` +
        `Message: ${broadcastMsg}\n\n` +
        `This may take a few minutes...`
    );
    
    try {
        const chats = await handler.client.getChats();
        let sent = 0;
        let failed = 0;
        
        for (const chat of chats) {
            try {
                await chat.sendMessage(
                    `📢 *Broadcast Message*\n\n${broadcastMsg}\n\n_This is a broadcast from bot owner_`
                );
                sent++;
                
                // Delay to avoid spam detection
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                failed++;
                console.error(`Failed to send to ${chat.name}:`, error);
            }
        }
        
        await handler.sendKaliStyle(
            message,
            `✅ BROADCAST COMPLETE\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Sent: ${sent}\n` +
            `Failed: ${failed}\n` +
            `Total Chats: ${chats.length}`
        );
        
    } catch (error) {
        await handler.sendKaliStyle(
            message,
            `❌ Broadcast failed\n${error.message}`
        );
    }
}

// ============================================
// LISTGROUPS COMMAND (Show all groups)
// ============================================
async function listgroups(message, args, handler) {
    try {
        const chats = await handler.client.getChats();
        const groups = chats.filter(chat => chat.isGroup);
        
        let output = 
            `👥 BOT GROUPS\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Total Groups: ${groups.length}\n\n`;
        
        groups.slice(0, 20).forEach((group, i) => {
            output += `${i + 1}. ${group.name}\n`;
            output += `   Members: ${group.participants.length}\n`;
            output += `   ID: ${group.id._serialized}\n\n`;
        });
        
        if (groups.length > 20) {
            output += `\n... and ${groups.length - 20} more`;
        }
        
        await handler.sendKaliStyle(message, output);
        
    } catch (error) {
        await handler.sendKaliStyle(
            message,
            `❌ Failed to list groups\n${error.message}`
        );
    }
}

// ============================================
// LEAVEGROUP COMMAND (Leave a group)
// ============================================
async function leavegroup(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(
            message,
            '❌ This command only works in groups'
        );
        return;
    }
    
    await handler.sendKaliStyle(
        message,
        `👋 Leaving group: ${chat.name}\n` +
        `Goodbye everyone!`
    );
    
    // Wait a bit then leave
    setTimeout(async () => {
        await chat.leave();
    }, 2000);
}

// ============================================
// EVAL COMMAND (Execute JavaScript code - DANGEROUS!)
// ============================================
async function evalCode(message, args, handler) {
    if (args.length === 0) {
        await handler.sendKaliStyle(
            message,
            'Usage: !eval <code>\n\n' +
            '⚠️ DANGEROUS: Executes JavaScript code\n' +
            'Only owner can use this'
        );
        return;
    }
    
    const code = args.join(' ');
    
    try {
        let result = eval(code);
        
        // Handle promises
        if (result instanceof Promise) {
            result = await result;
        }
        
        const output = 
            `💻 CODE EXECUTION\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Input:\n${code}\n\n` +
            `Output:\n${JSON.stringify(result, null, 2)}`;
        
        await handler.sendKaliStyle(message, output);
        
    } catch (error) {
        await handler.sendKaliStyle(
            message,
            `❌ EXECUTION ERROR\n` +
            `${error.message}\n\n` +
            `Stack:\n${error.stack}`
        );
    }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
    away,
    back,
    afk: away, // Alias
    status,
    setprefix,
    broadcast,
    listgroups,
    groups: listgroups, // Alias
    leavegroup,
    leave: leavegroup, // Alias
    eval: evalCode
};