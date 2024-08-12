const { Message } = require('discord.js');
const { setVoiceChannel } = require('../../utils/voiceChannelConfig');

module.exports = {
    name: 'config',
    description: 'Configure the voice channel for pronunciation playback.',
    async execute(message, args) {
        // Check if the user has the necessary permissions
        const member = message.member;
        if (!member.permissions.has('ADMINISTRATOR') && !member.permissions.has('MANAGE_CHANNELS')) {
            return message.channel.send({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        // Check if a channel ID is provided
        if (args.length === 0) {
            return message.channel.send({ content: 'Please specify a voice channel ID or mention a voice channel.', ephemeral: true });
        }

        // Get the channel by ID or mention
        const channelId = args[0].replace(/[<#>]/g, ''); // Remove any <#> formatting
        const channel = message.guild.channels.cache.get(channelId);

        if (!channel || channel.type !== 'GUILD_VOICE') {
            return message.channel.send({ content: 'Please select a valid voice channel.', ephemeral: true });
        }

        setVoiceChannel(message.guild.id, channel.id);

        await message.channel.send({ content: `Configured the bot to join ${channel.name} for pronunciation playback.`, ephemeral: true });
    },
};
