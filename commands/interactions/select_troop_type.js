const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const troops = require('../../data/troops.json');

module.exports = {
    customId: 'select_troop_type',
    async execute(interaction) {
        const selectedTroopType = interaction.values[0];
        const troopData = troops[selectedTroopType];

        if (!troopData) {
            return interaction.reply({ content: 'No data found for the selected troop type.', ephemeral: true });
        }

        // Create the level options menu
        const maxOptions = 25;
        const levels = Array.from({ length: troopData.maxLevel }, (_, i) => i + 1);
        const levelOptions = levels.slice(0, maxOptions).map(level => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(`Level ${level}`)
                .setValue(`${selectedTroopType}-${level}`) // Embed troop type and level into value
                .setDescription(troopData.levels[level]?.armoryRequired ? `Armory Level ${troopData.levels[level].armoryRequired}` : 'No details available.');
        });

        const levelSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_troop_level')
            .setPlaceholder('Select a level')
            .addOptions(levelOptions);

        const row = new ActionRowBuilder().addComponents(levelSelectMenu);

        const embed = new EmbedBuilder()
            .setTitle(`Select a Level for ${troopData.name}`)
            .setDescription('Please choose a level to view its details.')
            .setColor('#0099ff');

        await interaction.update({ embeds: [embed], components: [row] });
    }
};
