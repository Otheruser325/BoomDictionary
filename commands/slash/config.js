import { ChannelType, SlashCommandBuilder } from 'discord.js';
import { executeConfigCommand } from '../shared/configCommand.js';

export const data = new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure the server voice channel for pronunciation playback.')
    .addChannelOption(option => option.setName('channel')
        .setDescription('Optional: choose a voice channel, or leave blank while connected to one')
        .setRequired(false)
        .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
    );
export async function execute(interaction) {
    return executeConfigCommand(interaction);
}
