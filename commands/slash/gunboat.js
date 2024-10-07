const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const gunboatAbilities = require('../../data/gunboatAbilities.json');
const { formatNumber } = require('../../utils/formatNumber');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gunboat')
        .setDescription('Get statistics for a specific type of gunboat ability.')
        .addStringOption(option =>
            option.setName('ability_type')
                .setDescription('Type of gunboat ability')
                .setRequired(true)
                .addChoices(
                    { name: 'Artillery', value: 'artillery' },
                    { name: 'Flare', value: 'flare' },
                    { name: 'Medkit', value: 'medkit' },
                    { name: 'Shock Bomb', value: 'shock_bomb' },
                    { name: 'Barrage', value: 'barrage' },
                    { name: 'Smoke Screen', value: 'smokescreen' },
                    { name: 'Critters', value: 'critters' }
                )
        )
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Level of the gunboat ability')
                .setRequired(true)
        ),
    async execute(interaction) {
        const abilityType = interaction.options.getString('ability_type');
        const level = interaction.options.getInteger('level');
        const abilityData = gunboatAbilities[abilityType];

        if (!abilityData) {
            return interaction.reply({ content: 'Invalid gunboat ability!', ephemeral: true });
        }

        if (level < 1 || level > (abilityData.maxLevel || 1)) {
            return interaction.reply({ content: `Invalid level! Please provide a level between 1 and ${abilityData.maxLevel}.`, ephemeral: true });
        }

        const levelData = abilityData.levels[level];
        if (!levelData) {
            return interaction.reply({ content: `No data available for level ${level}.`, ephemeral: true });
        }

        const stats = levelData.stats;
        const researchCost = levelData.researchCost || 'N/A';
        const armoryRequired = levelData.armoryRequired || 'N/A';
        const image = abilityData.image || null;

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

        await interaction.reply({ embeds: [embed] });
    },
};