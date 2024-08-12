const { MessageEmbed } = require('discord.js');
const defences = require('../../data/defences.json');

module.exports = {
    name: 'defence',
    description: 'Get statistics for a specific type of defence.',
    args: true,
    usage: '<defence_type> <level>',
    async execute(message, args) {
        if (args.length < 2) {
            return message.reply('Please provide both the defence type and level. Usage: `!defence <defence_type> <level>`');
        }

        const defenceType = args[0].toLowerCase();
        const level = parseInt(args[1], 10);

        const defenceData = defences[defenceType];

        if (!defenceData) {
            return message.reply('Invalid defence type! Please provide a valid defence type.');
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

        // Calculate DPS
        const dps = (stats.damage / (attackSpeed / 1000)).toFixed(2);

        const embed = new MessageEmbed()
            .setTitle(`${defenceData.name} - Level ${level}`)
            .setDescription(defenceData.description || 'No description available.')
            .addFields(
                { name: 'Health', value: stats.health.toString(), inline: true },
                { name: 'DPS', value: dps, inline: true },
                { name: 'Damage Per Shot', value: stats.damage.toString(), inline: true },
                { name: 'Range', value: range.toString(), inline: true },
                { name: 'Attack Speed', value: `${attackSpeed} ms`, inline: true },
                { name: 'Upgrade Cost', value: `Wood: ${upgradeCost.wood}\nStone: ${upgradeCost.stone}\nIron: ${upgradeCost.iron}`, inline: true },
                { name: 'Upgrade Time', value: `${levelData.upgradeTime || 'Not available'}`, inline: true }
            )
            .setColor('#0099ff');

        await message.channel.send({ embeds: [embed] });
    },
};
