const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { get } = require('https');

module.exports = {
    customIdPrefix: 'play-pronunciation-',

    async execute(interaction) {
        if (!interaction.isButton()) return;

        const { customId } = interaction;

        // Check if the customId starts with the correct prefix
        if (!customId.startsWith(this.customIdPrefix)) return;

        // Extract the file name from the customId (without the prefix)
        const fileName = customId.slice(this.customIdPrefix.length + 1); // Get file name by removing the prefix
        const fileUrl = `https://funny-eclair-d437ee.netlify.app/${fileName}.mp3`; // Adjust URL

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
            const stream = await fetchStreamFromUrl(fileUrl);
            const resource = createAudioResource(stream);

            player.play(resource);
            connection.subscribe(player);

            player.on(AudioPlayerStatus.Idle, () => {
                connection.destroy();
            });

            await interaction.reply({ content: `Now playing pronunciation for: **${fileName.replace(/_/g, ' ')}**`, ephemeral: true });
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
