const { setVoiceChannel } = require('../../utils/voiceChannelConfig');

module.exports = {
    name: 'config',
    description: 'Configure the voice channel for pronunciation playback.',
    async execute(message, args) {
        // Check if the user has the necessary permissions
        const member = message.member;
        if (!member.permissions.has('ADMINISTRATOR') && !member.permissions.has('MANAGE_CHANNELS')) {
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
        if (!channel || channel.type !== 'GUILD_VOICE') {
            return message.channel.send('Please select a valid voice channel.');
        }

        // Set the voice channel in the configuration
        setVoiceChannel(message.guild.id, channel.id);

        await message.channel.send(`Configured the bot to join ${channel.name} for pronunciation playback.`);
    },
};
