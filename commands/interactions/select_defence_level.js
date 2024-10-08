const { EmbedBuilder } = require('discord.js');
const defences = require('../../data/defences.json');
const { formatNumber } = require('../../utils/formatNumber');

module.exports = {
    customId: 'select_defence_level',
    async execute(interaction) {
        const [defenceType, level] = interaction.values[0].split('-');
        const levelNum = parseInt(level, 10);

        const defenceData = defences[defenceType];

        if (!defenceData) {
            return interaction.reply({ content: 'No data found for the selected defence type.', ephemeral: true });
        }

        if (isNaN(levelNum) || levelNum < 1 || levelNum > defenceData.maxLevel) {
            return interaction.reply({ content: `Invalid level! Please provide a level between 1 and ${defenceData.maxLevel}.`, ephemeral: true });
        }

        const levelData = defenceData.levels[levelNum];
        if (!levelData) {
            return interaction.reply({ content: `No data available for level ${levelNum}.`, ephemeral: true });
        }

        const stats = levelData.stats;
        const upgradeCost = levelData.upgradeCost || { wood: 0, stone: 0, iron: 0 };
        const attackSpeed = defenceData.attackSpeed || 'Unknown';
        const range = defenceData.range || 'Unknown';
        const hqRequired = levelData.hqRequired || 'N/A';
        const image = levelData.image || '';

        const dps = attackSpeed !== 'Unknown' ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';

        const embed = new EmbedBuilder()
                .setTitle(`${defenceData.name} - Level ${level}`)
                .setDescription(defenceData.description || 'No description available.')
                .setColor('#0099ff');
				
			if (image) {
                embed.setThumbnail(image);
            }

            // Handle unique stats for certain defences
            if (defenceType === 'shock_launcher') {
                embed.addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'DPS', value: formatNumber(dps), inline: true },
                    { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                    { name: 'Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown', inline: true },
                    { name: 'Shock Duration', value: `${formatNumber(stats.stunDuration)} seconds`, inline: true },
                    { name: 'Upgrade Cost', value: `Wood: ${formatNumber(upgradeCost.wood)}\nStone: ${formatNumber(upgradeCost.stone)}\nIron: ${formatNumber(upgradeCost.iron)}`, inline: true },
                    { name: 'Upgrade Time', value: `${levelData.upgradeTime || 'Not available'}`, inline: true },
                    { name: 'HQ Required', value: hqRequired.toString(), inline: true }
                );
            } else {
                // Handle general defence stats
                let dps = 'N/A';
                let damagePerShot = 'N/A';

                if (stats.damage !== null) {
                    dps = (stats.damage / (defenceData.attackSpeed / 1000)).toFixed(2);
                    damagePerShot = stats.damage.toString();
                }
                embed.addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'DPS', value: formatNumber(dps), inline: true },
                    { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                    { name: 'Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown', inline: true },
                    { name: 'Upgrade Cost', value: `Wood: ${formatNumber(upgradeCost.wood)}\nStone: ${formatNumber(upgradeCost.stone)}\nIron: ${formatNumber(upgradeCost.iron)}`, inline: true },
                    { name: 'Upgrade Time', value: `${levelData.upgradeTime || 'Not available'}`, inline: true },
                    { name: 'HQ Required', value: hqRequired.toString(), inline: true }
                );
            }

        await interaction.update({ embeds: [embed], components: [] });
    }
};
