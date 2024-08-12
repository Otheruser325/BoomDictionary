const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const fs = require('fs');
const dictionary = require('../../data/dictionary.json');

module.exports = {
    name: 'ipa',
    description: 'Get the pronunciation of a word.',
    async execute(message, args) {
        if (args.length === 0) {
            return message.channel.send({ content: 'Please provide a word to get the pronunciation.', ephemeral: true });
        }

        const term = args.join(' ').toLowerCase(); // Convert input to lowercase
        let pronunciationFound = false;

        // Check each category for the term
        for (const [category, terms] of Object.entries(dictionary)) {
            const normalizedTerms = Object.fromEntries(
                Object.entries(terms).filter(([key, value]) => typeof value === 'object')
                    .map(([key, value]) => [key.toLowerCase(), value])
            );

            if (normalizedTerms[term]) {
                const termData = normalizedTerms[term];
                const { terminology, pronunciation } = termData;

                // Convert spaces and special characters to underscores for filename
                const fileName = term
                    .replace(/\s+/g, '_') // Replace spaces with underscores
                    .replace(/[^a-zA-Z0-9_]/g, '') // Remove special characters
                    + '.mp3';
                const mp3FilePath = path.join(__dirname, '../../pronunciations', fileName);

                // Create the embed with pronunciation details
                const embed = new EmbedBuilder()
                    .setTitle(`Pronunciation for ${terminology || term}`)
                    .setDescription(`Here is the pronunciation for the word \`${terminology || term}\`, generated with Microsoft Hazel.`)
                    .addFields(
                        { name: 'Category', value: category },
                        { name: 'Pronunciation', value: pronunciation || 'Not available' }
                    )
                    .setColor('#0099ff');

                if (fs.existsSync(mp3FilePath)) {
                    const components = [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setURL(`/${fileName}`) // Adjust URL based on your hosting setup
                                    .setLabel('Download MP3')
                                    .setStyle(ButtonStyle.Link)
                            )
                    ];

                    await message.channel.send({ embeds: [embed], components: components });
                } else {
                    // Pronunciation file not available
                    await message.channel.send({ content: 'This pronunciation file is currently unavailable.', ephemeral: true });
                }

                pronunciationFound = true;
                break;
            }
        }

        if (!pronunciationFound) {
            await message.channel.send({ content: `No pronunciation found for \`${term}\`.`, ephemeral: true });
        }
    },
};
