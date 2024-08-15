const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');
const fs = require('fs');
const { getVoiceChannel } = require('../../utils/voiceChannelConfig');

module.exports = {
    customId: 'play_pronunciation',  // Static ID for the interaction
    async execute(interaction) {
        if (!interaction.isButton()) return;

        // Extract the term from the customId JSON object
        const { term } = JSON.parse(interaction.customId);

        const fileName = `${term}.mp3`;
        const mp3FilePath = path.join(__dirname, '../../pronunciations', fileName);

        // Check if the pronunciation file exists
        if (!fs.existsSync(mp3FilePath)) {
            await interaction.reply({ content: `Pronunciation file not found for \`${term}\`.`, ephemeral: true });
            return;
        }

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

        const connection = joinVoiceChannel({
            channelId: voiceChannelId,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(mp3FilePath);

        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            connection.destroy();  // Leave the voice channel when done
        });

        await interaction.reply({ content: `Now playing pronunciation for: **${term}**`, ephemeral: true });
    }
};
