const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const fs = require('fs');
const dictionary = require('../../data/dictionary.json');
const BASE_URL = 'https://funny-eclair-d437ee.netlify.app';

module.exports = {
    name: 'ipa',
    description: 'Get the pronunciation of a word.',
    async execute(message, args) {
        if (args.length === 0) {
            return message.channel.send({ content: 'Please provide a word to get the pronunciation.', ephemeral: true });
        }

        const term = args.join(' ').toLowerCase();
        let pronunciationFound = false;

        for (const [category, terms] of Object.entries(dictionary)) {
            const normalizedTerms = Object.fromEntries(
                Object.entries(terms)
                    .filter(([key, value]) => typeof value === 'object')
                    .map(([key, value]) => [key.toLowerCase(), value])
            );

            if (normalizedTerms[term]) {
                const termData = normalizedTerms[term];
                const { terminology, pronunciation } = termData;

                const fileName = termData.terminology || term;

                const formattedFileName = fileName
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
                    + '.mp3';

                const mp3FilePath = path.join(__dirname, '../../pronunciations', formattedFileName);

                console.log('MP3 File Path:', mp3FilePath); // Debugging line

                const embed = new EmbedBuilder()
                    .setTitle(`Pronunciation for ${terminology || term}`)
                    .setDescription(`Here is the pronunciation for the word \`${terminology || term}\`, generated with Microsoft Hazel.`)
                    .addFields(
                        { name: 'Category', value: category },
                        { name: 'Pronunciation', value: pronunciation || 'Not available' }
                    )
                    .setColor('#0099ff');

                if (fs.existsSync(mp3FilePath)) {
                    // URL encode the file name
                    const mp3URL = `${BASE_URL}/${encodeURIComponent(formattedFileName)}`;
                    
                    const components = [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setURL(mp3URL)
                                    .setLabel('Download MP3')
                                    .setStyle(ButtonStyle.Link)
                            )
                    ];

                    await message.channel.send({ embeds: [embed], components: components });
                } else {
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
