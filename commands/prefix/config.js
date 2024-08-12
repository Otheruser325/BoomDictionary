const { EmbedBuilder } = require('discord.js');
const { setVoiceChannel } = require('../../utils/voiceChannelConfig');

module.exports = {
    name: 'config',
    description: 'Configure the voice channel for pronunciation playback.',
    async execute(message, args) {
        // Check if the user has the necessary permissions (MODERATOR or ADMINISTRATOR)
        const member = message.member;

        if (!member.permissions.has('ADMINISTRATOR') && !member.permissions.has('MANAGE_CHANNELS')) {
            return message.channel.send({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        // Check if a channel was mentioned
        const channel = message.mentions.channels.first();

        if (!channel || channel.type !== 'GUILD_VOICE') {
            return message.channel.send({ content: 'Please mention a valid voice channel.', ephemeral: true });
        }

        // Set the voice channel in the config
        setVoiceChannel(message.guild.id, channel.id);

        await message.channel.send({ content: `Configured the bot to join ${channel.name} for pronunciation playback.` });
    },
};
