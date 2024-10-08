const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'submit',
    description: 'Submit a report or suggestion.',
	permissions: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
    async execute(message, args) {
        // Create an embed
        const embed = new EmbedBuilder()
            .setTitle('Submit a Report or Suggestion')
            .setDescription('Click the button below to submit your report or suggestion.')
            .setColor('#00AAFF');

        // Create a button
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('submit_report')
                    .setLabel('Submit Report')
                    .setStyle(ButtonStyle.Primary)
            );

        // Send the embed with the button
        await message.reply({ embeds: [embed], components: [row] });
    }
};