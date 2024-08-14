const { EmbedBuilder } = require('discord.js');
const prototypeTroops = require('../../data/prototypeTroops.json');
const { formatNumber } = require('../../utils/formatNumber');

module.exports = {
    customId: 'select_prototype_troop_level',
    async execute(interaction) {
        const [troopType, level] = interaction.values[0].split('-');
        const levelNum = parseInt(level, 10);

        const troopData = prototypeTroops[troopType];

        if (!troopData) {
            return interaction.reply({ content: 'No data found for the selected troop type.', ephemeral: true });
        }

        if (isNaN(levelNum) || levelNum < 12 || levelNum > troopData.maxLevel) {
            return interaction.reply({ content: `Invalid level! Please provide a level between 12 and ${troopData.maxLevel}.`, ephemeral: true });
        }

        const levelData = troopData.levels[levelNum];
        if (!levelData) {
            return interaction.reply({ content: `No data available for level ${levelNum}.`, ephemeral: true });
        }

        const stats = levelData.stats;
        const trainingCost = levelData.trainingCost || { gold: 0 };

        // Calculate proto tokens cost
        const protoTokenCost = levelNum < 26 ? 250 + (levelNum - 12) * 100 : 2500;

        const embed = new EmbedBuilder()
            .setTitle(`${troopData.name} - Level ${levelNum}`)
            .setDescription(troopData.description || 'No description available.')
            .addFields(
                { name: 'Health', value: formatNumber(stats.health), inline: true },
                { name: 'DPS', value: formatNumber((stats.damage / (troopData.attackSpeed / 1000)).toFixed(2)), inline: true },
                { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                { name: 'Training Cost', value: `Gold: ${formatNumber(trainingCost.gold)}`, inline: true },
                { name: 'Upgrade Cost', value: `Proto Tokens: ${formatNumber(protoTokenCost)}`, inline: true },
                { name: 'Unit Size', value: formatNumber(troopData.unitSize), inline: true },
                { name: 'Training Time', value: troopData.trainingTime || 'Unknown', inline: true },
                { name: 'Movement Speed', value: troopData.movementSpeed || 'Unknown', inline: true },
                { name: 'Attack Range', value: formatNumber(troopData.attackRange), inline: true },
                { name: 'Attack Speed', value: troopData.attackSpeed ? `${troopData.attackSpeed} ms` : 'Unknown', inline: true },
                { name: 'Armory Level Required', value: levelData.armoryRequired ? `Armory Level ${levelData.armoryRequired}` : 'Not specified', inline: true }
            )
            .setColor('#0099ff');

        await interaction.update({ embeds: [embed], components: [] });
    }
};
