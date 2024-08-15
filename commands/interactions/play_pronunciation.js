const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { getVoiceChannel } = require('../../utils/voiceChannelConfig');
const { get } = require('https');

module.exports = {
    customId: 'play_pronunciation',  // Static ID for the interaction
    async execute(interaction) {
        if (!interaction.isButton()) return;

        // Extract the term from the customId JSON object
        const { term } = JSON.parse(interaction.customId);

        // Base URL for fetching MP3 files
        const BASE_URL = 'https://funny-eclair-d437ee.netlify.app';
        const mp3Url = `${BASE_URL}/${encodeURIComponent(term)}.mp3`;

        // Retrieve the voice channel either from configuration or the user's current voice channel
        let voiceChannelId = getVoiceChannel(interaction.guild.id);
        if (!voiceChannelId) {
            // If no configured voice channel, use the voice channel the user is currently in
            const memberVoiceChannel = interaction.member.voice.channel;
            if (!memberVoiceChannel) {
                await interaction.reply({ content: 'You are not in a voice channel, and no channel is configured. Please join a voice channel or configure one with the `/config` command.', ephemeral: true });
                return;
            }
            voiceChannelId = memberVoiceChannel.id;
        }

        const voiceChannel = interaction.guild.channels.cache.get(voiceChannelId);

        if (!voiceChannel || voiceChannel.type !== 2) { // 2 represents GUILD_VOICE in Discord.js v14
            await interaction.reply({ content: 'The configured voice channel is invalid. Please set a valid voice channel using the `/config` command.', ephemeral: true });
            return;
        }

        // Join the voice channel
        const connection = joinVoiceChannel({
            channelId: voiceChannelId,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        // Create an audio player
        const player = createAudioPlayer();

        // Stream the MP3 from the URL and create an audio resource
        const stream = await fetchStreamFromUrl(mp3Url);
        const resource = createAudioResource(stream);

        // Play the resource
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            connection.destroy();  // Leave the voice channel when done
        });

        await interaction.reply({ content: `Now playing pronunciation for: **${term}**`, ephemeral: true });
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
