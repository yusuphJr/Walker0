// ============================================
// commands/information.js - Information Commands
// ============================================

const axios = require('axios');

// ============================================
// WEATHER COMMAND
// ============================================
async function weather(message, args, handler) {
    if (args.length === 0) {
        await handler.sendKaliStyle(
            message,
            'Usage: !weather <city>\nExample: !weather London'
        );
        return;
    }
    
    const city = args.join(' ');
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
        await handler.sendKaliStyle(
            message,
            '❌ ERROR: Weather API not configured\n' +
            'Set OPENWEATHER_API_KEY in .env\n' +
            'Get free key: https://openweathermap.org/api'
        );
        return;
    }
    
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
        const response = await axios.get(url);
        const data = response.data;
        
        const output = 
            `🌤️ WEATHER REPORT\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Location: ${data.name}, ${data.sys.country}\n` +
            `Coordinates: ${data.coord.lat}°N, ${data.coord.lon}°E\n\n` +
            `Condition: ${data.weather[0].main} (${data.weather[0].description})\n` +
            `Temperature: ${data.main.temp}°C\n` +
            `Feels Like: ${data.main.feels_like}°C\n` +
            `Min/Max: ${data.main.temp_min}°C / ${data.main.temp_max}°C\n\n` +
            `Humidity: ${data.main.humidity}%\n` +
            `Pressure: ${data.main.pressure} hPa\n` +
            `Wind Speed: ${data.wind.speed} m/s\n` +
            `Visibility: ${(data.visibility / 1000).toFixed(1)} km\n\n` +
            `Sunrise: ${new Date(data.sys.sunrise * 1000).toLocaleTimeString()}\n` +
            `Sunset: ${new Date(data.sys.sunset * 1000).toLocaleTimeString()}`;
        
        await handler.sendKaliStyle(message, output);
        
    } catch (error) {
        if (error.response && error.response.status === 404) {
            await handler.sendKaliStyle(
                message,
                `❌ City not found: ${city}\nPlease check spelling and try again`
            );
        } else {
            await handler.sendKaliStyle(
                message,
                `❌ Weather API error\n${error.message}`
            );
        }
    }
}

// ============================================
// FORECAST COMMAND (5-day forecast)
// ============================================
async function forecast(message, args, handler) {
    if (args.length === 0) {
        await handler.sendKaliStyle(
            message,
            'Usage: !forecast <city>\nExample: !forecast London'
        );
        return;
    }
    
    const city = args.join(' ');
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
        await handler.sendKaliStyle(
            message,
            '❌ ERROR: Weather API not configured'
        );
        return;
    }
    
    try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
        const response = await axios.get(url);
        const data = response.data;
        
        let output = 
            `📅 5-DAY FORECAST\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Location: ${data.city.name}, ${data.city.country}\n\n`;
        
        // Group by day and get midday forecast
        const dailyForecasts = {};
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString();
            const hour = date.getHours();
            
            // Get midday forecast (12:00)
            if (hour === 12 && !dailyForecasts[day]) {
                dailyForecasts[day] = item;
            }
        });
        
        Object.entries(dailyForecasts).slice(0, 5).forEach(([day, item]) => {
            output += `${day}\n`;
            output += `  ${item.weather[0].main}: ${item.main.temp}°C\n`;
            output += `  ${item.weather[0].description}\n\n`;
        });
        
        await handler.sendKaliStyle(message, output);
        
    } catch (error) {
        await handler.sendKaliStyle(
            message,
            `❌ Forecast API error\n${error.message}`
        );
    }
}

// ============================================
// NEWS COMMAND
// ============================================
async function news(message, args, handler) {
    const apiKey = process.env.NEWS_API_KEY;
    
    if (!apiKey) {
        await handler.sendKaliStyle(
            message,
            '❌ ERROR: News API not configured\n' +
            'Set NEWS_API_KEY in .env\n' +
            'Get free key: https://newsapi.org'
        );
        return;
    }
    
    const topic = args.length > 0 ? args.join(' ') : 'latest';
    
    try {
        const url = topic === 'latest'
            ? `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`
            : `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&sortBy=publishedAt&apiKey=${apiKey}`;
        
        const response = await axios.get(url);
        const articles = response.data.articles.slice(0, 5);
        
        if (articles.length === 0) {
            await handler.sendKaliStyle(
                message,
                `❌ No news found for: ${topic}`
            );
            return;
        }
        
        let output = 
            `📰 NEWS HEADLINES\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Topic: ${topic}\n` +
            `Results: ${articles.length}\n\n`;
        
        articles.forEach((article, i) => {
            output += `${i + 1}. ${article.title}\n`;
            output += `   Source: ${article.source.name}\n`;
            output += `   ${article.url}\n\n`;
        });
        
        await handler.sendKaliStyle(message, output);
        
    } catch (error) {
        await handler.sendKaliStyle(
            message,
            `❌ News API error\n${error.message}`
        );
    }
}

// ============================================
// CRYPTO COMMAND (Cryptocurrency prices)
// ============================================
async function crypto(message, args, handler) {
    const coin = args.length > 0 ? args[0].toLowerCase() : 'bitcoin';
    
    try {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd,eur&include_24hr_change=true`;
        const response = await axios.get(url);
        const data = response.data[coin];
        
        if (!data) {
            await handler.sendKaliStyle(
                message,
                `❌ Cryptocurrency not found: ${coin}\n` +
                'Try: bitcoin, ethereum, dogecoin, cardano'
            );
            return;
        }
        
        const change = data.usd_24h_change;
        const changeSymbol = change >= 0 ? '📈' : '📉';
        
        const output = 
            `💰 CRYPTO PRICE\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Coin: ${coin.toUpperCase()}\n\n` +
            `Price (USD): $${data.usd.toLocaleString()}\n` +
            `Price (EUR): €${data.eur.toLocaleString()}\n` +
            `24h Change: ${changeSymbol} ${change.toFixed(2)}%\n\n` +
            `Data from CoinGecko`;
        
        await handler.sendKaliStyle(message, output);
        
    } catch (error) {
        await handler.sendKaliStyle(
            message,
            `❌ Crypto API error\n${error.message}`
        );
    }
}

// ============================================
// DEFINE COMMAND (Dictionary)
// ============================================
async function define(message, args, handler) {
    if (args.length === 0) {
        await handler.sendKaliStyle(
            message,
            'Usage: !define <word>\nExample: !define serendipity'
        );
        return;
    }
    
    const word = args[0].toLowerCase();
    
    try {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
        const response = await axios.get(url);
        const data = response.data[0];
        
        const meaning = data.meanings[0];
        const definition = meaning.definitions[0];
        
        let output = 
            `📖 DEFINITION\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Word: ${data.word}\n` +
            `Phonetic: ${data.phonetic || 'N/A'}\n` +
            `Type: ${meaning.partOfSpeech}\n\n` +
            `Definition:\n${definition.definition}\n`;
        
        if (definition.example) {
            output += `\nExample:\n"${definition.example}"`;
        }
        
        if (meaning.synonyms && meaning.synonyms.length > 0) {
            output += `\n\nSynonyms: ${meaning.synonyms.slice(0, 5).join(', ')}`;
        }
        
        await handler.sendKaliStyle(message, output);
        
    } catch (error) {
        if (error.response && error.response.status === 404) {
            await handler.sendKaliStyle(
                message,
                `❌ Word not found: ${word}`
            );
        } else {
            await handler.sendKaliStyle(
                message,
                `❌ Dictionary API error\n${error.message}`
            );
        }
    }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
    weather,
    forecast,
    news,
    crypto,
    define
};