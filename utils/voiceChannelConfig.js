import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Rebuild __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use file extension in JSON path (ESM-safe)
const configFilePath = join(__dirname, '../data/voiceChannelConfig.json');

// Load JSON config
const loadConfig = () => {
    if (!existsSync(configFilePath)) {
        return {};
    }

    try {
        const data = readFileSync(configFilePath, 'utf8');
        return JSON.parse(data);
    } catch {
        return {};
    }
};

// Save JSON config
const saveConfig = (config) => {
    writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf8');
};

export const getVoiceChannel = (guildId) => {
    const config = loadConfig();
    return config[guildId]?.channelId ?? null;
};

export const setVoiceChannel = (guildId, channelId) => {
    const config = loadConfig();
    config[guildId] = { channelId };
    saveConfig(config);
};
