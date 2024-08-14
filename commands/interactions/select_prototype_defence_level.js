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
        const attackSpeed = defenceData.attackSpeed || 'Unknown';
        const range = defenceData.range || 'Unknown';
        const marks = levelData.marks || 'Not specified';
        const image = levelData.image || '';

        const dps = attackSpeed !== 'Unknown' ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';

        const embed = new EmbedBuilder()
            .setTitle(`${defenceData.name} - Level ${levelNum}`)
            .setDescription(defenceData.description || 'No description available.')
            .setThumbnail(image)
            .addFields(
                { name: 'Health', value: formatNumber(stats.health), inline: true },
                { name: 'DPS', value: formatNumber(dps), inline: true },
                { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                { name: 'Range', value: `${formatNumber(range)} Tiles`, inline: true },
                { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${attackSpeed} ms` : 'Unknown', inline: true },
                { name: 'Build Cost', value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`, inline: true },
                { name: 'Build Time', value: `${levelData.buildTime || 'Not available'}`, inline: true },
                { name: 'Weapon Lab Required', value: `${levelData.weaponLabRequired || 'Not available'}`, inline: true },
                { name: 'Marks', value: marks.toString(), inline: true }
            )
            .setColor('#0099ff');

        await interaction.update({ embeds: [embed], components: [] });
    }
};
