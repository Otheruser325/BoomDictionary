const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const dictionary = require('../../data/dictionary.json'); // Load the dictionary file
const path = require('path');
const fs = require('fs');
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
        const word = interaction.options.getString('word').toLowerCase();
        let wordData = null;

        // Find the term in the dictionary
        for (const [category, terms] of Object.entries(dictionary)) {
            const normalizedTerms = Object.fromEntries(
                Object.entries(terms).map(([key, value]) => [key.toLowerCase(), value])
            );

            if (normalizedTerms[word]) {
                wordData = normalizedTerms[word];
                break;
            }
        }

        if (wordData) {
            const { terminology, pronunciation } = wordData;
            const formattedFileName = terminology
                ? terminology.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                : word;
            
            const mp3FilePath = path.join(__dirname, '../../pronunciations', `${formattedFileName}.mp3`);
            
            const embed = new EmbedBuilder()
                .setTitle(`Pronunciation for ${terminology || word}`)
                .setDescription(`Pronunciation: ${pronunciation || 'Not provided'}`)
                .setColor('#0099ff');

            if (fs.existsSync(mp3FilePath)) {
                // URL encode the file name
                const mp3URL = `${encodeURIComponent(formattedFileName)}.mp3`;
                const components = [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('play_pronunciation')
                                .setLabel('Play Pronunciation')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setURL(`${mp3URL}`)
                                .setLabel('Download MP3')
                                .setStyle(ButtonStyle.Link)
                        )
                ];

                await interaction.reply({ embeds: [embed], components: components });
            } else {
                await interaction.reply({ content: 'This pronunciation file is currently unavailable.', ephemeral: true });
            }
        } else {
            await interaction.reply({ content: `No pronunciation found for \`${word}\`.`, ephemeral: true });
        }
    },
};
