const { setVoiceChannel } = require('../../utils/voiceChannelConfig');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'config',
    description: 'Configure the voice channel for pronunciation playback.',
	permissions: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
    async execute(message, args) {
        // Check if the user has the necessary permissions
        const member = message.member;
        if (!member.permissions.has(PermissionsBitField.Flags.Administrator) && !member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.channel.send('You do not have permission to use this command.');
        }

        // Check if a channel ID is provided
        if (args.length === 0) {
            return message.channel.send('Please specify a voice channel ID or mention a voice channel.');
        }

        // Get the channel ID and find the channel
        const channelId = args[0].replace(/[<#>]/g, ''); // Clean up the channel ID
        const channel = message.guild.channels.cache.get(channelId);

        // Check if the channel is valid and of type GUILD_VOICE
        if (!channel || channel.type !== 2) { // 2 represents GUILD_VOICE in Discord.js v14
            return message.channel.send('Please select a valid voice channel.');
        }

        // Set the voice channel in the configuration
        try {
            setVoiceChannel(message.guild.id, channel.id);
            await message.channel.send(`Configured the bot to join ${channel.name} for pronunciation playback.`);
        } catch (error) {
            console.error('Error setting voice channel:', error);
            await message.channel.send('There was an error saving the voice channel configuration.');
        }
    },
};
