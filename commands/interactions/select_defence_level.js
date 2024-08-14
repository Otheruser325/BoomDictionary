const { EmbedBuilder } = require('discord.js');
const defences = require('../../data/defences.json');
const { formatNumber } = require('../../utils/formatNumber');

// Mapping user-friendly names to actual keys in defences.json
const validDefenceTypes = {
    'sniper tower': 'sniper_tower',
    'mortar': 'mortar',
    'machine gun': 'machine_gun',
    'cannon': 'cannon',
    'flamethrower': 'flamethrower',
    'boom cannon': 'boom_cannon',
    'rocket launcher': 'rocket_launcher',
    'critter launcher': 'critter_launcher',
    'shock launcher': 'shock_launcher'
};

module.exports = {
    customId: 'select_defence_level',
    async execute(interaction) {
        const selectedLevel = parseInt(interaction.values[0], 10);
        const message = interaction.message;
        const originalInteraction = message.interaction;
        const selectedDefenceType = originalInteraction?.customId;

        const defenceType = validDefenceTypes[selectedDefenceType];

        if (!defenceType) {
            return interaction.reply({ content: 'Invalid defence type selected!', ephemeral: true });
        }

        const defenceData = defences[defenceType];

        if (!defenceData) {
            return interaction.reply({ content: 'No data found for the selected defence type.', ephemeral: true });
        }

        if (selectedLevel < 1 || selectedLevel > defenceData.maxLevel) {
            return interaction.reply({ content: `Invalid level! Please provide a level between 1 and ${defenceData.maxLevel}.`, ephemeral: true });
        }

        const levelData = defenceData.levels[selectedLevel];
        if (!levelData) {
            return interaction.reply({ content: `No data available for level ${selectedLevel}.`, ephemeral: true });
        }

        const stats = levelData.stats;
        const upgradeCost = levelData.upgradeCost || { wood: 0, stone: 0, iron: 0 };
        const attackSpeed = defenceData.attackSpeed || 'Unknown'; // Attack speed in milliseconds
        const range = defenceData.range || 'Unknown'; // Range in game units
        const hqRequired = levelData.hqRequired || 'Not specified'; // HQ level required

        // Calculate DPS
        const dps = attackSpeed !== 'Unknown' ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';

        const embed = new EmbedBuilder()
            .setTitle(`${defenceData.name} - Level ${selectedLevel}`)
            .setDescription(defenceData.description || 'No description available.')
            .addFields(
                { name: 'Health', value: formatNumber(stats.health), inline: true },
                { name: 'DPS', value: formatNumber(dps), inline: true },
                { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                { name: 'Range', value: `${formatNumber(range)} Tiles`, inline: true },
                { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${attackSpeed} ms` : 'Unknown', inline: true },
                { name: 'Upgrade Cost', value: `Wood: ${formatNumber(upgradeCost.wood)}\nStone: ${formatNumber(upgradeCost.stone)}\nIron: ${formatNumber(upgradeCost.iron)}`, inline: true },
                { name: 'Upgrade Time', value: `${levelData.upgradeTime || 'Not available'}`, inline: true },
                { name: 'HQ Required', value: hqRequired.toString(), inline: true }
            )
            .setColor('#0099ff');

        await interaction.update({ embeds: [embed], components: [] });
    }
};
