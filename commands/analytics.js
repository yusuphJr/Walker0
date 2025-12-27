// ============================================
// commands/analytics.js - Group Metrics & Analytics
// ============================================

const { groupMetrics } = require('../config');

// ============================================
// STATS COMMAND (Group Health Metrics)
// ============================================
async function stats(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    const metrics = groupMetrics.get(chat.id._serialized);
    
    if (!metrics) {
        await handler.sendKaliStyle(
            message,
            '📊 No metrics data available yet\nMetrics will accumulate as the bot is used'
        );
        return;
    }
    
    // Calculate most active users
    const sortedUsers = Object.entries(metrics.messageCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    // Calculate most warned users
    const sortedWarnings = Object.entries(metrics.warningCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    // Find peak hours
    const peakHour = metrics.hourlyActivity.indexOf(Math.max(...metrics.hourlyActivity));
    const peakCount = metrics.hourlyActivity[peakHour];
    
    // Calculate spam rate
    const totalMessages = Object.values(metrics.messageCount).reduce((a, b) => a + b, 0);
    const spamRate = totalMessages > 0 ? ((metrics.spamCount / totalMessages) * 100).toFixed(2) : 0;
    
    let output = 
        `📊 GROUP ANALYTICS\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Group: ${chat.name}\n` +
        `Period: All time\n\n`;
    
    output += `📈 OVERALL STATS\n`;
    output += `Total Messages: ${totalMessages}\n`;
    output += `Spam Messages: ${metrics.spamCount}\n`;
    output += `Spam Rate: ${spamRate}%\n`;
    output += `Peak Hour: ${peakHour}:00 (${peakCount} msgs)\n\n`;
    
    output += `👥 MOST ACTIVE USERS\n`;
    if (sortedUsers.length > 0) {
        sortedUsers.forEach(([ userId, count], i) => {
            output += `${i + 1}. @${userId.split('@')[0]} - ${count} msgs\n`;
        });
    } else {
        output += 'No data yet\n';
    }
    output += '\n';
    
    output += `⚠️ MOST WARNED USERS\n`;
    if (sortedWarnings.length > 0) {
        sortedWarnings.forEach(([userId, count], i) => {
            output += `${i + 1}. @${userId.split('@')[0]} - ${count} warnings\n`;
        });
    } else {
        output += 'No warnings issued\n';
    }
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// ACTIVITY COMMAND (Hourly breakdown)
// ============================================
async function activity(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    const metrics = groupMetrics.get(chat.id._serialized);
    
    if (!metrics) {
        await handler.sendKaliStyle(
            message,
            '📊 No activity data available yet'
        );
        return;
    }
    
    let output = 
        `📈 HOURLY ACTIVITY\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Group: ${chat.name}\n\n`;
    
    // Create a bar chart using unicode blocks
    const maxActivity = Math.max(...metrics.hourlyActivity);
    const scale = maxActivity > 0 ? 10 / maxActivity : 1;
    
    for (let hour = 0; hour < 24; hour++) {
        const count = metrics.hourlyActivity[hour];
        const bars = Math.round(count * scale);
        const barStr = '█'.repeat(bars) + '░'.repeat(10 - bars);
        
        output += `${hour.toString().padStart(2, '0')}:00 ${barStr} ${count}\n`;
    }
    
    // Find peak times
    const peaks = [];
    for (let i = 0; i < 24; i++) {
        if (metrics.hourlyActivity[i] === maxActivity && maxActivity > 0) {
            peaks.push(`${i}:00`);
        }
    }
    
    output += `\n🔥 Peak Hours: ${peaks.join(', ') || 'None'}`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// LEADERBOARD COMMAND
// ============================================
async function leaderboard(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    const metrics = groupMetrics.get(chat.id._serialized);
    
    if (!metrics || Object.keys(metrics.messageCount).length === 0) {
        await handler.sendKaliStyle(
            message,
            '📊 No leaderboard data available yet'
        );
        return;
    }
    
    const sortedUsers = Object.entries(metrics.messageCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    let output = 
        `🏆 LEADERBOARD\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Group: ${chat.name}\n` +
        `Top 10 Most Active Members\n\n`;
    
    const medals = ['🥇', '🥈', '🥉'];
    
    sortedUsers.forEach(([userId, count], i) => {
        const position = i < 3 ? medals[i] : `${i + 1}.`;
        output += `${position} @${userId.split('@')[0]}\n`;
        output += `   Messages: ${count}\n`;
    });
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// MYACTIVITY COMMAND (Personal stats)
// ============================================
async function myactivity(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    const userId = message.author || message.from;
    const metrics = groupMetrics.get(chat.id._serialized);
    
    if (!metrics) {
        await handler.sendKaliStyle(
            message,
            '📊 No activity data available yet'
        );
        return;
    }
    
    const messageCount = metrics.messageCount[userId] || 0;
    const warningCount = metrics.warningCount[userId] || 0;
    
    // Calculate rank
    const sortedUsers = Object.entries(metrics.messageCount)
        .sort((a, b) => b[1] - a[1]);
    const rank = sortedUsers.findIndex(([id]) => id === userId) + 1;
    
    // Calculate percentage of total
    const totalMessages = Object.values(metrics.messageCount).reduce((a, b) => a + b, 0);
    const percentage = totalMessages > 0 ? ((messageCount / totalMessages) * 100).toFixed(2) : 0;
    
    const output = 
        `📊 YOUR ACTIVITY\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `User: @${userId.split('@')[0]}\n` +
        `Group: ${chat.name}\n\n` +
        `Messages Sent: ${messageCount}\n` +
        `Warnings: ${warningCount}\n` +
        `Rank: #${rank}/${sortedUsers.length}\n` +
        `Activity: ${percentage}% of total\n` +
        `Status: ${warningCount === 0 ? '✅ Good standing' : '⚠️ Has warnings'}`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// GROUPINFO COMMAND (Group overview)
// ============================================
async function groupinfo(message, args, handler) {
    const chat = await message.getChat();
    
    if (!chat.isGroup) {
        await handler.sendKaliStyle(message, 'This command only works in groups');
        return;
    }
    
    const metrics = groupMetrics.get(chat.id._serialized);
    const totalMessages = metrics ? Object.values(metrics.messageCount).reduce((a, b) => a + b, 0) : 0;
    
    // Count admins
    const adminCount = chat.participants.filter(p => p.isAdmin).length;
    
    const output = 
        `ℹ️ GROUP INFORMATION\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Name: ${chat.name}\n` +
        `Description: ${chat.description || 'None'}\n` +
        `Created: ${new Date(chat.createdAt * 1000).toLocaleDateString()}\n\n` +
        `Members: ${chat.participants.length}\n` +
        `Admins: ${adminCount}\n` +
        `Messages Tracked: ${totalMessages}\n` +
        `Bot Status: ${await handler.isBotAdmin(chat) ? 'Admin' : 'Member'}\n\n` +
        `Features:\n` +
        `• Moderation: Active\n` +
        `• Role System: Active\n` +
        `• Analytics: Active`;
    
    await handler.sendKaliStyle(message, output);
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
    stats,
    activity,
    leaderboard,
    myactivity,
    mystats: myactivity, // Alias
    groupinfo,
    metrics: stats // Alias
};