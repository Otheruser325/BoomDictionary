const { MessageEmbed } = require('discord.js');
const prototypeTroops = require('../../data/prototypeTroops.json');
const { formatNumber } = require('../../utils/formatNumber');

const validTroopTypes = {
    'rain maker': 'rain_maker',
    'lazortron': 'lazortron'
};

module.exports = {
    name: 'prototroop',
    description: 'Get statistics for a prototype troop.',
    aliases: ['troop', 'prototypeTroop'],
    usage: '<troop_type> <level>',
    async execute(message, args) {
        if (args.length < 2) {
            return message.reply('Please provide both the troop type and level. Usage: `!prototroop <troop_type> <level>`');
        }

        const troopType = args[0].toLowerCase();
        const level = parseInt(args[1], 10);

        // Map user-friendly name to actual key
        const mappedTroopType = validTroopTypes[troopType];

        if (!mappedTroopType) {
            return message.reply('Invalid prototype troop type!');
        }

        const troopData = prototypeTroops[mappedTroopType];

        if (!troopData) {
            return message.reply('No data found for the provided prototype troop type.');
        }

        if (level < 1 || level > (troopData.maxLevel || 26)) {
            return message.reply(`Invalid level! Please provide a level between 1 and ${troopData.maxLevel || 26}.`);
        }

        const levelData = troopData.levels[level];
        if (!levelData) {
            return message.reply(`No data available for level ${level}.`);
        }

        const stats = levelData.stats;
        const trainingCost = levelData.trainingCost || { gold: 0 };
        const researchCost = levelData.researchCost || { gold: 0 };

        const embed = new MessageEmbed()
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

        await message.reply({ embeds: [embed] });
    },
};
