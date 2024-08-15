const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const defences = require('../../data/defences.json');
const { formatNumber } = require('../../utils/formatNumber');

const defenceNameMap = {
    'sniper tower': 'sniper_tower',
    'machine gun': 'machine_gun',
    'mortar': 'mortar',
    'cannon': 'cannon',
    'flamethrower': 'flamethrower',
    'boom cannon': 'boom_cannon',
    'rocket launcher': 'rocket_launcher',
    'critter launcher': 'critter_launcher',
    'shock launcher': 'shock_launcher'
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('defence')
        .setDescription('Get statistics for a specific type of defence.')
        .addStringOption(option =>
            option.setName('defence_type')
                .setDescription('Type of defence')
                .setRequired(true)
                .addChoices(
                    { name: 'Sniper Tower', value: 'sniper tower' },
                    { name: 'Machine Gun', value: 'machine gun' },
                    { name: 'Mortar', value: 'mortar' },
                    { name: 'Cannon', value: 'cannon' },
                    { name: 'Flamethrower', value: 'flamethrower' },
                    { name: 'Boom Cannon', value: 'boom cannon' },
                    { name: 'Rocket Launcher', value: 'rocket launcher' },
                    { name: 'Critter Launcher', value: 'critter launcher' },
                    { name: 'Shock Launcher', value: 'shock launcher' }
                )
        )
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Level of the defence')
                .setRequired(true)
        ),
    async execute(interaction) {
        const defenceType = interaction.options.getString('defence_type');
        const level = interaction.options.getInteger('level');

        // Convert spaced name to codename
        const defenceCodename = defenceNameMap[defenceType];

        if (!defenceCodename) {
            return interaction.reply({ content: 'Invalid defence type!', ephemeral: true });
        }

        const defenceData = defences[defenceCodename];

        if (!defenceData) {
            return interaction.reply({ content: 'No data found for the provided defence type.', ephemeral: true });
        }

        if (level < 1 || level > (defenceData.maxLevel || 1)) {
            return interaction.reply({ content: `Invalid level! Please provide a level between 1 and ${defenceData.maxLevel}.`, ephemeral: true });
        }

        const levelData = defenceData.levels[level];
        if (!levelData) {
            return interaction.reply({ content: `No data available for level ${level}.`, ephemeral: true });
        }

        const stats = levelData.stats;
        const upgradeCost = levelData.upgradeCost || { wood: 0, stone: 0, iron: 0 };
        const attackSpeed = defenceData.attackSpeed || 'Unknown'; // Attack speed in milliseconds
        const range = defenceData.range || 'Unknown'; // Range in game units
        const hqRequired = levelData.hqRequired || 'Not specified'; // HQ level required
        const image = levelData.image || '';

        // Calculate DPS
        const dps = (stats.damage / (attackSpeed / 1000)).toFixed(2);

        const embed = new EmbedBuilder()
            .setTitle(`${defenceData.name} - Level ${level}`)
            .setDescription(defenceData.description || 'No description available.')
            .setThumbnail(image)
            .addFields(
                { name: 'Health', value: formatNumber(stats.health), inline: true },
                { name: 'DPS', value: formatNumber(dps), inline: true },
                { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                { name: 'Range', value: `${formatNumber(range)} Tiles`, inline: true },
                { name: 'Attack Speed', value: `${attackSpeed} ms`, inline: true },
                { name: 'Upgrade Cost', value: `Wood: ${formatNumber(upgradeCost.wood)}\nStone: ${formatNumber(upgradeCost.stone)}\nIron: ${formatNumber(upgradeCost.iron)}`, inline: true },
                { name: 'Upgrade Time', value: `${levelData.upgradeTime || 'Not available'}`, inline: true },
                { name: 'HQ Required', value: hqRequired.toString(), inline: true } // Display HQ required
            )
            .setColor('#0099ff');

        await interaction.reply({ embeds: [embed] });
    },
};
