

const { config } = require('../config');

// ============================================
// HELP COMMAND
// ============================================
async function help(message, args, handler) {
    if (args.length > 0) {
        // Specific command help
        const commandName = args[0].toLowerCase();
        const helpInfo = handler.getCommandHelp(commandName);
        
        if (!helpInfo) {
            await handler.sendKaliStyle(
                message,
                `Command not found: ${commandName}\n` +
                `Type !help to see all commands`
            );
            return;
        }
        
        const output = 
            `COMMAND: ${helpInfo.name}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Description: ${helpInfo.description}\n` +
            `Usage: ${helpInfo.usage}\n` +
            `Permission: ${helpInfo.permission}\n` +
            `Category: ${helpInfo.category}\n` +
            `Aliases: ${helpInfo.aliases}`;
        
        await handler.sendKaliStyle(message, output);
        
    } else {
        // List all available commands
        const available = await handler.getAvailableCommands(message);
        
        let output = `AVAILABLE COMMANDS\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        for (const [category, commands] of Object.entries(available)) {
            output += `▶ ${category.toUpperCase()}\n`;
            for (const cmd of commands) {
                output += `  ${config.prefix}${cmd.name} - ${cmd.description}\n`;
            }
            output += '\n';
        }
        
        output += `Prefix: ${config.prefix}\n`;
        output += `Total Commands: ${Object.keys(available).reduce((sum, cat) => sum + available[cat].length, 0)}\n\n`;
        output += `Type ${config.prefix}help <command> for details`;
        
        await handler.sendKaliStyle(message, output);
    }
}

async function ping(message, args, handler) {
    const start = Date.now();
    
    // Send initial message
    await handler.sendKaliStyle(
        message,
        'Pinging...'
    );
    
    const latency = Date.now() - start;
    
    // Update with result
    const output = 
        `🏓 PONG!\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Response Time: ${latency}ms\n` +
        `Status: Online\n` +
        `Uptime: ${formatUptime(process.uptime())}`;
    
    await handler.sendKaliStyle(message, output);
}


async function info(message, args, handler) {
    const botInfo = handler.client.info;
    const chat = await message.getChat();
    
    const output = 
        `BOT INFORMATION\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Name: ${config.botName}\n` +
        `Version: ${config.botVersion}\n` +
        `Session: ${config.sessionId.substring(0, 20)}...\n` +
        `Platform: ${botInfo.platform}\n` +
        `WhatsApp: ${botInfo.wwebVersion}\n` +
        `Uptime: ${formatUptime(process.uptime())}\n` +
        `Commands: ${handler.commands.size}\n` +
        `Prefix: ${config.prefix}\n\n` +
        `Features:\n` +
        `• Multi-Tenant Support\n` +
        `• Group Moderation\n` +
        `• Role System\n` +
        `• Auto-Moderation\n` +
        `• Analytics & Metrics\n` +
        `• Media Downloader\n` +
        `• Weather & News`;
    
    await handler.sendKaliStyle(message, output);
}

async function session(message, args, handler) {
    const botInfo = handler.client.info;
    const chat = await message.getChat();
    
    const output = 
        `SESSION INFORMATION\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Session ID: ${config.sessionId}\n` +
        `Phone: ${botInfo.wid.user}\n` +
        `Device: ${botInfo.pushname}\n` +
        `Platform: ${botInfo.platform}\n` +
        `Connected: ${handler.client.pupPage ? 'Yes' : 'No'}\n` +
        `Chat Type: ${chat.isGroup ? 'Group' : 'Private'}\n` +
        `Started: ${new Date(Date.now() - process.uptime() * 1000).toLocaleString()}`;
    
    await handler.sendKaliStyle(message, output);
}

async function about(message, args, handler) {
    const output = 
        `${config.botName} v${config.botVersion}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `A powerful, multi-tenant WhatsApp bot\n` +
        `with advanced moderation and automation.\n\n` +
        `Built with:\n` +
        `• Node.js\n` +
        `• whatsapp-web.js\n` +
        `• MongoDB\n` +
        `• Express.js\n\n` +
        `Features:\n` +
        `• Modular command system\n` +
        `• Role-based permissions\n` +
        `• Group moderation tools\n` +
        `• Health metrics & analytics\n` +
        `• Media processing\n` +
        `• Weather & News integration\n\n` +
        `Type ${config.prefix}help for commands`;
    
    await handler.sendKaliStyle(message, output);
}

async function uptime(message, args, handler) {
    const uptimeSeconds = process.uptime();
    const formatted = formatUptime(uptimeSeconds);
    
    const output = 
        `BOT UPTIME\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Uptime: ${formatted}\n` +
        `Started: ${new Date(Date.now() - uptimeSeconds * 1000).toLocaleString()}\n` +
        `Process ID: ${process.pid}\n` +
        `Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// RULES COMMAND (Show group rules)
// ============================================
async function rules(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(
            message,
            'This command only works in groups'
        );
        return;
    }
    
    const { getGroupRules } = require('../config');
    const groupRules = getGroupRules(chat.id._serialized);
    
    const output = 
        `GROUP RULES\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Group: ${chat.name}\n\n` +
        `Moderation Settings:\n` +
        `• Link Blocking: ${groupRules.blockLinks ? 'ON' : 'OFF'}\n` +
        `• Banned Words: ${groupRules.bannedWords.length} words\n` +
        `• Auto-Moderation: ${groupRules.moderationEnabled ? 'ON' : 'OFF'}\n\n` +
        `Rules:\n` +
        `1. Be respectful to all members\n` +
        `2. No spam or excessive messages\n` +
        `3. No offensive language\n` +
        `4. Follow admin instructions\n\n` +
        `Violations result in warnings/kicks`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(' ');
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
    help,
    ping,
    info,
    session,
    about,
    uptime,
    rules
};