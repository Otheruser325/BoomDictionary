const { EmbedBuilder } = require('discord.js');
const prototypeDefences = require('../../data/prototypeDefences.json');
const { formatNumber } = require('../../utils/formatNumber');

const validDefenceTypes = {
    'doom cannon': 'doom_cannon',
    'shock blaster': 'shock_blaster',
    'lazor beam': 'lazor_beam',
    'hot pot': 'hot_pot',
    'shield generator': 'shield_generator',
    'damage amplifier': 'damage_amplifier'
};

module.exports = {
    name: 'protodefence',
    description: 'Get statistics for a prototype defence.',
    aliases: ['protodefense', 'prototypeDefence', 'prototypeDefense'],
    usage: '<defence_type> <level>',
    async execute(message, args) {
        if (args.length < 2) {
            return message.reply('Please provide both the defence type and level. Usage: `!protodefence <defence_type> <level>`');
        }

        const defenceType = args[0].toLowerCase();
        const level = parseInt(args[1], 10);

        // Map user-friendly name to actual key
        const mappedDefenceType = validDefenceTypes[defenceType];

        if (!mappedDefenceType) {
            return message.reply('Invalid prototype defence type!');
        }

        const defenceData = prototypeDefences[mappedDefenceType];

        if (!defenceData) {
            return message.reply('No data found for the provided prototype defence type.');
        }

        if (level < 1 || level > (defenceData.maxLevel || 3)) {
            return message.reply(`Invalid level! Please provide a level between 1 and ${defenceData.maxLevel || 3}.`);
        }

        const levelData = defenceData.levels[level];
        if (!levelData) {
            return message.reply(`No data available for level ${level}.`);
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

        await message.reply({ embeds: [embed] });
    },
};
