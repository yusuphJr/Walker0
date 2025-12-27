// ============================================
// commands/media.js - Media Downloader
// ============================================

const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

// ============================================
// DOWNLOAD COMMAND (YouTube, TikTok, etc.)
// ============================================
async function download(message, args, handler) {
    if (args.length === 0) {
        await handler.sendKaliStyle(
            message,
            'Usage: !download <url>\n\n' +
            'Supported:\n' +
            '• YouTube videos\n' +
            '• TikTok videos\n' +
            '• Instagram posts\n' +
            '• Twitter videos\n\n' +
            'Example: !download https://youtube.com/...'
        );
        return;
    }
    
    const url = args[0];
    
    // Detect platform
    let platform = 'unknown';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        platform = 'youtube';
    } else if (url.includes('tiktok.com')) {
        platform = 'tiktok';
    } else if (url.includes('instagram.com')) {
        platform = 'instagram';
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
        platform = 'twitter';
    }
    
    await handler.sendKaliStyle(
        message,
        `⏳ DOWNLOADING\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Platform: ${platform}\n` +
        `URL: ${url}\n` +
        `Status: Processing...\n\n` +
        `This may take a minute...`
    );
    
    try {
        // Use a free downloader API or library
        // For demonstration, using a generic approach
        
        if (platform === 'youtube') {
            await downloadYoutube(url, message, handler);
        } else if (platform === 'tiktok') {
            await downloadTikTok(url, message, handler);
        } else {
            await handler.sendKaliStyle(
                message,
                `❌ Platform not supported yet: ${platform}\n` +
                'Currently supported: YouTube, TikTok'
            );
        }
        
    } catch (error) {
        await handler.sendKaliStyle(
            message,
            `❌ DOWNLOAD FAILED\n` +
            `Error: ${error.message}\n\n` +
            'Possible reasons:\n' +
            '• Invalid URL\n' +
            '• Video unavailable\n' +
            '• Private/restricted content\n' +
            '• Size too large (max 64MB)'
        );
    }
}

// ============================================
// YOUTUBE DOWNLOADER
// ============================================
async function downloadYoutube(url, message, handler) {
    // NOTE: For production, use ytdl-core or a paid API
    // This is a placeholder implementation
    
    await handler.sendKaliStyle(
        message,
        `🎥 YOUTUBE DOWNLOAD\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Status: Feature in development\n\n` +
        `To enable YouTube downloads:\n` +
        '1. Install: npm install ytdl-core\n' +
        '2. Uncomment implementation in media.js\n\n' +
        'Note: YouTube has rate limits and restrictions'
    );
    
    /* ENABLE THIS AFTER INSTALLING ytdl-core:
    
    const ytdl = require('ytdl-core');
    const fs = require('fs');
    const path = require('path');
    
    const videoId = ytdl.getVideoID(url);
    const info = await ytdl.getInfo(videoId);
    const title = info.videoDetails.title;
    
    const tempPath = path.join(__dirname, `../temp/${videoId}.mp4`);
    
    // Download video
    ytdl(url, { quality: 'lowest' })
        .pipe(fs.createWriteStream(tempPath))
        .on('finish', async () => {
            // Send video
            const media = MessageMedia.fromFilePath(tempPath);
            await message.reply(media, undefined, { caption: title });
            
            // Cleanup
            fs.unlinkSync(tempPath);
            
            await handler.sendKaliStyle(
                message,
                `✅ DOWNLOAD COMPLETE\n` +
                `Title: ${title}`
            );
        });
    */
}

