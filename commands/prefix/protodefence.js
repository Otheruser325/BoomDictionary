const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const prototypeDefences = require('../../data/prototypeDefences.json');
const { formatNumber } = require('../../utils/formatNumber');

// Mapping user-friendly names to actual keys in prototypeDefences.json
const validDefenceTypes = {
    'doom cannon': 'doom_cannon',
    'shock blaster': 'shock_blaster',
    'lazor beam': 'lazor_beam',
    'hot pot': 'hot_pot',
    'shield generator': 'shield_generator',
    'damage amplifier': 'damage_amplifier'
    // Add other prototype defences here
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('protodefence')
        .setDescription('Get statistics for a prototype defence.')
        .addStringOption(option =>
            option.setName('defence_type')
                .setDescription('Type of prototype defence')
                .setRequired(true)
                .addChoices(
                    { name: 'Doom Cannon', value: 'doom cannon' },
                    { name: 'Shock Blaster', value: 'shock blaster' },
                    { name: 'Lazor Beam', value: 'lazor beam' },
                    { name: 'Hot Pot', value: 'hot pot' },
                    { name: 'Shield Generator', value: 'shield generator' },
                    { name: 'Damage Amplifier', value: 'damage amplifier' }
                    // Add other prototype defences here
                )
        )
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Level of the prototype defence')
                .setRequired(true)
        ),
    async execute(interaction) {
        const defenceType = interaction.options.getString('defence_type');
        const level = interaction.options.getInteger('level');

        // Map user-friendly name to actual key
        const mappedDefenceType = validDefenceTypes[defenceType];

        if (!mappedDefenceType) {
            return interaction.reply({ content: 'Invalid prototype defence type!', ephemeral: true });
        }

        const defenceData = prototypeDefences[mappedDefenceType];

        if (!defenceData) {
            return interaction.reply({ content: 'No data found for the provided prototype defence type.', ephemeral: true });
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

        const dps = attackSpeed !== 'Unknown' ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';

        const embed = new EmbedBuilder()
            .setTitle(`${defenceData.name} - Level ${level}`)
            .setDescription(defenceData.description || 'No description available.')
            .addFields(
                { name: 'Health', value: formatNumber(stats.health), inline: true },
                { name: 'DPS', value: formatNumber(dps), inline: true },
                { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                { name: 'Range', value: `${formatNumber(range)} Tiles`, inline: true },
                { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${attackSpeed} ms` : 'Unknown', inline: true },
                { name: 'Upgrade Cost', value: `Wood: ${formatNumber(upgradeCost.wood)}\nStone: ${formatNumber(upgradeCost.stone)}\nIron: ${formatNumber(upgradeCost.iron)}`, inline: true },
                { name: 'Upgrade Time', value: `${levelData.upgradeTime || 'Not available'}`, inline: true },
                { name: 'Marks', value: marks.toString(), inline: true }
            )
            .setColor('#0099ff');

        await interaction.reply({ embeds: [embed] });
    },
};
