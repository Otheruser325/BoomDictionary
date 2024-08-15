const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { get } = require('https');

module.exports = {
    customIdPrefix: 'play_pronunciation', // Prefix used in customId
    async execute(interaction) {
        if (!interaction.isButton()) return;

        // Extract the term from the customId by removing the prefix
        let term;
        try {
            const [prefix, parsedTerm] = interaction.customId.split('_');
            if (prefix !== this.customIdPrefix) return; // Ensure the prefix matches
            term = parsedTerm;
        } catch (error) {
            console.error('Error parsing customId:', error);
            return interaction.reply({ content: 'There was an error processing your request.', ephemeral: true });
        }

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
