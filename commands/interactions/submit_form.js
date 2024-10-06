module.exports = {
    customId: 'report_form',
    async execute(interaction) {
        // Retrieve the form data
        const reason = interaction.fields.getTextInputValue('report_reason');
        const details = interaction.fields.getTextInputValue('report_details');

        // Send the report to the developer (Otheruser325)
        const developerUser = await interaction.client.users.fetch('822964244697710612');
        await developerUser.send(`New report submitted by ${interaction.user.tag}:\n\n**Reason:** ${reason}\n**Details:** ${details}`);

        // Send a response to the user
        await interaction.reply({ content: 'Thank you for your report! It has been submitted.', ephemeral: true });
    }
};