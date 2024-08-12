const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const fs = require('fs');
const dictionary = require('../../data/dictionary.json');
const BASE_URL = 'https://funny-eclair-d437ee.netlify.app';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ipa')
        .setDescription('Get the pronunciation of a word.')
        .addStringOption(option =>
            option.setName('word')
                .setDescription('The word to get the pronunciation for')
                .setRequired(true)),
    async execute(interaction) {
        const term = interaction.options.getString('word').toLowerCase();
        let pronunciationFound = false;

        for (const [category, terms] of Object.entries(dictionary)) {
            const normalizedTerms = Object.fromEntries(
                Object.entries(terms)
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

                const embed = new EmbedBuilder()
                    .setTitle(`Pronunciation for ${terminology || term}`)
                    .setDescription(`Pronunciation: ${pronunciation || 'Not provided'}`)
                    .setColor('#0099ff');

                if (fs.existsSync(mp3FilePath)) {
                    // URL encode the file name
                    const mp3URL = `${BASE_URL}/${encodeURIComponent(formattedFileName)}`;

                    const components = [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('play_pronunciation')
                                    .setLabel('Play Pronunciation')
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setURL(mp3URL)
                                    .setLabel('Download MP3')
                                    .setStyle(ButtonStyle.Link)
                            )
                    ];

                    await interaction.reply({ embeds: [embed], components: components });
                } else {
                    await interaction.reply({ content: 'This pronunciation file is currently unavailable.', ephemeral: true });
                }

                pronunciationFound = true;
                break;
            }
        }

        if (!pronunciationFound) {
            await interaction.reply({ content: `No pronunciation found for \`${term}\`.`, ephemeral: true });
        }
    },
};
