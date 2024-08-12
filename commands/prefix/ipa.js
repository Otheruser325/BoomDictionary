const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const fs = require('fs');

module.exports = {
    name: 'ipa',
    description: 'Get the pronunciation of a word.',
    async execute(message, args) {
        if (args.length === 0) {
            return message.channel.send({ content: 'Please provide a word to get the pronunciation.', ephemeral: true });
        }

        const word = args.join(' ').toLowerCase();
        const mp3FilePath = path.join(__dirname, '../../pronunciations', `${word}.mp3`);

        // Check if the MP3 file exists
        if (fs.existsSync(mp3FilePath)) {
            const embed = new EmbedBuilder()
                .setTitle(`Pronunciation for ${word}`)
                .setDescription(`Here is the pronunciation for the word \`${word}\`, generated with Microsoft Hazel.`)
                .setColor('#0099ff');

            const components = [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setURL(`/pronunciations/${word}.mp3`) // Adjust URL based on your hosting setup
                            .setLabel('Download MP3')
                            .setStyle(ButtonStyle.Link)
                    )
            ];

            await message.channel.send({ embeds: [embed], components: components });
        } else {
            await message.channel.send({ content: `No pronunciation found for \`${word}\`.`, ephemeral: true });
        }
    },
};
