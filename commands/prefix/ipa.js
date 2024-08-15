const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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

                const fileName = (termData.terminology || term).toLowerCase();
                const formattedFileName = fileName
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ') + '.mp3';

                const embed = new EmbedBuilder()
                    .setTitle(`Pronunciation for ${terminology || term}`)
                    .setDescription(`Here is the pronunciation for the word \`${terminology || term}\`, generated with Microsoft Hazel.`)
                    .addFields(
                        { name: 'Category', value: category },
                        { name: 'Pronunciation', value: pronunciation || 'Not available' }
                    )
                    .setColor('#0099ff');

                const mp3URL = `${BASE_URL}/${encodeURIComponent(formattedFileName)}`;

                const components = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(JSON.stringify({ term: fileName }))  // Ensure customId matches what the interaction handler expects
                        .setLabel('Play Pronunciation')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setURL(mp3URL)
                        .setLabel('Download MP3')
                        .setStyle(ButtonStyle.Link)
                );

                await message.channel.send({ embeds: [embed], components: [components] });

                pronunciationFound = true;
                break;
            }
        }

        if (!pronunciationFound) {
            await message.channel.send({ content: `No pronunciation found for \`${term}\`.`, ephemeral: true });
        }
    },
};
