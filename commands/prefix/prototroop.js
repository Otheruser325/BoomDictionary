const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const prototypeTroops = require('../../data/prototypeTroops.json');
const { formatNumber } = require('../../utils/formatNumber');

const validTroopTypes = {
    'rain maker': 'rain_maker',
    'lazortron': 'lazortron',
    'critter cannon': 'critter_cannon',
    'rocket choppa': 'rocket_choppa',
    'heavy choppa': 'heavy_choppa',
    'turret engineer': 'turret_engineer',
    'critter engineer': 'critter_engineer',
    'cryobombardier': 'cryobombardier'
};

module.exports = {
    name: 'prototroop',
    description: 'Get statistics for a prototype troop.',
    aliases: ['prototypeTroop'],
    usage: '<troop_type> <level>',

    async execute(message, args) {
        if (args.length === 0) {
            // Display prototype troop type selection
            const troopOptions = Object.keys(validTroopTypes).map(troopKey => {
                const troop = prototypeTroops[validTroopTypes[troopKey]];
                const description = (troop && troop.description) ? troop.description.substring(0, 100) : 'No description available.';
                return new StringSelectMenuOptionBuilder()
                    .setLabel(troopKey.charAt(0).toUpperCase() + troopKey.slice(1))
                    .setValue(validTroopTypes[troopKey]) // Use the JSON key here
                    .setDescription(description);
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_prototype_troop_type')
                .setPlaceholder('Select a prototype troop type')
                .addOptions(troopOptions);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const embed = new EmbedBuilder()
                .setTitle('Select a Prototype Troop Type')
                .setDescription('Please choose a prototype troop type to view its details.')
                .setColor('#0099ff');

            await message.channel.send({ embeds: [embed], components: [row] });
        } else {
            const userFriendlyTroopType = args.slice(0, -1).join(' ').toLowerCase().trim();
            const level = parseInt(args[args.length - 1], 10);

            const troopType = validTroopTypes[userFriendlyTroopType];

            if (!troopType) {
                return message.reply(`Invalid prototype troop type! Available types are: ${Object.keys(validTroopTypes).join(', ')}.`);
            }

            const troopData = prototypeTroops[troopType];

            if (!troopData) {
                return message.reply('No data found for the provided prototype troop type.');
            }

            if (isNaN(level) || level < 12 || level > 26) {
                return message.reply(`Invalid level! Please provide a level between 12 and 26.`);
            }

            const levelData = troopData.levels[level];
            if (!levelData) {
                return message.reply(`No data available for level ${level}.`);
            }

            const stats = levelData.stats;
            const attackSpeed = troopData.attackSpeed;
            const trainingCost = levelData.trainingCost || { gold: 0 };
            const protoTokenCost = level < 26 ? 250 + (level - 12) * 100 : 2500;

            let dps = 'N/A';
            let damagePerShot = 'N/A';

            // Check if the troop has direct damage or not (like Critter Cannon)
            if (stats.damage !== null) {
                dps = (stats.damage / (troopData.attackSpeed / 1000)).toFixed(2);
                damagePerShot = formatNumber(stats.damage.toString());
            }

            const embed = new EmbedBuilder()
                .setTitle(`${troopData.name} - Level ${level}`)
                .setDescription(troopData.description || 'No description available.')
                .addFields(
                    { name: 'Health', value: formatNumber(stats.health.toString()), inline: true },
                    { name: 'DPS', value: dps !== 'N/A' ? formatNumber(dps) : dps, inline: true },
                    { name: 'Damage Per Shot', value: damagePerShot, inline: true },
                    { name: 'Training Cost', value: `Gold: ${formatNumber(trainingCost.gold.toString())}`, inline: true },
                    { name: 'Upgrade Cost', value: `Proto Tokens: ${formatNumber(protoTokenCost.toString())}`, inline: true },
                    { name: 'Unit Size', value: formatNumber(troopData.unitSize.toString()), inline: true },
                    { name: 'Training Time', value: troopData.trainingTime || 'Unknown', inline: true },
                    { name: 'Movement Speed', value: troopData.movementSpeed || 'Unknown', inline: true },
                    { name: 'Attack Range', value: formatNumber(troopData.attackRange.toString()), inline: true },
                    { name: 'Attack Speed', value: attackSpeed ? `${attackSpeed} ms` : 'Unknown', inline: true }
                )
                .setColor('#0099ff');

            await message.channel.send({ embeds: [embed] });
        }
    },
};
