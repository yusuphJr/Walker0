# 🤖 AnonBot - Complete WhatsApp Bot System

A production-ready, feature-rich WhatsApp bot with advanced moderation, role management, and automation capabilities.

## ✨ Features

### 🎮 Command System
- **52+ Commands** across 8 modules
- **Prefix-based** commands (default: `!`)
- **Modular design** - Easy to extend
- **Dynamic loading** - Commands auto-registered

### 👮 Group Moderation
- **Warn System** - 3 strikes = kick
- **Mute Users** - Temporary message blocking
- **Kick/Ban** - Remove troublemakers
- **Link Blocking** - Auto-delete links
- **Banned Words** - Filter profanity
- **Auto-Escalation** - Progressive punishment
- **Group-Specific** - Rules isolated per group

### 👥 Role Management
- **MODERATOR** - Can warn and mute users
- **TRUSTED** - Bypass spam filters
- **MUTED** - Messages auto-deleted
- **Independent** - Works alongside WhatsApp admin roles

### 📊 Analytics & Metrics
- **Most Active Users** - Leaderboards
- **Most Warned Users** - Track violations
- **Hourly Activity** - Peak hour analysis
- **Spam Statistics** - Group health monitoring
- **Personal Stats** - Individual activity tracking

### 🎨 User Experience
- **Kali Linux Style** - Terminal-like message formatting
- **Typing Indicator** - Shows "typing..." during execution
- **Message Editing** - Edits command with result
- **Clean Interface** - Minimal, professional look

### 🌙 Automation
- **Welcome Messages** - Greet new members
- **Availability Messenger** - Auto-reply when away
- **Dynamic About** - Rotating status texts
- **Auto-Moderation** - Hands-free rule enforcement

### 📰 Information Commands
- **Weather** - Current conditions & forecasts
- **News** - Latest headlines
- **Crypto Prices** - Cryptocurrency tracking
- **Dictionary** - Word definitions

### 🎥 Media Processing
- **Sticker Creator** - Convert images to stickers
- **Media Downloader** - YouTube, TikTok (with setup)
- **Format Conversion** - Image/video conversions

### 🔐 Security
- **Permission Levels** - 5-tier access control
- **Role-Based Access** - Command restrictions
- **Owner Commands** - Special admin functions
- **Secure Storage** - Encrypted credentials

---

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB (Atlas or local)
- WhatsApp account

### Step 1: Clone & Setup

```bash
# Create project directory
mkdir whatsapp-bot
cd whatsapp-bot

# Create folder structure
mkdir -p service-2-runtime/commands
cd service-2-runtime
```

### Step 2: Copy Files

Copy all files from artifacts:
```
service-2-runtime/
├── server.js
├── config.js
├── commandHandler.js
├── commands/
│   ├── general.js
│   ├── moderation.js
│   ├── roles.js
│   ├── settings.js
│   ├── analytics.js
│   ├── information.js
│   ├── media.js
│   └── personal.js
├── package.json
├── .env
└── README.md
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment

Create `.env` file:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Session (from Service 1 - Scanner)
SESSION_ID=your_session_id_from_whatsapp

# Encryption (MUST match Service 1)
ENCRYPTION_KEY=your_64_char_hex_key

# Bot Identity
BOT_NAME=AnonBot
BOT_OWNER_NUMBER=1234567890
COMMAND_PREFIX=!

# Dynamic About Texts
ABOUT_1=🤖 AnonBot - Your Assistant
ABOUT_2=⚡ Powered by AI
ABOUT_3=🔐 Secure & Fast
ABOUT_4=💬 24/7 Active
ABOUT_5=🚀 Multi-Tenant Bot

# Optional API Keys
OPENWEATHER_API_KEY=
NEWS_API_KEY=

# Server
RUNTIME_PORT=3000
NODE_ENV=development
```

### Step 5: Generate Keys

```bash
# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env as ENCRYPTION_KEY
```

### Step 6: Get Session ID

1. Start Service 1 (Scanner)
2. Scan QR code
3. Check WhatsApp - you'll receive your SESSION_ID
4. Add to `.env`

### Step 7: Start Bot

```bash
npm start
```

---

## 🎮 Commands

### 📚 General Commands (Public)
```
!help              - Show all commands
!ping              - Test bot response
!info              - Bot information
!session           - Session details
!about             - About bot
!uptime            - System uptime
!rules             - Group rules
```

### 👮 Moderation Commands (Moderator+)
```
!warn @user [reason]        - Warn user
!mute @user [minutes]       - Mute user temporarily
!unmute @user               - Unmute user
!kick @user [reason]        - Kick from group
!ban @user [reason]         - Ban user
!warnings @user             - Check warnings
!clearwarnings @user        - Clear warnings
!delete                     - Delete message
```

### 👥 Role Commands (Admin)
```
!setrole @user <role>       - Assign role
!removerole @user           - Remove role
!checkrole @user            - Check user role
!listroles                  - List all roles
!promote @user              - Make moderator
!demote @user               - Remove moderator
```

### ⚙️ Settings Commands (Admin)
```
!setrules <type> <value>    - Configure rules
!blocklinks <on|off>        - Toggle link blocking
!banword <word>             - Add banned word
!unbanword <word>           - Remove banned word
!bannedwords                - List banned words
!setwelcome <message>       - Set welcome message
!groupsettings              - View all settings
```

