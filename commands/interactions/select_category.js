const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder } = require('discord.js');
const dictionary = require('../../data/dictionary.json');

module.exports = {
    customId: 'select_category',
    async execute(interaction) {
        const selectedCategory = interaction.values[0];
        const categoryData = dictionary[selectedCategory];

        if (!categoryData) {
            await interaction.reply({ content: 'Category not found!', ephemeral: true });
            return;
        }

        const terms = categoryData; // Directly use category data since terms are part of the category object
        const termOptions = Object.keys(terms)
            .filter(term => typeof terms[term] === 'object') // Only include terms that are objects
            .map(term =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(term)
                    .setValue(term)
            );

        const termSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_term')
            .setPlaceholder('Select a term')
            .addOptions(termOptions);

        const row = new ActionRowBuilder().addComponents(termSelectMenu);

        const embed = new EmbedBuilder()
            .setTitle(`Terms in ${selectedCategory}`)
            .setDescription(categoryData.description || 'No description available for this category.')
            .setColor('#0099ff');

        await interaction.update({ embeds: [embed], components: [row] });
    }
};