// ============================================
// TIKTOK DOWNLOADER
// ============================================
async function downloadTikTok(url, message, handler) {
    // NOTE: Use a TikTok downloader API
    // This is a placeholder implementation
    
    await handler.sendKaliStyle(
        message,
        `🎵 TIKTOK DOWNLOAD\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Status: Feature in development\n\n` +
        `To enable TikTok downloads:\n` +
        'Use a downloader API like:\n' +
        '• https://rapidapi.com/tiktok-api\n' +
        '• https://github.com/drawrowfly/tiktok-scraper\n\n' +
        'Set TIKTOK_API_KEY in .env'
    );
    
    /* ENABLE THIS AFTER SETTING UP API:
    
    const apiKey = process.env.TIKTOK_API_KEY;
    const apiUrl = `https://api.example.com/tiktok?url=${encodeURIComponent(url)}&key=${apiKey}`;
    
    const response = await axios.get(apiUrl);
    const videoUrl = response.data.download_url;
    
    // Download and send
    const videoData = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    const media = new MessageMedia('video/mp4', videoData.data.toString('base64'));
    
    await message.reply(media);
    */
}

// ============================================
// STICKER COMMAND (Convert image to sticker)
// ============================================
async function sticker(message, args, handler) {
    try {
        let media;
        
        // Check if replying to a message with media
        if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage();
            if (!quotedMsg.hasMedia) {
                await handler.sendKaliStyle(
                    message,
                    '❌ Quoted message has no media\n' +
                    'Reply to an image/video with !sticker'
                );
                return;
            }
            media = await quotedMsg.downloadMedia();
        } else if (message.hasMedia) {
            media = await message.downloadMedia();
        } else {
            await handler.sendKaliStyle(
                message,
                'Usage: !sticker\n\n' +
                'Reply to an image or video with this command\n' +
                'Or send image with caption: !sticker'
            );
            return;
        }
        
        if (!media) {
            await handler.sendKaliStyle(message, '❌ Failed to download media');
            return;
        }
        
        // Send as sticker
        await handler.client.sendMessage(message.from, media, {
            sendMediaAsSticker: true,
            stickerName: args.join(' ') || 'AnonBot',
            stickerAuthor: 'WhatsApp Bot'
        });
        
        await handler.sendKaliStyle(
            message,
            '✅ STICKER CREATED\n' +
            'Sticker sent successfully!'
        );
        
    } catch (error) {
        await handler.sendKaliStyle(
            message,
            `❌ Sticker creation failed\n${error.message}`
        );
    }
}

// ============================================
// TOIMAGE COMMAND (Convert sticker to image)
// ============================================
async function toimage(message, args, handler) {
    try {
        if (!message.hasQuotedMsg) {
            await handler.sendKaliStyle(
                message,
                'Usage: !toimage\nReply to a sticker with this command'
            );
            return;
        }
        
        const quotedMsg = await message.getQuotedMessage();
        
        if (quotedMsg.type !== 'sticker') {
            await handler.sendKaliStyle(
                message,
                '❌ Quoted message is not a sticker'
            );
            return;
        }
        
        const media = await quotedMsg.downloadMedia();
        
        // Send as image
        media.mimetype = 'image/png';
        await message.reply(media);
        
        await handler.sendKaliStyle(
            message,
            '✅ Converted to image'
        );
        
    } catch (error) {
        await handler.sendKaliStyle(
            message,
            `❌ Conversion failed\n${error.message}`
        );
    }
}

// ============================================
// TOVIDEO COMMAND (Convert video to GIF/video)
// ============================================
async function tovideo(message, args, handler) {
    try {
        if (!message.hasQuotedMsg) {
            await handler.sendKaliStyle(
                message,
                'Usage: !tovideo\nReply to a GIF sticker with this command'
            );
            return;
        }
        
        const quotedMsg = await message.getQuotedMessage();
        
        if (quotedMsg.type !== 'sticker') {
            await handler.sendKaliStyle(
                message,
                '❌ Quoted message is not a sticker'
            );
            return;
        }
        
        const media = await quotedMsg.downloadMedia();
        
        // Send as video
        media.mimetype = 'video/mp4';
        await message.reply(media);
        
        await handler.sendKaliStyle(
            message,
            '✅ Converted to video'
        );
        
    } catch (error) {
        await handler.sendKaliStyle(
            message,
            `❌ Conversion failed\n${error.message}`
        );
    }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
    download,
    dl: download, // Alias
    vid: download, // Alias
    sticker,
    s: sticker, // Alias
    toimage,
    tovideo
};