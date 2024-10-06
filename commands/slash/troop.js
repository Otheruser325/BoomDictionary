const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const troops = require('../../data/troops.json');
const { formatNumber } = require('../../utils/formatNumber');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('troop')
        .setDescription('Get statistics for a specific type of troop.')
        .addStringOption(option =>
            option.setName('troop_type')
                .setDescription('Type of troop')
                .setRequired(true)
                .addChoices(
                    { name: 'Rifleman', value: 'rifleman' },
                    { name: 'Heavy', value: 'heavy' },
                    { name: 'Zooka', value: 'zooka' },
                    { name: 'Warrior', value: 'warrior' },
                    { name: 'Tank', value: 'tank' },
                    { name: 'Medic', value: 'medic' },
                    { name: 'Grenadier', value: 'grenadier' },
					{ name: 'Scorcher', value: 'scorcher' },
                    { name: 'Cryoneer', value: 'cryoneer' },
					{ name: 'Bombardier', value: 'bombardier' }
                )
        )
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Level of the troop')
                .setRequired(true)
        ),
    async execute(interaction) {
        const troopType = interaction.options.getString('troop_type');
        const level = interaction.options.getInteger('level');
        const troopData = troops[troopType];

        if (!troopData) {
            return interaction.reply({ content: 'Invalid troop type!', ephemeral: true });
        }

        if (level < 1 || level > (troopData.maxLevel || 1)) {
            return interaction.reply({ content: `Invalid level! Please provide a level between 1 and ${troopData.maxLevel}.`, ephemeral: true });
        }

        const levelData = troopData.levels[level];
        if (!levelData) {
            return interaction.reply({ content: `No data available for level ${level}.`, ephemeral: true });
        }

        const stats = levelData.stats;
        const trainingCost = levelData.trainingCost || { gold: 0 };
        const researchCost = levelData.researchCost || { gold: 0 };
        const attackSpeed = troopData.attackSpeed;
        const range = troopData.attackRange || 'Unknown';
        const image = troopData.image || '';
        const dps = attackSpeed ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';
		const hps = attackSpeed ? (stats.healing / (attackSpeed / 1000)).toFixed(2) : 'Unknown';
        const armoryRequired = levelData.armoryRequired || 'Not specified';

        const embed = new EmbedBuilder()
                .setTitle(`${troopData.name} - Level ${level}`)
                .setDescription(troopData.description || 'No description available.')
                .setColor('#0099ff');
				
			if (image) {
                embed.setThumbnail(image);
            }

            // Handle unique stats for certain troops
            if (troopType === 'warrior') {
                embed.addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'DPS', value: formatNumber(dps), inline: true },
                    { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                    { name: 'Healing per Attack', value: formatNumber(stats.selfHeal), inline: true },
                    { name: 'Training Cost', value: `Gold: ${formatNumber(trainingCost.gold)}`, inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                    { name: 'Unit Size', value: formatNumber(troopData.unitSize), inline: true },
                    { name: 'Training Time', value: troopData.trainingTime || 'Unknown', inline: true },
                    { name: 'Movement Speed', value: troopData.movementSpeed || 'Unknown', inline: true },
                    { name: 'Attack Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown', inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            } else if (troopType === 'medic') {
                embed.addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'Healing Per Second', value: formatNumber(hps), inline: true },
                    { name: 'Healing Per Shot', value: formatNumber(stats.healing), inline: true },
                    { name: 'Training Cost', value: `Gold: ${formatNumber(trainingCost.gold)}`, inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                    { name: 'Unit Size', value: formatNumber(troopData.unitSize), inline: true },
                    { name: 'Training Time', value: troopData.trainingTime || 'Unknown', inline: true },
                    { name: 'Movement Speed', value: troopData.movementSpeed || 'Unknown', inline: true },
                    { name: 'Heal Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Heal Speed', value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown', inline: true },
					{ name: 'Heal Type', value: `Splash (${formatNumber(troopData.splashRadius)} Tiles)`, inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            } else if (troopType === 'cryoneer') {
                embed.addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'DPS', value: formatNumber(dps), inline: true },
                    { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                    { name: 'Freeze Power', value: `${formatNumber(troopData.speedReduction)}%`, inline: true },
                    { name: 'Freeze Duration', value: `${formatNumber(troopData.freezeDuration)} seconds`, inline: true },
                    { name: 'Training Cost', value: `Gold: ${formatNumber(trainingCost.gold)}`, inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                    { name: 'Unit Size', value: formatNumber(troopData.unitSize), inline: true },
                    { name: 'Training Time', value: troopData.trainingTime || 'Unknown', inline: true },
                    { name: 'Movement Speed', value: troopData.movementSpeed || 'Unknown', inline: true },
                    { name: 'Attack Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown', inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            } else if (troopType === 'grenadier' || troopType === 'bombardier') {
                embed.addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'DPS', value: formatNumber(dps), inline: true },
                    { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                    { name: 'Splash Radius', value: `${formatNumber(troopData.splashRadius)} Tiles`, inline: true },
                    { name: 'Training Cost', value: `Gold: ${formatNumber(trainingCost.gold)}`, inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                    { name: 'Unit Size', value: formatNumber(troopData.unitSize), inline: true },
                    { name: 'Training Time', value: troopData.trainingTime || 'Unknown', inline: true },
                    { name: 'Movement Speed', value: troopData.movementSpeed || 'Unknown', inline: true },
                    { name: 'Attack Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown', inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            } else if (troopType === 'scorcher') {
                embed.addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'DPS', value: formatNumber(dps), inline: true },
                    { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                    { name: 'Death Damage', value: `${formatNumber(stats.deathDamage)}`, inline: true },
					{ name: 'Death Radius', value: `${formatNumber(troopData.deathRadius)} Tiles`, inline: true },
                    { name: 'Training Cost', value: `Gold: ${formatNumber(trainingCost.gold)}`, inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                    { name: 'Unit Size', value: formatNumber(troopData.unitSize), inline: true },
                    { name: 'Training Time', value: troopData.trainingTime || 'Unknown', inline: true },
                    { name: 'Movement Speed', value: troopData.movementSpeed || 'Unknown', inline: true },
                    { name: 'Attack Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown', inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            } else {
                // Handle general troop stats
                let dps = 'N/A';
                let damagePerShot = 'N/A';

                if (stats.damage !== null) {
                    dps = (stats.damage / (troopData.attackSpeed / 1000)).toFixed(2);
                    damagePerShot = stats.damage.toString();
                }
                embed.addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'DPS', value: formatNumber(dps), inline: true },
                    { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                    { name: 'Training Cost', value: `Gold: ${formatNumber(trainingCost.gold)}`, inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                    { name: 'Unit Size', value: formatNumber(troopData.unitSize), inline: true },
                    { name: 'Training Time', value: troopData.trainingTime || 'Unknown', inline: true },
                    { name: 'Movement Speed', value: troopData.movementSpeed || 'Unknown', inline: true },
                    { name: 'Attack Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown', inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            }

        await interaction.reply({ embeds: [embed] });
    },
};
