const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { setVoiceChannel } = require('../../utils/voiceChannelConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure the voice channel for pronunciation playback.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Select the voice channel for the bot to join')
                .setRequired(true)
                .addChannelTypes(2) // Only allows voice channels (2 = GUILD_VOICE)
        ),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        // Check if the user has the necessary permissions
        const member = interaction.member;
        if (!member.permissions.has(PermissionsBitField.Flags.Administrator) && !member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.channel.send('You do not have permission to use this command.');
        }

        // No need to check if the channel is a voice channel as we restrict the options
        setVoiceChannel(interaction.guild.id, channel.id);

        await interaction.reply({ content: `Configured the bot to join ${channel.name} for pronunciation playback.`, ephemeral: true });
    },
};
