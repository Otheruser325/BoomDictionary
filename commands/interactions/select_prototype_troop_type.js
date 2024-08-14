const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const prototypeTroops = require('../../data/prototypeTroops.json');

module.exports = {
    customId: 'select_prototype_troop_type',
    async execute(interaction) {
        const selectedTroopType = interaction.values[0];
        const troopData = prototypeTroops[selectedTroopType];

        if (!troopData) {
            return interaction.reply({ content: 'No data found for the selected troop type.', ephemeral: true });
        }

        const maxOptions = 25;
        const levels = Array.from({ length: troopData.maxLevel - 11 }, (_, i) => i + 12); // Levels start from 12
        const levelOptions = levels.slice(0, maxOptions).map(level => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(`Level ${level}`)
                .setValue(`${selectedTroopType}-${level}`)
                .setDescription(troopData.levels[level]?.armoryRequired ? `Armory Level ${troopData.levels[level].armoryRequired}` : 'No details available.');
        });

        const levelSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_prototype_troop_level')
            .setPlaceholder('Select a level')
            .addOptions(levelOptions);

        const row = new ActionRowBuilder().addComponents(levelSelectMenu);

        const embed = new EmbedBuilder()
            .setTitle(`Select a Level for ${troopData.name}`)
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
