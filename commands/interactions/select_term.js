const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder } = require('discord.js');
const dictionary = require('../../data/dictionary.json');

module.exports = {
    customId: 'select_term',
    async execute(interaction) {
        const selectedTerm = interaction.values[0];
        let categoryFound = false;

        // Find the category and term
        for (const [category, terms] of Object.entries(dictionary)) {
            if (terms[selectedTerm]) {
                const termData = terms[selectedTerm];
                const definition = termData.definition;
                const terminology = termData.terminology;

                const embed = new EmbedBuilder()
                    .setTitle(`Boom Dictionary: ${selectedTerm}`)
                    .setDescription(definition)
                    .addFields(
                        { name: 'Category', value: category },
                        { name: 'Terminology', value: terminology || 'Not provided' }
                    )
                    .setColor('#0099ff');

                await interaction.update({ embeds: [embed], components: [] });
                categoryFound = true;
                break;
            }
        }

        if (!categoryFound) {
            await interaction.reply({ content: 'Term not found!', ephemeral: true });
        }
    }
};
