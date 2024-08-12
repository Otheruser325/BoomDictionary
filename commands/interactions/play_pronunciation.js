const { AudioPlayer, AudioResource, createAudioPlayer, createAudioResource, joinVoiceChannel } = require('@discordjs/voice');
const path = require('path');
const fs = require('fs');

module.exports = {
    customId: /^play_pronunciation_.+/,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        const term = interaction.customId.split('_')[2];
        const fileName = `${term}.mp3`; // Ensure the file name matches
        const mp3FilePath = path.join(__dirname, '../../pronunciations', fileName);

        // Check if the file exists
        if (fs.existsSync(mp3FilePath)) {
            // Join the voice channel of the user who clicked the button
            const voiceChannel = interaction.member.voice.channel;
            if (voiceChannel) {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                });

                const player = createAudioPlayer();
                const resource = createAudioResource(mp3FilePath);

                player.play(resource);
                connection.subscribe(player);

                await interaction.reply({ content: `Now playing pronunciation for: **${term}**`, ephemeral: true });
            } else {
                await interaction.reply({ content: 'You need to be in a voice channel to play pronunciation.', ephemeral: true });
            }
        } else {
            await interaction.reply({ content: `Pronunciation file not found for \`${term}\`.`, ephemeral: true });
        }
    }
};
