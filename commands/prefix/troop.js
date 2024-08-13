const { EmbedBuilder } = require('discord.js');
const troops = require('../../data/troops.json');
const { formatNumber } = require('../../utils/formatNumber');

const validTroopTypes = ['rifleman', 'heavy', 'zooka', 'tank'];

module.exports = {
    name: 'troop',
    description: 'Get statistics for a specific type of troop.',
    args: true,
    usage: '<troop_type> <level>',
    async execute(message, args) {
        if (args.length < 2) {
            return message.reply('Please provide both the troop type and level. Usage: `bd!troop <troop_type> <level>`');
        }

        const troopType = args[0].toLowerCase();
        const level = parseInt(args[1], 10);

        // Check for valid troop type
        if (!validTroopTypes.includes(troopType)) {
            return message.reply(`Invalid troop type! Available types are: ${validTroopTypes.join(', ')}.`);
        }

        const troopData = troops[troopType];

        if (!troopData) {
            return message.reply('No data found for the provided troop type.');
        }

        if (isNaN(level) || level < 1 || level > troopData.maxLevel) {
            return message.reply(`Invalid level! Please provide a level between 1 and ${troopData.maxLevel}.`);
        }

        const levelData = troopData.levels[level];
        if (!levelData) {
            return message.reply(`No data available for level ${level}.`);
        }

        const stats = levelData.stats;
        const trainingCost = levelData.trainingCost || { gold: 0 };
        const researchCost = levelData.researchCost || { gold: 0 };
        const range = troopData.attackRange;
        const attackSpeed = troopData.attackSpeed;
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
                { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
            )
            .setColor('#0099ff');

        await message.channel.send({ embeds: [embed] });
    },
};
