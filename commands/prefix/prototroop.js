const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const prototypeTroops = require('../../data/prototypeTroops.json');
const { formatNumber } = require('../../utils/formatNumber');

// Mapping user-friendly names to actual keys in prototypeTroops.json
const validTroopTypes = {
    'rain maker': 'rain_maker',
    'lazortron': 'lazortron'
    // Add other prototype troops here
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prototroop')
        .setDescription('Get statistics for a prototype troop.')
        .addStringOption(option =>
            option.setName('troop_type')
                .setDescription('Type of prototype troop')
                .setRequired(true)
                .addChoices(
                    { name: 'Rain Maker', value: 'rain maker' },
                    { name: 'Lazortron', value: 'lazortron' }
                    // Add other prototype troops here
                )
        )
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Level of the prototype troop')
                .setRequired(true)
        ),
    async execute(interaction) {
        const troopType = interaction.options.getString('troop_type');
        const level = interaction.options.getInteger('level');

        // Map user-friendly name to actual key
        const mappedTroopType = validTroopTypes[troopType];

        if (!mappedTroopType) {
            return interaction.reply({ content: 'Invalid prototype troop type!', ephemeral: true });
        }

        const troopData = prototypeTroops[mappedTroopType];

        if (!troopData) {
            return interaction.reply({ content: 'No data found for the provided prototype troop type.', ephemeral: true });
        }

        if (level < 1 || level > (troopData.maxLevel || 26)) {
            return interaction.reply({ content: `Invalid level! Please provide a level between 1 and ${troopData.maxLevel || 26}.`, ephemeral: true });
        }

        const levelData = troopData.levels[level];
        if (!levelData) {
            return interaction.reply({ content: `No data available for level ${level}.`, ephemeral: true });
        }

        const stats = levelData.stats;
        const trainingCost = levelData.trainingCost || { gold: 0 };
        const researchCost = levelData.researchCost || { gold: 0 };

        const embed = new EmbedBuilder()
            .setTitle(`${troopData.name} - Level ${level}`)
            .setDescription(troopData.description || 'No description available.')
            .addFields(
                { name: 'Health', value: formatNumber(stats.health), inline: true },
                { name: 'DPS', value: formatNumber((stats.damage / (troopData.attackSpeed / 1000)).toFixed(2)), inline: true },
                { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                { name: 'Training Cost', value: `Gold: ${formatNumber(trainingCost.gold)}`, inline: true },
                { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                { name: 'Unit Size', value: formatNumber(stats.unitSize), inline: true },
                { name: 'Training Time', value: stats.trainingTime || 'Unknown', inline: true },
                { name: 'Movement Speed', value: stats.movementSpeed || 'Unknown', inline: true },
                { name: 'Attack Range', value: formatNumber(troopData.attackRange), inline: true },
                { name: 'Attack Speed', value: troopData.attackSpeed || 'Unknown', inline: true }
            )
            .setColor('#0099ff');

        await interaction.reply({ embeds: [embed] });
    },
};
