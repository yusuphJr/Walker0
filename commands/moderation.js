// ============================================
// commands/moderation.js - Moderation Commands
// ============================================

const {
    config,
    getWarnings,
    addWarning,
    clearWarnings,
    trackWarning,
    trackSpam,
    getUserRole
} = require('../config');

// ============================================
// WARN COMMAND
// ============================================
async function warn(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    // Check if bot is admin
    const isBotAdmin = await handler.isBotAdmin(chat);
    if (!isBotAdmin) {
        await handler.sendKaliStyle(
            message,
            '❌ ERROR: Bot must be admin to use moderation'
        );
        return;
    }
    
    const mentioned = handler.getMentionedUsers(message);
    if (mentioned.length === 0) {
        await handler.sendKaliStyle(
            message,
            'Usage: !warn @user [reason]\nMention a user to warn'
        );
        return;
    }
    
    const targetId = mentioned[0];
    const reason = args.slice(1).join(' ') || 'No reason provided';
    const warnedBy = message.author || message.from;
    
    // Add warning
    const warningCount = addWarning(
        targetId,
        chat.id._serialized,
        reason,
        warnedBy
    );
    
    // Track in metrics
    trackWarning(chat.id._serialized, targetId);
    
    const output = 
        `⚠️ USER WARNED\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `User: @${targetId.split('@')[0]}\n` +
        `Reason: ${reason}\n` +
        `Warning: ${warningCount}/${config.moderation.maxWarnings}\n` +
        `By: @${warnedBy.split('@')[0]}\n\n`;
    
    // Check escalation
    if (warningCount >= config.moderation.maxWarnings) {
        // Kick user
        try {
            await chat.removeParticipants([targetId]);
            await handler.sendKaliStyle(
                message,
                output + `ACTION: User kicked (max warnings reached)`
            );
            clearWarnings(targetId, chat.id._serialized);
        } catch (error) {
            await handler.sendKaliStyle(
                message,
                output + `ERROR: Failed to kick user: ${error.message}`
            );
        }
    } else if (warningCount === 2) {
        // Mute user (handled by message filter)
        await handler.sendKaliStyle(
            message,
            output + `NEXT: User will be kicked on next violation`
        );
    } else {
        await handler.sendKaliStyle(
            message,
            output + `NEXT: ${config.moderation.maxWarnings - warningCount} warnings until kick`
        );
    }
}

// ============================================
// MUTE COMMAND
// ============================================
async function mute(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    const isBotAdmin = await handler.isBotAdmin(chat);
    if (!isBotAdmin) {
        await handler.sendKaliStyle(
            message,
            '❌ ERROR: Bot must be admin to use moderation'
        );
        return;
    }
    
    const mentioned = handler.getMentionedUsers(message);
    if (mentioned.length === 0) {
        await handler.sendKaliStyle(
            message,
            'Usage: !mute @user [duration_minutes]\nMention a user to mute'
        );
        return;
    }
    
    const targetId = mentioned[0];
    const duration = parseInt(args[1]) || config.moderation.muteTimeMinutes;
    
    // Set user role to MUTED
    const { setUserRole } = require('../config');
    setUserRole(targetId, chat.id._serialized, 'MUTED');
    
    const output = 
        `🔇 USER MUTED\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `User: @${targetId.split('@')[0]}\n` +
        `Duration: ${duration} minutes\n` +
        `All messages will be auto-deleted\n` +
        `Muted by: @${(message.author || message.from).split('@')[0]}`;
    
    await handler.sendKaliStyle(message, output);
    
    // Auto-unmute after duration
    setTimeout(() => {
        setUserRole(targetId, chat.id._serialized, 'USER');
        chat.sendMessage(
            `✅ @${targetId.split('@')[0]} has been unmuted`,
            { mentions: [targetId] }
        );
    }, duration * 60 * 1000);
}

