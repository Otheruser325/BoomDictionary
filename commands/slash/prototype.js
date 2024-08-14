const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const prototypeDefences = require('../../data/prototypeDefences.json');
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
                            { name: 'Grappler', value: 'grappler' },
                            { name: 'Hot Pot', value: 'hot_pot' },
                            { name: 'Shield Generator', value: 'shield_generator' },
                            { name: 'Damage Amplifier', value: 'damage_amplifier' },
                            { name: 'Boom Surprise', value: 'boom_surprise' },
                            { name: 'S.I.M.O.', value: 'simo' }
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
                            { name: 'Lazortron', value: 'lazortron' },
                            { name: 'Critter Cannon', value: 'critter_cannon' },
                            { name: 'Heavy Choppa', value: 'heavy_choppa' }
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
            const buildCost = levelData.buildCost || { fuses: 0, gears: 0, rods: 0, capacitors: 0 };
            const range = defenceData.range || 'Unknown';
            const marks = levelData.marks || 'Not specified';
            const image = levelData.image || '';
            let attackSpeed = defenceData.attackSpeed || 'Unknown';
            if (defenceType === 'grappler') {
                // Special handling for Grappler
                if (level >= 2) {
                    attackSpeed = 5000 - (level - 1) * 1000; // Reduces by 1s per level from level 2
                }
            }

            const dps = attackSpeed !== 'Unknown' ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';

            // Handle special stats for certain prototype defences
            let special = '';
            if (defenceType === 'shock_blaster') {
                special = level === 1 ? 'Stuns enemies for 0.6s with each hit; reapplies' :
                         level === 2 ? 'Stuns enemies for 0.8s with each hit; reapplies' :
                         'Stuns enemies for 1s with each hit; reapplies';
            } else if (defenceType === 'damage_amplifier') {
                special = level === 1 ? 'Provides 50% damage boost to nearby defences' :
                         level === 2 ? 'Provides 75% damage boost to nearby defences' :
                         'Provides 100% damage boost to nearby defences';
            }

            const embed = new EmbedBuilder()
                .setTitle(`${defenceData.name} - Level ${level}`)
                .setDescription(defenceData.description || 'No description available.')
                .setThumbnail(image)
                .addFields(
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

            if (level < 12 || level > (troopData.maxLevel || 26)) {
                return interaction.reply({ content: `Invalid level! Please provide a level between 12 and ${troopData.maxLevel || 26}.`, ephemeral: true });
            }

            const levelData = troopData.levels[level];
            if (!levelData) {
                return interaction.reply({ content: `No data available for level ${level}.`, ephemeral: true });
            }

            const stats = levelData.stats;
            const trainingCost = levelData.trainingCost || { gold: 0 };
            const protoTokenCost = level < 26 ? 250 + (level - 12) * 100 : 2500;

            const embed = new EmbedBuilder()
                .setTitle(`${troopData.name} - Level ${level}`)
                .setDescription(troopData.description || 'No description available.')
                .addFields(
                    { name: 'Health', value: formatNumber(stats.health.toString()), inline: true },
                    { name: 'DPS', value: formatNumber((stats.damage / (troopData.attackSpeed / 1000)).toFixed(2).toString()), inline: true },
                    { name: 'Damage Per Shot', value: formatNumber(stats.damage.toString()), inline: true },
                    { name: 'Training Cost', value: `Gold: ${formatNumber(trainingCost.gold.toString())}`, inline: true },
                    { name: 'Upgrade Cost', value: `Proto Tokens: ${formatNumber(protoTokenCost.toString())}`, inline: true },
                    { name: 'Unit Size', value: formatNumber(troopData.unitSize.toString()), inline: true },
                    { name: 'Training Time', value: troopData.trainingTime || 'Unknown', inline: true },
                    { name: 'Movement Speed', value: troopData.movementSpeed || 'Unknown', inline: true },
                    { name: 'Attack Range', value: formatNumber(troopData.attackRange.toString()), inline: true },
                    { name: 'Attack Speed', value: troopData.attackSpeed.toString() || 'Unknown', inline: true }
                )
                .setColor('#0099ff');

            await interaction.reply({ embeds: [embed] });
        }
    },
};
