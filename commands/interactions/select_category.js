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

        // Retrieve the category description
        const description = categoryData.description || 'No description available for this category.';

        // Retrieve the term options, filtering out any non-object entries
        const termOptions = Object.keys(categoryData)
            .filter(term => typeof categoryData[term] === 'object') // Only include terms that are objects
            .map(term =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(term)
                    .setValue(term)
            );

        // Create the select menu for terms
        const termSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_term')
            .setPlaceholder('Select a term')
            .addOptions(termOptions);

        // Create an action row with the select menu
        const row = new ActionRowBuilder().addComponents(termSelectMenu);

        // Create the embed with the selected category's title and description
        const embed = new EmbedBuilder()
            .setTitle(`Terms in ${selectedCategory}`)
            .setDescription(description)
            .setColor('#0099ff');

        // Update the interaction with the new embed and components
        await interaction.update({ embeds: [embed], components: [row] });
    }
};
