const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const dictionary = require('../../data/dictionary.json');
const BASE_URL = 'https://funny-eclair-d437ee.netlify.app';

module.exports = {
    name: 'ipa',
    description: 'Get the pronunciation of a word.',
	permissions: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
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

                // Format the file name for the pronunciation audio
                const fileName = terminology.toLowerCase().replace(/ /g, '_');
                const mp3FileName = `${fileName}.mp3`; // Name of the file in the server

                const embed = new EmbedBuilder()
                    .setTitle(`Pronunciation for ${terminology}`)
                    .setDescription(`Here is the pronunciation for the word \`${terminology}\`, generated with Microsoft Hazel.`)
                    .addFields(
                        { name: 'Category', value: category },
                        { name: 'Pronunciation', value: pronunciation || 'Not available' }
                    )
                    .setColor('#0099ff');

                const mp3URL = `${BASE_URL}/${mp3FileName}`; // URL to the pronunciation file

                const components = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`play-pronunciation-${fileName}`)
                        .setLabel('Play Pronunciation')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setURL(mp3URL)
                        .setLabel('Download MP3')
                        .setStyle(ButtonStyle.Link)
                );

                await message.channel.send({ embeds: [embed], components: [components] });

                pronunciationFound = true;
                break; // Exit the loop once the term is found
            }
        }

        if (!pronunciationFound) {
            await message.channel.send({ content: `No pronunciation found for \`${term}\`.`, ephemeral: true });
        }
    },
};
