const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder } = require('discord.js');
const dictionary = require('../../data/dictionary.json');

module.exports = {
    customId: 'select_category',
    async execute(interaction) {
        const categories = Object.keys(dictionary);

        const categoryOptions = categories.map(category => 
            new StringSelectMenuOptionBuilder()
                .setLabel(category)
                .setValue(category)
        );

        const categorySelectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_category')
            .setPlaceholder('Select a category')
            .addOptions(categoryOptions);

        const row = new ActionRowBuilder().addComponents(categorySelectMenu);

        const embed = new EmbedBuilder()
            .setTitle('Boom Dictionary Categories')
            .setDescription('Select a category to view terms.')
            .setColor('#0099ff');

        await interaction.update({ embeds: [embed], components: [row] });
    }
};
