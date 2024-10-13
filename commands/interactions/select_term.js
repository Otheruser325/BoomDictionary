const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder } = require('discord.js');
const dictionary = require('../../data/dictionary.json');

module.exports = {
    customId: 'select_term',
    async execute(interaction) {
        const selectedTerm = interaction.values[0];
        let termFound = false;

        // Find the category and term
        for (const [category, terms] of Object.entries(dictionary)) {
            if (terms[selectedTerm]) {
                const termData = terms[selectedTerm];
                const { terminology, definition, class: termClass, origin, pronunciation } = termData;

                const embed = new EmbedBuilder()
                    .setTitle(`Boom Dictionary: ${terminology || selectedTerm}`)
                    .setDescription(definition)
                    .addFields(
                        { name: 'Category', value: category },
                        { name: 'Terminology', value: terminology || 'Not provided' },
                        { name: 'Class', value: termClass || 'Not provided' },
                        { name: 'Origin', value: origin || 'Not provided' },
                        { name: 'Pronunciation', value: pronunciation || 'Not provided' }
                    )
                    .setColor('#0099ff');

                await interaction.update({ embeds: [embed], components: [] });
                termFound = true;
                break;
            }
        }

        if (!termFound) {
            await interaction.reply({ content: 'Term not found!', ephemeral: true });
        }
    }
};