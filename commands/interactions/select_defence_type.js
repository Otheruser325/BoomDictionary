const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const defences = require('../../data/defences.json');

module.exports = {
    customId: 'select_defence_type',
    async execute(interaction) {
        const selectedDefenceType = interaction.values[0];
        const defenceData = defences[selectedDefenceType];

        if (!defenceData) {
            return interaction.reply({ content: 'Invalid defence type selected!', ephemeral: true });
        }

        const maxOptions = 25;
        const levels = Array.from({ length: defenceData.maxLevel }, (_, i) => i + 1);
        const levelOptions = levels.slice(0, maxOptions).map(level => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(`Level ${level}`)
                .setValue(`${selectedDefenceType}-${level}`)
                .setDescription(defenceData.levels[level]?.upgradeTime || 'No details available.');
        });

        const levelSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_defence_level')
            .setPlaceholder('Select a level')
            .addOptions(levelOptions);

        const row = new ActionRowBuilder().addComponents(levelSelectMenu);

        const embed = new EmbedBuilder()
            .setTitle(`Select a Level for ${defenceData.name}`)
            .setDescription('Please choose a level to view its details.')
            .setColor('#0099ff');

        try {
            await interaction.update({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error('Error updating interaction:', error);
            if (error.code === 10062 || error.code === 40060) {
                return interaction.followUp({ content: 'There was an issue processing your request. Please try again.', ephemeral: true });
            }
        }
    }
};
