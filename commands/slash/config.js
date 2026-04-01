import { SlashCommandBuilder } from 'discord.js';
import { executeConfigCommand } from '../shared/configCommand.js';

export const data = new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure the voice channel for pronunciation playback.')
    .addChannelOption(option => option.setName('channel')
        .setDescription('Select the voice channel for the bot to join')
        .setRequired(true)
        .addChannelTypes(2) // Only allows voice channels (2 = GUILD_VOICE)
    );
export async function execute(interaction) {
    return executeConfigCommand(interaction);
}
