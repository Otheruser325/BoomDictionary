const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('submit')
        .setDescription('Submit a report or suggestion.'),
        
    async execute(interaction) {
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
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};