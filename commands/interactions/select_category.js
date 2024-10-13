const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder } = require('discord.js');
const dictionary = require('../../data/dictionary.json');

module.exports = {
    customId: 'select_category',
    async execute(interaction) {
        // Retrieve the selected category from the interaction
        const selectedCategory = interaction.values[0];
        const categoryData = dictionary[selectedCategory];

        // Check if the category data exists
        if (!categoryData) {
            await interaction.reply({ content: 'Category not found!', ephemeral: true });
            return;
        }

        // Extract the description for the selected category
        const description = categoryData.description || 'No description available for this category.';

        // Create term options from the selected category's terms
        const termOptions = Object.keys(categoryData)
            .filter(term => typeof categoryData[term] === 'object' && categoryData[term].terminology) // Only include terms that are objects with a "terminology" key
            .map(term =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(categoryData[term].terminology)
                    .setValue(term)
            );

        // Check if there are term options available
        if (termOptions.length === 0) {
            await interaction.reply({ content: 'No terms available for this category.', ephemeral: true });
            return;
        }

        // Create a select menu for terms
        const termSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_term')
            .setPlaceholder('Select a term')
            .addOptions(termOptions);

        // Create an action row to hold the select menu
        const row = new ActionRowBuilder().addComponents(termSelectMenu);

        // Create the embed to display the category title and description
        const embed = new EmbedBuilder()
            .setTitle(selectedCategory) // Set the title to the selected category
            .setDescription(description) // Set the description from the category data
            .setColor('#0099ff'); // Set embed color

        // Update the interaction with the new embed and components
        await interaction.update({ embeds: [embed], components: [row] });
    }
};