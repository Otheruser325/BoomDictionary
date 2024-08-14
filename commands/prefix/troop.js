const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const troops = require('../../data/troops.json');
const { formatNumber } = require('../../utils/formatNumber');

const validTroopTypes = {
    'rifleman': 'rifleman',
    'heavy': 'heavy',
    'zooka': 'zooka',
    'tank': 'tank',
    // Add more troop types as needed
};

module.exports = {
    name: 'troop',
    description: 'Get statistics for a specific type of troop.',
    args: false,
    usage: '<troop_type> <level>',
    
    async execute(message, args) {
        if (args.length === 0) {
            const troopOptions = Object.keys(validTroopTypes).map(troopKey => {
                const troop = troops[validTroopTypes[troopKey]];
                
                // Guard clause to handle undefined troop data
                if (!troop) {
                    return null;
                }

                const description = (troop && troop.description) ? troop.description.substring(0, 100) : 'No description available.';
                return new StringSelectMenuOptionBuilder()
                    .setLabel(troop.name.charAt(0).toUpperCase() + troop.name.slice(1))
                    .setValue(troopKey)
                    .setDescription(description);
            }).filter(option => option !== null); // Filter out null values
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_troop_type')
                .setPlaceholder('Select a troop type')
                .addOptions(troopOptions);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const embed = new EmbedBuilder()
                .setTitle('Select a Troop Type')
                .setDescription('Please choose a troop type to view its details.')
                .setColor('#0099ff');

            await message.channel.send({ embeds: [embed], components: [row] });
        } else {
            const userFriendlyTroopType = args.slice(0, -1).join(' ').toLowerCase().trim();
            const level = parseInt(args[args.length - 1], 10);

            const troopType = validTroopTypes[userFriendlyTroopType];

            if (!troopType) {
                return message.reply(`Invalid troop type! Available types are: ${Object.keys(validTroopTypes).join(', ')}.`);
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
        }
    }
};
