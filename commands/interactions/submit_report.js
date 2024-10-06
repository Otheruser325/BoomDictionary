const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const developerId = '822964244697710612'; // Otheruser325 (developer)

module.exports = {
    customId: 'submit_report',
    async execute(interaction) {
        // Create the modal (form)
        const modal = new ModalBuilder()
            .setCustomId('report_form')
            .setTitle('Submit a Report');

        // Create text input fields
        const reasonInput = new TextInputBuilder()
            .setCustomId('report_reason')
            .setLabel('Reason for Report')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const detailsInput = new TextInputBuilder()
            .setCustomId('report_details')
            .setLabel('Report Details')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        // Add inputs to the modal
        const actionRow1 = new ActionRowBuilder().addComponents(reasonInput);
        const actionRow2 = new ActionRowBuilder().addComponents(detailsInput);

        modal.addComponents(actionRow1, actionRow2);

        // Show the modal to the user
        await interaction.showModal(modal);
    }
};