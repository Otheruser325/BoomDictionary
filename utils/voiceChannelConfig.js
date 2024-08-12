const fs = require('fs');
const path = require('path');

const configFilePath = path.join(__dirname, '../data/voiceChannelConfig.json');

// Load the existing configurations or create a new one
const loadConfig = () => {
    if (fs.existsSync(configFilePath)) {
        const data = fs.readFileSync(configFilePath);
        return JSON.parse(data);
    }
    return {};
};

// Save configurations to the JSON file
const saveConfig = (config) => {
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
};

const getVoiceChannel = (guildId) => {
    const config = loadConfig();
    return config[guildId] ? config[guildId].channelId : null;
};

const setVoiceChannel = (guildId, channelId) => {
    const config = loadConfig();
    config[guildId] = { channelId };
    saveConfig(config);
};

module.exports = {
    getVoiceChannel,
    setVoiceChannel,
};
