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
                    { name: 'Tank', value: 'tank' },
                    { name: 'Grenadier', value: 'grenadier' }
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
        const trainingCost = levelData.trainingCost || { wood: 0, stone: 0, iron: 0 };
        const researchCost = levelData.researchCost || { wood: 0, stone: 0, iron: 0 };

        const embed = new EmbedBuilder()
            .setTitle(`${troopData.name} - Level ${level}`)
            .setDescription(troopData.description || 'No description available.')
            .addFields(
                { name: 'Health', value: formatNumber(stats.health), inline: true },
                { name: 'DPS', value: formatNumber(stats.dps), inline: true },
                { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                { name: 'Training Cost', value: `Wood: ${formatNumber(trainingCost.wood)}\nStone: ${formatNumber(trainingCost.stone)}\nIron: ${formatNumber(trainingCost.iron)}`, inline: true },
                { name: 'Research Cost', value: `Wood: ${formatNumber(researchCost.wood)}\nStone: ${formatNumber(researchCost.stone)}\nIron: ${formatNumber(researchCost.iron)}`, inline: true },
                { name: 'Unit Size', value: formatNumber(stats.unitSize), inline: true },
                { name: 'Training Time', value: stats.trainingTime || 'Unknown', inline: true },
                { name: 'Movement Speed', value: stats.movementSpeed || 'Unknown', inline: true },
                { name: 'Attack Range', value: formatNumber(stats.attackRange), inline: true },
                { name: 'Attack Speed', value: stats.attackSpeed || 'Unknown', inline: true }
            )
            .setColor('#0099ff');

        await interaction.reply({ embeds: [embed] });
    },
};
