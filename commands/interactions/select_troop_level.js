const { EmbedBuilder } = require('discord.js');
const troops = require('../../data/troops.json');
const { formatNumber } = require('../../utils/formatNumber');

module.exports = {
    customId: 'select_troop_level',
    async execute(interaction) {
        const [troopType, level] = interaction.values[0].split('-');
        const levelNum = parseInt(level, 10);

        const troopData = troops[troopType];

        if (!troopData) {
            return interaction.reply({ content: 'No data found for the selected troop type.', ephemeral: true });
        }

        if (isNaN(levelNum) || levelNum < 1 || levelNum > troopData.maxLevel) {
            return interaction.reply({ content: `Invalid level! Please provide a level between 1 and ${troopData.maxLevel}.`, ephemeral: true });
        }

        const levelData = troopData.levels[levelNum];
        if (!levelData) {
            return interaction.reply({ content: `No data available for level ${levelNum}.`, ephemeral: true });
        }

        const stats = levelData.stats;
        const trainingCost = levelData.trainingCost || { gold: 0 };
        const researchCost = levelData.researchCost || { gold: 0 };
        const range = troopData.attackRange;
        const image = troopData.image || '';
        const attackSpeed = troopData.attackSpeed;
        const dps = attackSpeed ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';
        const armoryRequired = levelData.armoryRequired || 'Not specified';

        const embed = new EmbedBuilder()
            .setTitle(`${troopData.name} - Level ${levelNum}`)
            .setDescription(troopData.description || 'No description available.')
            .setThumbnail(image)
            .addFields(
                { name: 'Health', value: formatNumber(stats.health), inline: true },
                { name: 'DPS', value: formatNumber(dps), inline: true },
                { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                { name: 'Training Cost', value: `Gold: ${formatNumber(trainingCost.gold)}`, inline: true },
                { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                { name: 'Unit Size', value: formatNumber(troopData.unitSize), inline: true },
                { name: 'Training Time', value: troopData.trainingTime || 'Unknown', inline: true },
                { name: 'Movement Speed', value: troopData.movementSpeed || 'Unknown', inline: true },
                { name: 'Attack Range', value: `${formatNumber(range)} Tiles`, inline: true },
                { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)} ms` : 'Unknown', inline: true },
                { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
            )
            .setColor('#0099ff');

        await interaction.update({ embeds: [embed], components: [] });
    }
};
