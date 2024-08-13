const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const prototypeDefences = require('../../data/prototypeDefences.json');
const prototypeTroops = require('../../data/prototypeTroops.json');
const { formatNumber } = require('../../utils/formatNumber');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prototype')
        .setDescription('Get statistics for a prototype defence or troop.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('defence')
                .setDescription('Get statistics for a prototype defence.')
                .addStringOption(option =>
                    option.setName('defence_type')
                        .setDescription('Type of prototype defence')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Doom Cannon', value: 'doom_cannon' },
                            { name: 'Shock Blaster', value: 'shock_blaster' },
                            { name: 'Lazor Beam', value: 'lazor_beam' },
                            { name: 'Hot Pot', value: 'hot_pot' },
                            { name: 'Shield Generator', value: 'shield_generator' },
                            { name: 'Damage Amplifier', value: 'damage_amplifier' }
                            // Add other prototype defences here
                        )
                )
                .addIntegerOption(option =>
                    option.setName('level')
                        .setDescription('Level of the prototype defence')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('troop')
                .setDescription('Get statistics for a prototype troop.')
                .addStringOption(option =>
                    option.setName('troop_type')
                        .setDescription('Type of prototype troop')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Rain Maker', value: 'rain_maker' },
                            { name: 'Lazortron', value: 'lazortron' }
                            // Add other prototype troops here
                        )
                )
                .addIntegerOption(option =>
                    option.setName('level')
                        .setDescription('Level of the prototype troop')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'defence') {
            const defenceType = interaction.options.getString('defence_type');
            const level = interaction.options.getInteger('level');

            const defenceData = prototypeDefences[defenceType];

            if (!defenceData) {
                return interaction.reply({ content: 'Invalid prototype defence type!', ephemeral: true });
            }

            if (level < 1 || level > (defenceData.maxLevel || 3)) {
                return interaction.reply({ content: `Invalid level! Please provide a level between 1 and ${defenceData.maxLevel || 3}.`, ephemeral: true });
            }

            const levelData = defenceData.levels[level];
            if (!levelData) {
                return interaction.reply({ content: `No data available for level ${level}.`, ephemeral: true });
            }

            const stats = levelData.stats;
            const upgradeCost = levelData.upgradeCost || { wood: 0, stone: 0, iron: 0 };
            const attackSpeed = defenceData.attackSpeed || 'Unknown';
            const range = defenceData.range || 'Unknown';
            const marks = levelData.marks || 'Not specified';

            const embed = new EmbedBuilder()
                .setTitle(`${defenceData.name} - Level ${level}`)
                .setDescription(defenceData.description || 'No description available.')
                .addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'DPS', value: formatNumber((stats.damage / (attackSpeed / 1000)).toFixed(2)), inline: true },
                    { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                    { name: 'Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Attack Speed', value: `${attackSpeed} ms`, inline: true },
                    { name: 'Upgrade Cost', value: `Wood: ${formatNumber(upgradeCost.wood)}\nStone: ${formatNumber(upgradeCost.stone)}\nIron: ${formatNumber(upgradeCost.iron)}`, inline: true },
                    { name: 'Upgrade Time', value: `${levelData.upgradeTime || 'Not available'}`, inline: true },
                    { name: 'Marks', value: marks.toString(), inline: true }
                )
                .setColor('#0099ff');

            await interaction.reply({ embeds: [embed] });
        } else if (subcommand === 'troop') {
            const troopType = interaction.options.getString('troop_type');
            const level = interaction.options.getInteger('level');

            const troopData = prototypeTroops[troopType];

            if (!troopData) {
                return interaction.reply({ content: 'Invalid prototype troop type!', ephemeral: true });
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
        }
    },
};
