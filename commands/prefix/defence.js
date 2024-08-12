const { EmbedBuilder } = require('discord.js');
const defences = require('../../data/defences.json');
const { formatNumber } = require('../../utils/formatNumber');

const validDefenceTypes = [
    'sniper_tower', 'mortar', 'machine_gun', 'cannon',
    'flamethrower', 'boom_cannon', 'critter_launcher',
    'rocket_launcher', 'shock_launcher'
];

module.exports = {
    name: 'defence',
    description: 'Get statistics for a specific type of defence.',
    args: true,
    usage: '<defence_type> <level>',
    async execute(message, args) {
        if (args.length < 2) {
            return message.reply('Please provide both the defence type and level. Usage: `bd!defence <defence_type> <level>`');
        }

        const defenceType = args[0].toLowerCase();
        const level = parseInt(args[1], 10);

        // Check for valid defence type
        if (!validDefenceTypes.includes(defenceType)) {
            return message.reply(`Invalid defence type! Available types are: ${validDefenceTypes.join(', ')}.`);
        }

        const defenceData = defences[defenceType];

        if (!defenceData) {
            return message.reply('No data found for the provided defence type.');
        }

        if (isNaN(level) || level < 1 || level > defenceData.maxLevel) {
            return message.reply(`Invalid level! Please provide a level between 1 and ${defenceData.maxLevel}.`);
        }

        const levelData = defenceData.levels[level];
        if (!levelData) {
            return message.reply(`No data available for level ${level}.`);
        }

        const stats = levelData.stats;
        const upgradeCost = levelData.upgradeCost || { wood: 0, stone: 0, iron: 0 };
        const attackSpeed = defenceData.attackSpeed || 'Unknown'; // Attack speed in milliseconds
        const range = defenceData.range || 'Unknown'; // Range in game units
        const hqRequired = levelData.hq_required || 'Not specified'; // HQ level required

        // Calculate DPS
        const dps = (stats.damage / (attackSpeed / 1000)).toFixed(2);

        const embed = new EmbedBuilder()
            .setTitle(`${defenceData.name} - Level ${level}`)
            .setDescription(defenceData.description || 'No description available.')
            .addFields(
                { name: 'Health', value: formatNumber(stats.health), inline: true },
                { name: 'DPS', value: formatNumber(dps), inline: true },
                { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                { name: 'Range', value: formatNumber(range), inline: true },
                { name: 'Attack Speed', value: `${attackSpeed} ms`, inline: true },
                { name: 'Upgrade Cost', value: `Wood: ${formatNumber(upgradeCost.wood)}\nStone: ${formatNumber(upgradeCost.stone)}\nIron: ${formatNumber(upgradeCost.iron)}`, inline: true },
                { name: 'Upgrade Time', value: `${levelData.upgradeTime || 'Not available'}`, inline: true },
                { name: 'HQ Required', value: hqRequired.toString(), inline: true } // Display HQ required
            )
            .setColor('#0099ff');

        await message.channel.send({ embeds: [embed] });
    },
};