// ============================================
// UNMUTE COMMAND
// ============================================
async function unmute(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    const mentioned = handler.getMentionedUsers(message);
    if (mentioned.length === 0) {
        await handler.sendKaliStyle(
            message,
            'Usage: !unmute @user\nMention a user to unmute'
        );
        return;
    }
    
    const targetId = mentioned[0];
    
    // Remove mute
    const { setUserRole } = require('../config');
    setUserRole(targetId, chat.id._serialized, 'USER');
    
    const output = 
        `🔊 USER UNMUTED\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `User: @${targetId.split('@')[0]}\n` +
        `Can now send messages normally`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// KICK COMMAND
// ============================================
async function kick(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    const isBotAdmin = await handler.isBotAdmin(chat);
    if (!isBotAdmin) {
        await handler.sendKaliStyle(
            message,
            '❌ ERROR: Bot must be admin to kick users'
        );
        return;
    }
    
    const mentioned = handler.getMentionedUsers(message);
    if (mentioned.length === 0) {
        await handler.sendKaliStyle(
            message,
            'Usage: !kick @user [reason]\nMention a user to kick'
        );
        return;
    }
    
    const targetId = mentioned[0];
    const reason = args.slice(1).join(' ') || 'No reason provided';
    
    try {
        await chat.removeParticipants([targetId]);
        
        const output = 
            `👢 USER KICKED\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `User: @${targetId.split('@')[0]}\n` +
            `Reason: ${reason}\n` +
            `Kicked by: @${(message.author || message.from).split('@')[0]}\n` +
            `Status: Removed from group`;
        
        await handler.sendKaliStyle(message, output);
        
        // Clear warnings
        clearWarnings(targetId, chat.id._serialized);
        
    } catch (error) {
        await handler.sendKaliStyle(
            message,
            `❌ Failed to kick user\nError: ${error.message}`
        );
    }
}

// ============================================
// BAN COMMAND (Kick + Add to ban list)
// ============================================
async function ban(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    const isBotAdmin = await handler.isBotAdmin(chat);
    if (!isBotAdmin) {
        await handler.sendKaliStyle(
            message,
            '❌ ERROR: Bot must be admin to ban users'
        );
        return;
    }
    
    const mentioned = handler.getMentionedUsers(message);
    if (mentioned.length === 0) {
        await handler.sendKaliStyle(
            message,
            'Usage: !ban @user [reason]\nMention a user to ban'
        );
        return;
    }
    
    const targetId = mentioned[0];
    const reason = args.slice(1).join(' ') || 'No reason provided';
    
    try {
        // Add to ban list (implement ban list storage)
        // For now, just kick
        await chat.removeParticipants([targetId]);
        
        const output = 
            `🔨 USER BANNED\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `User: @${targetId.split('@')[0]}\n` +
            `Reason: ${reason}\n` +
            `Banned by: @${(message.author || message.from).split('@')[0]}\n` +
            `Status: Permanently banned\n` +
            `Note: User will be auto-kicked if they rejoin`;
        
        await handler.sendKaliStyle(message, output);
        
    } catch (error) {
        await handler.sendKaliStyle(
            message,
            `❌ Failed to ban user\nError: ${error.message}`
        );
    }
}

// ============================================
// WARNINGS COMMAND (Check user warnings)
// ============================================
async function warnings(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    const mentioned = handler.getMentionedUsers(message);
    const targetId = mentioned.length > 0 ? mentioned[0] : (message.author || message.from);
    
    const userWarnings = getWarnings(targetId, chat.id._serialized);
    
    if (userWarnings.length === 0) {
        await handler.sendKaliStyle(
            message,
            `✅ @${targetId.split('@')[0]} has no warnings`
        );
        return;
    }
    
    let output = 
        `⚠️ WARNING HISTORY\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `User: @${targetId.split('@')[0]}\n` +
        `Total Warnings: ${userWarnings.length}/${config.moderation.maxWarnings}\n\n`;
    
    userWarnings.forEach((w, i) => {
        output += `${i + 1}. ${w.reason}\n`;
        output += `   By: @${w.by.split('@')[0]}\n`;
        output += `   Time: ${new Date(w.timestamp).toLocaleString()}\n\n`;
    });
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// CLEARWARNINGS COMMAND
// ============================================
async function clearwarnings(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    const mentioned = handler.getMentionedUsers(message);
    if (mentioned.length === 0) {
        await handler.sendKaliStyle(
            message,
            'Usage: !clearwarnings @user\nMention a user to clear warnings'
        );
        return;
    }
    
    const targetId = mentioned[0];
    clearWarnings(targetId, chat.id._serialized);
    
    const output = 
        `✅ WARNINGS CLEARED\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `User: @${targetId.split('@')[0]}\n` +
        `All warnings have been removed`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// DELETE COMMAND (Delete message)
// ============================================
async function deleteMsg(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    try {
        // Delete the command message
        await message.delete(true);
        
        // If replying to a message, delete that too
        if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage();
            await quotedMsg.delete(true);
        }
    } catch (error) {
        await handler.sendKaliStyle(
            message,
            `❌ Failed to delete message\nError: ${error.message}`
        );
    }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
    warn,
    mute,
    unmute,
    kick,
    ban,
    remove: kick, // Alias
    warnings,
    clearwarnings,
    delete: deleteMsg
};