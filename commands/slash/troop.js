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
                    { name: 'Tank', value: 'tank' }
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
        const dps = attackSpeed ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';
        const armoryRequired = levelData.armoryRequired || 'Not specified';

        const embed = new EmbedBuilder()
            .setTitle(`${troopData.name} - Level ${level}`)
            .setDescription(troopData.description || 'No description available.')
            .addFields(
                { name: 'Health', value: formatNumber(stats.health), inline: true },
                { name: 'DPS', value: formatNumber(dps), inline: true },
                { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                { name: 'Training Cost', value: `Gold: ${formatNumber(trainingCost.gold)}`, inline: true },
                { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                { name: 'Unit Size', value: formatNumber(stats.unitSize), inline: true },
                { name: 'Training Time', value: stats.trainingTime || 'Unknown', inline: true },
                { name: 'Movement Speed', value: stats.movementSpeed || 'Unknown', inline: true },
                { name: 'Attack Range', value: `${formatNumber(range)} Tiles`, inline: true },
                { name: 'Attack Speed', value: attackSpeed ? `${attackSpeed} ms` : 'Unknown', inline: true },
                { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true } // Display Armory Required
            )
            .setColor('#0099ff');

        await interaction.reply({ embeds: [embed] });
    },
};
