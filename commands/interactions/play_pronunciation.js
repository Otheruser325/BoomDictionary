const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { getVoiceChannel } = require('../../utils/voiceChannelConfig');
const { get } = require('https');

module.exports = {
    customId: 'play_pronunciation',
    async execute(interaction) {
        if (!interaction.isButton()) return;

        // Extract the term from the customId JSON object
        let term;
        try {
            const { term: parsedTerm } = JSON.parse(interaction.customId);
            term = parsedTerm;
        } catch (error) {
            console.error('Error parsing customId:', error);
            return interaction.reply({ content: 'There was an error processing your request.', ephemeral: true });
        }

        const BASE_URL = 'https://funny-eclair-d437ee.netlify.app';
        const mp3Url = `${BASE_URL}/${encodeURIComponent(term)}.mp3`;

        let voiceChannelId = getVoiceChannel(interaction.guild.id);
        if (!voiceChannelId) {
            const memberVoiceChannel = interaction.member.voice.channel;
            if (!memberVoiceChannel) {
                await interaction.reply({ content: 'You are not in a voice channel, and no channel is configured. Please join a voice channel or configure one with the `/config` command.', ephemeral: true });
                return;
            }
            voiceChannelId = memberVoiceChannel.id;
        }

        const voiceChannel = interaction.guild.channels.cache.get(voiceChannelId);
        if (!voiceChannel || voiceChannel.type !== 2) {
            await interaction.reply({ content: 'The configured voice channel is invalid. Please set a valid voice channel using the `/config` command.', ephemeral: true });
            return;
        }

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannelId,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            const player = createAudioPlayer();
            const stream = await fetchStreamFromUrl(mp3Url);
            const resource = createAudioResource(stream);

            player.play(resource);
            connection.subscribe(player);

            player.on(AudioPlayerStatus.Idle, () => {
                connection.destroy();
            });

            await interaction.reply({ content: `Now playing pronunciation for: **${term}**`, ephemeral: true });
        } catch (error) {
            console.error('Error handling voice interaction:', error);
            await interaction.reply({ content: 'Failed to play pronunciation. Please try again later.', ephemeral: true });
        }
    }
};

// Helper function to fetch the stream from a remote URL
function fetchStreamFromUrl(url) {
    return new Promise((resolve, reject) => {
        get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to get file: ${res.statusCode}`));
                return;
            }
            resolve(res);
        }).on('error', reject);
    });
}
