const { EmbedBuilder } = require('discord.js');
const prototypeDefences = require('../../data/prototypeDefences.json');
const { formatNumber } = require('../../utils/formatNumber');

module.exports = {
    customId: 'select_prototype_defence_level',
    async execute(interaction) {
        const [defenceType, level] = interaction.values[0].split('-');
        const levelNum = parseInt(level, 10);

        const defenceData = prototypeDefences[defenceType];

        if (!defenceData) {
            return interaction.reply({ content: 'No data found for the selected prototype defence type.', ephemeral: true });
        }

        if (isNaN(levelNum) || levelNum < 1 || levelNum > defenceData.maxLevel) {
            return interaction.reply({ content: `Invalid level! Please provide a level between 1 and ${defenceData.maxLevel}.`, ephemeral: true });
        }

        const levelData = defenceData.levels[levelNum];
        if (!levelData) {
            return interaction.reply({ content: `No data available for level ${levelNum}.`, ephemeral: true });
        }

        const stats = levelData.stats;
        const buildCost = levelData.buildCost || { fuses: 0, gears: 0, rods: 0, capacitors: 0 };
        const range = defenceData.range || 'Unknown';
        const marks = levelData.marks || 'Not specified';
        const image = levelData.image || '';
        let attackSpeed = defenceData.attackSpeed || 'Unknown';
        if (defenceType === 'grappler') {
            // Special handling for Grappler
            if (levelNum >= 2) {
                attackSpeed = 5000 - (level - 1) * 1000; // Reduces by 1s per level from level 2
            }
        } else if (defenceType === 'simo') {
            // Special handling for S.I.M.O.
            if (levelNum >= 2) {
                attackSpeed = 2000 - (level - 1) * 500; // Reduces by 0.5s per level from level 2
            }
        }

        const dps = attackSpeed !== 'Unknown' ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';

        // Handle special stats for certain prototype defences
        let special = '';
        if (defenceType === 'shock_blaster') {
            special = levelNum === 1 ? 'Stuns enemies for 0.6s with each hit; reapplies' :
                    levelNum === 2 ? 'Stuns enemies for 0.8s with each hit; reapplies' :
                    'Stuns enemies for 1s with each hit; reapplies';
        } else if (defenceType === 'damage_amplifier') {
            special = levelNum === 1 ? 'Provides 50% damage boost to nearby defences' :
                    levelNum === 2 ? 'Provides 75% damage boost to nearby defences' :
                    'Provides 100% damage boost to nearby defences';
        } else if (defenceType === 'shield_generator') {
            special = levelNum === 1 ? 'Gives the Headquarters 50% of shield equivalent to its maximum HP' :
                    levelNum === 2 ? 'Gives the Headquarters 100% of shield equivalent to its maximum HP' :
                    'Gives the Headquarters 150% of shield equivalent to its maximum HP';
        } else if (defenceType === 'simo') {
            special = levelNum === 1 ? 'Can see through smokescreens; targets low-health enemies' :
                    levelNum === 2 ? 'Can see through smokescreens; targets low-health enemies' :
                    'Can see through smokescreens; targets low-health enemies';
        } else if (defenceType === 'shy_shield') {
            special = levelNum === 1 ? 'Creates a shield around itself against Gunboat Weaponry' :
                    levelNum === 2 ? 'Creates a shield around itself against Gunboat Weaponry' :
                    'Creates a shield around itself against Gunboat Weaponry';
        } else if (defenceType === 'flotsam_cannon') {
            special = levelNum === 1 ? 'Deals 2,000 death damage upon defeat; 6.5 tiles of radius; 3-second delay' :
                    levelNum === 2 ? 'Deals 2,400 death damage upon defeat; 6.5 tiles of radius; 3-second delay' :
                    'Deals 3,000 death damage upon defeat; 6.5 tiles of radius; 3-second delay';
        }

        const embed = new EmbedBuilder()
                .setTitle(`${defenceData.name} - Level ${level}`)
                .setDescription(defenceData.description || 'No description available.')
                .setThumbnail(image)
                .setColor('#0099ff');

            // Handle unique stats for certain protodefences
            if (defenceType === 'sky_shield') {
                embed.addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'Shield Health', value: formatNumber(stats.shieldHealth), inline: true },
                    { name: 'Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)} ms` : 'Unknown', inline: true },
                    { name: 'Build Cost', value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`, inline: true },
                    { name: 'Build Time', value: `${levelData.buildTime || 'Not available'}`, inline: true },
                    { name: 'Weapon Lab Required', value: `${levelData.weaponLabRequired || 'Not available'}`, inline: true },
                    { name: 'Marks', value: marks.toString(), inline: true },
                    { name: 'Special', value: special || 'None', inline: true }
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
                    { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)} ms` : 'Unknown', inline: true },
                    { name: 'Build Cost', value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`, inline: true },
                    { name: 'Build Time', value: `${levelData.buildTime || 'Not available'}`, inline: true },
                    { name: 'Weapon Lab Required', value: `${levelData.weaponLabRequired || 'Not available'}`, inline: true },
                    { name: 'Marks', value: marks.toString(), inline: true },
                    { name: 'Special', value: special || 'None', inline: true }
                );
            }

        await interaction.update({ embeds: [embed], components: [] });
    }
};
