const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { get } = require('https');

module.exports = {
    customId: 'play_pronunciation',
    async execute(interaction) {
        if (!interaction.isButton()) return;

        // Retrieve the term from the custom data
        const term = interaction.customData;

        const BASE_URL = 'https://funny-eclair-d437ee.netlify.app';
        const mp3Url = `${BASE_URL}/${encodeURIComponent(term)}.mp3`;

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: 'You need to be in a voice channel to play the pronunciation.', ephemeral: true });
        }

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
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
};
