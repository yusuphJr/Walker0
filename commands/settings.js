// ============================================
// commands/settings.js - Group Settings Commands
// ============================================

const {
    getGroupRules,
    updateGroupRule,
    config
} = require('../config');

// ============================================
// SETRULES COMMAND
// ============================================
async function setrules(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    if (args.length < 2) {
        await handler.sendKaliStyle(
            message,
            `Usage: !setrules <setting> <value>\n\n` +
            `Available settings:\n` +
            `• blocklinks <on|off>\n` +
            `• moderation <on|off>\n` +
            `• welcome <message>`
        );
        return;
    }
    
    const setting = args[0].toLowerCase();
    const value = args.slice(1).join(' ');
    
    const rules = getGroupRules(chat.id._serialized);
    
    switch (setting) {
        case 'blocklinks':
            const blockLinks = value.toLowerCase() === 'on';
            updateGroupRule(chat.id._serialized, 'blockLinks', blockLinks);
            await handler.sendKaliStyle(
                message,
                `✅ SETTING UPDATED\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `Link blocking: ${blockLinks ? 'ENABLED' : 'DISABLED'}\n` +
                `Links will ${blockLinks ? 'be deleted' : 'be allowed'}`
            );
            break;
            
        case 'moderation':
            const modEnabled = value.toLowerCase() === 'on';
            updateGroupRule(chat.id._serialized, 'moderationEnabled', modEnabled);
            await handler.sendKaliStyle(
                message,
                `✅ SETTING UPDATED\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `Auto-moderation: ${modEnabled ? 'ENABLED' : 'DISABLED'}\n` +
                `Spam/violations will ${modEnabled ? 'be handled' : 'be ignored'}`
            );
            break;
            
        case 'welcome':
            updateGroupRule(chat.id._serialized, 'welcomeMessage', value);
            await handler.sendKaliStyle(
                message,
                `✅ WELCOME MESSAGE UPDATED\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `New message:\n${value}\n\n` +
                `Use @user to mention new members`
            );
            break;
            
        default:
            await handler.sendKaliStyle(
                message,
                `❌ Unknown setting: ${setting}\n\n` +
                `Available settings:\n` +
                `• blocklinks\n` +
                `• moderation\n` +
                `• welcome`
            );
    }
}

// ============================================
// BLOCKLINKS COMMAND
// ============================================
async function blocklinks(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    if (args.length === 0) {
        const rules = getGroupRules(chat.id._serialized);
        await handler.sendKaliStyle(
            message,
            `🔗 LINK BLOCKING\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Current status: ${rules.blockLinks ? 'ON' : 'OFF'}\n\n` +
            `Usage: !blocklinks <on|off>`
        );
        return;
    }
    
    const enable = args[0].toLowerCase() === 'on';
    updateGroupRule(chat.id._serialized, 'blockLinks', enable);
    
    const output = 
        `🔗 LINK BLOCKING ${enable ? 'ENABLED' : 'DISABLED'}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Status: ${enable ? 'Active ✅' : 'Inactive ❌'}\n` +
        `Links will ${enable ? 'be deleted automatically' : 'be allowed'}\n` +
        `Exceptions: Admins and Trusted users\n\n` +
        `Group: ${chat.name}`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// BANWORD COMMAND
// ============================================
async function banword(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    if (args.length === 0) {
        await handler.sendKaliStyle(
            message,
            `Usage: !banword <word>\n` +
            `Add a word to the ban list\n\n` +
            `Example: !banword spam`
        );
        return;
    }
    
    const word = args[0].toLowerCase();
    const rules = getGroupRules(chat.id._serialized);
    
    if (rules.bannedWords.includes(word)) {
        await handler.sendKaliStyle(
            message,
            `❌ ERROR\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `"${word}" is already in the ban list\n\n` +
            `Use !bannedwords to see all banned words`
        );
        return;
    }
    
    rules.bannedWords.push(word);
    updateGroupRule(chat.id._serialized, 'bannedWords', rules.bannedWords);
    
    const output = 
        `🚫 WORD BANNED\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Word: "${word}"\n` +
        `Total banned words: ${rules.bannedWords.length}\n` +
        `Action: Messages containing this word will be deleted\n` +
        `Group: ${chat.name}`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// UNBANWORD COMMAND
// ============================================
async function unbanword(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    if (args.length === 0) {
        await handler.sendKaliStyle(
            message,
            `Usage: !unbanword <word>\n` +
            `Remove a word from the ban list\n\n` +
            `Example: !unbanword spam`
        );
        return;
    }
    
    const word = args[0].toLowerCase();
    const rules = getGroupRules(chat.id._serialized);
    
    const index = rules.bannedWords.indexOf(word);
    if (index === -1) {
        await handler.sendKaliStyle(
            message,
            `❌ ERROR\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `"${word}" is not in the ban list\n\n` +
            `Use !bannedwords to see all banned words`
        );
        return;
    }
    
    rules.bannedWords.splice(index, 1);
    updateGroupRule(chat.id._serialized, 'bannedWords', rules.bannedWords);
    
    const output = 
        `✅ WORD UNBANNED\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Word: "${word}"\n` +
        `Total banned words: ${rules.bannedWords.length}\n` +
        `Action: Word is now allowed\n` +
        `Group: ${chat.name}`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// BANNEDWORDS COMMAND (List all)
// ============================================
async function bannedwords(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    const rules = getGroupRules(chat.id._serialized);
    
    if (rules.bannedWords.length === 0) {
        await handler.sendKaliStyle(
            message,
            `✅ NO BANNED WORDS\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `This group has no banned words configured\n\n` +
            `Use !banword <word> to add words`
        );
        return;
    }
    
    let output = 
        `🚫 BANNED WORDS LIST\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Group: ${chat.name}\n` +
        `Total: ${rules.bannedWords.length}\n\n`;
    
    rules.bannedWords.forEach((word, i) => {
        output += `${i + 1}. ${word}\n`;
    });
    
    output += `\nUse !unbanword <word> to remove`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// SETWELCOME COMMAND
// ============================================
async function setwelcome(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    if (args.length === 0) {
        const rules = getGroupRules(chat.id._serialized);
        await handler.sendKaliStyle(
            message,
            `👋 CURRENT WELCOME MESSAGE\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `${rules.welcomeMessage}\n\n` +
            `Usage: !setwelcome <message>\n` +
            `Use @user to mention the new member\n\n` +
            `Example:\n` +
            `!setwelcome Welcome @user to our group!`
        );
        return;
    }
    
    const welcomeMsg = args.join(' ');
    updateGroupRule(chat.id._serialized, 'welcomeMessage', welcomeMsg);
    
    const output = 
        `👋 WELCOME MESSAGE UPDATED\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Group: ${chat.name}\n\n` +
        `New message:\n${welcomeMsg}\n\n` +
        `This will be sent when users join the group\n` +
        `Use @user to mention new members`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// GROUPSETTINGS COMMAND (View all settings)
// ============================================
async function groupsettings(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    const rules = getGroupRules(chat.id._serialized);
    const isBotAdmin = await handler.isBotAdmin(chat);
    
    const output = 
        `⚙️ GROUP SETTINGS\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Group: ${chat.name}\n` +
        `Members: ${chat.participants.length}\n\n` +
        `🛡️ MODERATION\n` +
        `Auto-Moderation: ${rules.moderationEnabled ? '✅ ON' : '❌ OFF'}\n` +
        `Link Blocking: ${rules.blockLinks ? '✅ ON' : '❌ OFF'}\n` +
        `Banned Words: ${rules.bannedWords.length}\n` +
        `Max Warnings: ${config.moderation.maxWarnings}\n` +
        `Mute Duration: ${config.moderation.muteTimeMinutes} min\n\n` +
        `🎉 FEATURES\n` +
        `Welcome Messages: ${config.features.welcomeMessage ? '✅ ON' : '❌ OFF'}\n` +
        `Group Metrics: ${config.features.groupMetrics ? '✅ ON' : '❌ OFF'}\n` +
        `Role System: ✅ Enabled\n` +
        `Typing Indicator: ${config.typing.enabled ? '✅ ON' : '❌ OFF'}\n\n` +
        `🤖 BOT STATUS\n` +
        `Bot is Admin: ${isBotAdmin ? '✅ YES' : '❌ NO'}\n` +
        `Command Prefix: ${config.prefix}\n` +
        `Bot Name: ${config.botName}\n\n` +
        `💡 Use !help settings to see setting commands`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// RESETRULES COMMAND (Reset to defaults)
// ============================================
async function resetrules(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    // Reset to default rules
    updateGroupRule(chat.id._serialized, 'blockLinks', false);
    updateGroupRule(chat.id._serialized, 'bannedWords', []);
    updateGroupRule(chat.id._serialized, 'welcomeMessage', config.welcome.defaultMessage);
    updateGroupRule(chat.id._serialized, 'moderationEnabled', true);
    
    const output = 
        `🔄 RULES RESET\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `All settings reset to defaults\n\n` +
        `Reset settings:\n` +
        `• Link Blocking: OFF\n` +
        `• Banned Words: Cleared\n` +
        `• Welcome Message: Default\n` +
        `• Auto-Moderation: ON\n\n` +
        `Use !groupsettings to view current settings`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
    setrules,
    blocklinks,
    banword,
    unbanword,
    bannedwords,
    setwelcome,
    groupsettings,
    settings: groupsettings, // Alias
    resetrules
};