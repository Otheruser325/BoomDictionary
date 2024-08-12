const { SlashCommandBuilder } = require('discord.js');
const { setVoiceChannel } = require('../../utils/voiceChannelConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure the voice channel for pronunciation playback.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The voice channel for the bot to join')
                .setRequired(true)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        
        if (channel.type !== 'GUILD_VOICE') {
            return interaction.reply({ content: 'Please select a valid voice channel.', ephemeral: true });
        }

        setVoiceChannel(interaction.guild.id, channel.id);

        await interaction.reply({ content: `Configured the bot to join ${channel.name} for pronunciation playback.`, ephemeral: true });
    },
};
