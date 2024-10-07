const { EmbedBuilder } = require('discord.js');
const gunboatAbilities = require('../../data/gunboatAbilities.json');
const { formatNumber } = require('../../utils/formatNumber');

module.exports = {
    customId: 'select_gunboat_ability_level',
    async execute(interaction) {
        const [abilityType, level] = interaction.values[0].split('-');
        const levelNum = parseInt(level, 10);

        const abilityData = gunboatAbilities[abilityType];

        if (!abilityData) {
            return interaction.reply({ content: 'No data found for the selected gunboat ability type.', ephemeral: true });
        }

        if (isNaN(levelNum) || levelNum < 1 || levelNum > abilityData.maxLevel) {
            return interaction.reply({ content: `Invalid level! Please provide a level between 1 and ${abilityData.maxLevel}.`, ephemeral: true });
        }

        const levelData = abilityData.levels[levelNum];
        if (!levelData) {
            return interaction.reply({ content: `No data available for level ${levelNum}.`, ephemeral: true });
        }

        const stats = levelData.stats;
        const researchCost = levelData.researchCost || 'N/A';
        const armoryRequired = levelData.armoryRequired || 'N/A';
        const image = levelData.image || '';

        const embed = new EmbedBuilder()
                .setTitle(`${abilityData.name} - Level ${level}`)
                .setDescription(abilityData.description || 'No description available.')
                .setColor('#0099ff');
				
			if (image) {
                embed.setThumbnail(image);
            }

            // Handle unique stats for gunboat abilities
            if (abilityType === 'artillery') {
                embed.addFields(
                    { name: 'Damage', value: formatNumber(stats.damage), inline: true },
					{ name: 'Energy Cost', value: formatNumber(abilityData.energyCost), inline: true },
					{ name: `Energy Cost Increase per ${abilityData.name}`, value: formatNumber(abilityData.energyCostIncreasePerUse), inline: true },
					{ name: 'Explosion Radius', value: `${formatNumber(abilityData.explosionRadius)} Tiles`, inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                    { name: 'Research Time', value: `${levelData.upgradeTime || 'N/A'}`, inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            } else if (abilityType === 'flare') {
                embed.addFields(
                    { name: 'Duration', value: `${formatNumber(stats.duration)}s`, inline: true },
					{ name: 'Energy Cost', value: formatNumber(abilityData.energyCost), inline: true },
					{ name: `Energy Cost Increase per ${abilityData.name}`, value: formatNumber(abilityData.energyCostIncreasePerUse), inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold) || 'N/A'}`, inline: true },
                    { name: 'Research Time', value: `${levelData.upgradeTime || 'N/A'}`, inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            } else if (abilityType === 'medkit') {
                embed.addFields(
                    { name: 'Healing per Pulse', value: formatNumber(stats.healingPerPulse), inline: true },
					{ name: 'Total Heal', value: formatNumber(stats.totalHeal), inline: true },
					{ name: 'Energy Cost', value: formatNumber(abilityData.energyCost), inline: true },
					{ name: `Energy Cost Increase per ${abilityData.name}`, value: formatNumber(abilityData.energyCostIncreasePerUse), inline: true },
					{ name: 'Healing Radius', value: `${formatNumber(abilityData.healingRadius)} Tiles`, inline: true },
					{ name: 'Duration', value: `${formatNumber(abilityData.duration)}s`, inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                    { name: 'Research Time', value: `${levelData.upgradeTime || 'N/A'}`, inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            } else {
                return message.reply(`Stat data for the gunboat ability ${abilityData.name} is currently unavailable.`);
            }

        await interaction.update({ embeds: [embed], components: [] });
    }
};
