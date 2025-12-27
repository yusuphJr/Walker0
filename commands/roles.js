// ============================================
// commands/roles.js - Role Management Commands
// ============================================

const {
    ROLES,
    getUserRole,
    setUserRole
} = require('../config');

// ============================================
// SETROLE COMMAND
// ============================================
async function setrole(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    const mentioned = handler.getMentionedUsers(message);
    if (mentioned.length === 0 || args.length < 2) {
        await handler.sendKaliStyle(
            message,
            `Usage: !setrole @user <role>\n\n` +
            `Available roles:\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `• MODERATOR - Can warn and mute users\n` +
            `• TRUSTED - Bypass spam filters\n` +
            `• MUTED - Messages auto-deleted\n` +
            `• USER - Default role (no special perms)\n\n` +
            `Example: !setrole @john MODERATOR`
        );
        return;
    }
    
    const targetId = mentioned[0];
    const roleName = args[1].toUpperCase();
    
    // Validate role
    const validRoles = ['MODERATOR', 'TRUSTED', 'MUTED', 'USER'];
    if (!validRoles.includes(roleName)) {
        await handler.sendKaliStyle(
            message,
            `❌ INVALID ROLE\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `"${roleName}" is not a valid role\n\n` +
            `Valid roles:\n` +
            `${validRoles.join(', ')}\n\n` +
            `Example: !setrole @user MODERATOR`
        );
        return;
    }
    
    // Set role
    setUserRole(targetId, chat.id._serialized, roleName);
    
    const roleInfo = ROLES[roleName] || { name: roleName, permissions: [] };
    
    const output = 
        `👤 ROLE ASSIGNED\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `User: @${targetId.split('@')[0]}\n` +
        `Role: ${roleInfo.name}\n` +
        `Level: ${roleInfo.level !== undefined ? roleInfo.level : 'N/A'}\n\n` +
        `Permissions:\n` +
        (roleInfo.permissions && roleInfo.permissions.length > 0 
            ? roleInfo.permissions.map(p => `  • ${p}`).join('\n')
            : '  • None') + `\n\n` +
        `Set by: @${(message.author || message.from).split('@')[0]}\n` +
        `Group: ${chat.name}`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// REMOVEROLE COMMAND
// ============================================
async function removerole(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    const mentioned = handler.getMentionedUsers(message);
    if (mentioned.length === 0) {
        await handler.sendKaliStyle(
            message,
            `Usage: !removerole @user\n` +
            `Remove special role from user\n\n` +
            `Example: !removerole @john`
        );
        return;
    }
    
    const targetId = mentioned[0];
    
    // Reset to default USER role
    setUserRole(targetId, chat.id._serialized, 'USER');
    
    const output = 
        `👤 ROLE REMOVED\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `User: @${targetId.split('@')[0]}\n` +
        `Previous Role: Reset to USER (default)\n` +
        `Permissions: None (regular member)\n\n` +
        `Removed by: @${(message.author || message.from).split('@')[0]}\n` +
        `Group: ${chat.name}`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// CHECKROLE COMMAND
// ============================================
async function checkrole(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    const mentioned = handler.getMentionedUsers(message);
    const targetId = mentioned.length > 0 ? mentioned[0] : (message.author || message.from);
    
    const role = getUserRole(targetId, chat.id._serialized);
    const roleInfo = ROLES[role] || { name: role, permissions: [], level: 0 };
    
    // Check if WhatsApp admin
    const participant = chat.participants.find(p => p.id._serialized === targetId);
    const isWhatsAppAdmin = participant && participant.isAdmin;
    
    const output = 
        `👤 USER ROLE INFORMATION\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `User: @${targetId.split('@')[0]}\n` +
        `Group: ${chat.name}\n\n` +
        `Bot Role: ${roleInfo.name}\n` +
        `Level: ${roleInfo.level}\n` +
        `WhatsApp Admin: ${isWhatsAppAdmin ? '✅ Yes' : '❌ No'}\n\n` +
        `Permissions:\n` +
        (roleInfo.permissions && roleInfo.permissions.length > 0 
            ? roleInfo.permissions.map(p => `  • ${p}`).join('\n')
            : '  • None (regular member)');
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// LISTROLES COMMAND
// ============================================
async function listroles(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    let output = 
        `👥 AVAILABLE ROLES\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Group: ${chat.name}\n\n`;
    
    // Show bot-managed roles only
    const botRoles = {
        'MODERATOR': ROLES.MODERATOR,
        'TRUSTED': ROLES.TRUSTED,
        'MUTED': ROLES.MUTED
    };
    
    for (const [roleName, roleInfo] of Object.entries(botRoles)) {
        output += `▶ ${roleInfo.name}\n`;
        output += `  Level: ${roleInfo.level}\n`;
        output += `  Permissions:\n`;
        
        if (roleInfo.permissions && roleInfo.permissions.length > 0) {
            roleInfo.permissions.forEach(p => {
                output += `    • ${p}\n`;
            });
        } else {
            output += `    • None\n`;
        }
        output += '\n';
    }
    
    output += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    output += `Usage: !setrole @user <role>\n`;
    output += `Example: !setrole @john MODERATOR`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// PROMOTE COMMAND (Quick moderator assignment)
// ============================================
async function promote(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    const mentioned = handler.getMentionedUsers(message);
    if (mentioned.length === 0) {
        await handler.sendKaliStyle(
            message,
            `Usage: !promote @user\n` +
            `Promote user to Moderator role\n\n` +
            `Moderators can:\n` +
            `  • Warn users\n` +
            `  • Mute users\n` +
            `  • View group stats\n\n` +
            `Example: !promote @john`
        );
        return;
    }
    
    const targetId = mentioned[0];
    setUserRole(targetId, chat.id._serialized, 'MODERATOR');
    
    const output = 
        `⬆️ USER PROMOTED\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `User: @${targetId.split('@')[0]}\n` +
        `New Role: Moderator\n\n` +
        `Permissions Granted:\n` +
        `  • Warn users (!warn)\n` +
        `  • Mute users (!mute)\n` +
        `  • View statistics (!stats)\n` +
        `  • Moderate messages\n\n` +
        `Promoted by: @${(message.author || message.from).split('@')[0]}\n` +
        `Group: ${chat.name}`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// DEMOTE COMMAND (Remove moderator)
// ============================================
async function demote(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    const mentioned = handler.getMentionedUsers(message);
    if (mentioned.length === 0) {
        await handler.sendKaliStyle(
            message,
            `Usage: !demote @user\n` +
            `Demote user to regular member\n\n` +
            `This removes moderator permissions\n\n` +
            `Example: !demote @john`
        );
        return;
    }
    
    const targetId = mentioned[0];
    const currentRole = getUserRole(targetId, chat.id._serialized);
    
    setUserRole(targetId, chat.id._serialized, 'USER');
    
    const output = 
        `⬇️ USER DEMOTED\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `User: @${targetId.split('@')[0]}\n` +
        `Previous Role: ${currentRole}\n` +
        `New Role: User (default)\n\n` +
        `Permissions Removed:\n` +
        `  • All special permissions removed\n` +
        `  • Now a regular member\n\n` +
        `Demoted by: @${(message.author || message.from).split('@')[0]}\n` +
        `Group: ${chat.name}`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// WHOIS COMMAND (Detailed user info)
// ============================================
async function whois(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    const mentioned = handler.getMentionedUsers(message);
    if (mentioned.length === 0) {
        await handler.sendKaliStyle(
            message,
            `Usage: !whois @user\n` +
            `Get detailed information about a user\n\n` +
            `Example: !whois @john`
        );
        return;
    }
    
    const targetId = mentioned[0];
    const role = getUserRole(targetId, chat.id._serialized);
    const roleInfo = ROLES[role] || { name: role, permissions: [], level: 0 };
    
    // Get participant info
    const participant = chat.participants.find(p => p.id._serialized === targetId);
    const isWhatsAppAdmin = participant && participant.isAdmin;
    const isSuperAdmin = participant && participant.isSuperAdmin;
    
    // Get warnings
    const { getWarnings } = require('../config');
    const warnings = getWarnings(targetId, chat.id._serialized);
    
    // Get message count
    const { groupMetrics } = require('../config');
    const metrics = groupMetrics.get(chat.id._serialized);
    const messageCount = metrics ? (metrics.messageCount[targetId] || 0) : 0;
    
    const output = 
        `🔍 USER INFORMATION\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `User: @${targetId.split('@')[0]}\n` +
        `Group: ${chat.name}\n\n` +
        `📊 STATUS\n` +
        `Bot Role: ${roleInfo.name}\n` +
        `Level: ${roleInfo.level}\n` +
        `WhatsApp Admin: ${isWhatsAppAdmin ? '✅ Yes' : '❌ No'}\n` +
        `Super Admin: ${isSuperAdmin ? '✅ Yes' : '❌ No'}\n\n` +
        `📈 ACTIVITY\n` +
        `Messages: ${messageCount}\n` +
        `Warnings: ${warnings.length}\n\n` +
        `🔐 PERMISSIONS\n` +
        (roleInfo.permissions && roleInfo.permissions.length > 0 
            ? roleInfo.permissions.map(p => `  • ${p}`).join('\n')
            : '  • None');
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
    setrole,
    removerole,
    checkrole,
    role: checkrole, // Alias
    listroles,
    promote,
    demote,
    whois
};