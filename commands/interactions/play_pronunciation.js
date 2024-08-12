const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const path = require('path');
const fs = require('fs');
const { getVoiceChannel } = require('../../utils/voiceChannelConfig'); // Update this line

module.exports = {
    customId: /^play_pronunciation_.+/,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        const term = interaction.customId.split('_')[2];
        const fileName = `${term}.mp3`;
        const mp3FilePath = path.join(__dirname, '../../pronunciations', fileName);

        // Check if the file exists
        if (fs.existsSync(mp3FilePath)) {
            const voiceChannelId = getVoiceChannel(interaction.guild.id);
            const voiceChannel = interaction.guild.channels.cache.get(voiceChannelId);

            if (voiceChannel) {
                const connection = joinVoiceChannel({
                    channelId: voiceChannelId,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                });

                const player = createAudioPlayer();
                const resource = createAudioResource(mp3FilePath);

                player.play(resource);
                connection.subscribe(player);

                await interaction.reply({ content: `Now playing pronunciation for: **${term}**`, ephemeral: true });
            } else {
                await interaction.reply({ content: 'No voice channel configured. Please set one using the `/config` command.', ephemeral: true });
            }
        } else {
            await interaction.reply({ content: `Pronunciation file not found for \`${term}\`.`, ephemeral: true });
        }
    }
};