### 📊 Analytics Commands (Admin)
```
!stats                      - Group health metrics
!activity                   - Hourly activity graph
!leaderboard                - Most active users
!myactivity                 - Personal statistics
!groupinfo                  - Group information
```

### 📰 Information Commands (Public)
```
!weather <city>             - Weather information
!forecast <city>            - 5-day forecast
!news [topic]               - Latest news
!crypto <coin>              - Crypto prices
!define <word>              - Dictionary lookup
```

### 🎥 Media Commands (Public)
```
!download <url>             - Download media
!sticker                    - Create sticker
!toimage                    - Sticker to image
!tovideo                    - Sticker to video
```

### 🌙 Personal Commands (Owner)
```
!away [message]             - Set away status
!back                       - Remove away status
!status                     - Check availability
!setprefix <prefix>         - Change command prefix
!broadcast <message>        - Send to all chats
!listgroups                 - Show all groups
!leavegroup                 - Leave current group
!eval <code>                - Execute JavaScript
```

---

## 🔧 Configuration

### Permission Levels
- **PUBLIC (0)** - Everyone
- **TRUSTED (1)** - Trusted users (bypass filters)
- **MODERATOR (2)** - Moderators (warn/mute)
- **ADMIN (3)** - WhatsApp group admins
- **OWNER (4)** - Bot owner (all commands)

### Roles
- **MODERATOR** - Can warn and mute, cannot kick
- **TRUSTED** - Exempt from spam filters
- **MUTED** - All messages auto-deleted

### Moderation Settings
- Max Warnings: 3 (configurable)
- Mute Duration: 30 minutes (configurable)
- Escalation: warn → mute → kick

---

## 🚀 Usage Examples

### Setup Group Moderation

```
Admin: !blocklinks on
Bot: ✅ Link blocking: ENABLED

Admin: !banword spam
Bot: 🚫 WORD BANNED

Admin: !setwelcome Welcome @user to our group!
Bot: ✅ Welcome message updated

Admin: !promote @john
Bot: ⬆️ USER PROMOTED to Moderator
```

### Moderate Users

```
Mod: !warn @spammer Too many messages
Bot: ⚠️ USER WARNED (1/3)

Mod: !mute @violator 60
Bot: 🔇 USER MUTED for 60 minutes

Admin: !kick @troll Inappropriate behavior
Bot: 👢 USER KICKED
```

### Use Information Commands

```
User: !weather Tokyo
Bot: [Kali Linux style weather report]

User: !news technology
Bot: [Latest tech news headlines]

User: !crypto bitcoin
Bot: [Bitcoin price and 24h change]
```

### Personal Commands

```
Owner: !away I'm sleeping, back in 8 hours
Bot: 🌙 AWAY STATUS SET

[Someone DMs]
Bot: I'm sleeping, back in 8 hours

Owner: !back
Bot: ✅ BACK ONLINE
```

---

## 📈 Analytics Dashboard

View group health metrics:

```
Admin: !stats

📊 GROUP ANALYTICS
━━━━━━━━━━━━━━━━━━━━━━━━
Group: My Awesome Group
Period: All time

📈 OVERALL STATS
Total Messages: 1,234
Spam Messages: 12
Spam Rate: 0.97%
Peak Hour: 18:00 (156 msgs)

👥 MOST ACTIVE USERS
1. @john - 345 msgs
2. @sarah - 289 msgs
3. @mike - 234 msgs

⚠️ MOST WARNED USERS
1. @troublemaker - 5 warnings
2. @spammer - 3 warnings
```

---

## 🛠️ Customization

### Add Custom Command

1. Edit `commands/general.js`:

```javascript
async function mycommand(message, args, handler) {
    await handler.sendKaliStyle(
        message,
        'My custom response!'
    );
}

module.exports = {
    ...existing,
    mycommand
};
```

2. Add to `config.js`:

```javascript
mycommand: {
    category: 'general',
    description: 'My custom command',
    usage: '!mycommand',
    permission: PERMISSIONS.PUBLIC,
    aliases: ['mc']
}
```

3. Restart bot - auto-loaded!

### Customize Kali Linux Style

Edit `commandHandler.js`:

```javascript
async sendKaliStyle(message, content) {
    const formatted = 
        `┌──[${config.botName}@terminal]-[${timestamp}]\n` +
        `└─$ ${content}\n`;
    
    await message.edit(formatted);
}
```

---

## 🐛 Troubleshooting

### Bot Not Starting
- ✅ Check SESSION_ID in .env
- ✅ Verify MongoDB connection
- ✅ Check ENCRYPTION_KEY matches Service 1

### Commands Not Working
- ✅ Check prefix in .env (default: !)
- ✅ Test with `!help`
- ✅ Check bot has permissions

### Moderation Not Working
- ✅ Bot must be group admin
- ✅ Check `!groupsettings`
- ✅ Verify moderation enabled

### Permission Denied
- ✅ Check your role: `!checkrole`
- ✅ Ask admin to promote you
- ✅ Set BOT_OWNER_NUMBER for owner commands

---

## 📝 License

MIT License - See LICENSE file

---

## 🤝 Contributing

Contributions welcome! Feel free to:
- Add new commands
- Improve existing features
- Fix bugs
- Update documentation

---

## 🆘 Support

Need help? Check:
1. This README
2. Command help: `!help <command>`
3. Check logs for errors
4. Verify configuration

---

## 🎉 Credits

Built with:
- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Express](https://expressjs.com/)

---

**Made with ❤️ for the WhatsApp automation community**