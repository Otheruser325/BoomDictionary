const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const defences = require('../../data/defences.json');
const { formatNumber } = require('../../utils/formatNumber');

const validDefenceTypes = {
    'sniper tower': 'sniper_tower',
    'mortar': 'mortar',
    'machine gun': 'machine_gun',
    'cannon': 'cannon',
    'flamethrower': 'flamethrower',
    'boom cannon': 'boom_cannon',
    'rocket launcher': 'rocket_launcher',
    'critter launcher': 'critter_launcher',
    'shock launcher': 'shock_launcher'
};

module.exports = {
    name: 'defence',
    description: 'Get statistics for a specific type of defence.',
	permissions: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
    aliases: ['defense'],
    args: false,
    usage: '<defence_type> <level>',

    async execute(message, args) {
        if (args.length === 0) {
            const defenceOptions = Object.keys(validDefenceTypes).map(defenceKey => {
                const defence = defences[validDefenceTypes[defenceKey]];
                const description = (defence && defence.description) ? defence.description.substring(0, 100) : 'No description available.';
                return new StringSelectMenuOptionBuilder()
                    .setLabel(defenceKey.charAt(0).toUpperCase() + defenceKey.slice(1))
                    .setValue(validDefenceTypes[defenceKey]) // Use the internal key
                    .setDescription(description);
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_defence_type')
                .setPlaceholder('Select a defence type')
                .addOptions(defenceOptions);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const embed = new EmbedBuilder()
                .setTitle('Select a Defence Type')
                .setDescription('Please choose a defence type to view its details.')
                .setColor('#0099ff');

            await message.channel.send({ embeds: [embed], components: [row] });
        } else {
            const userFriendlyDefenceType = args.slice(0, -1).join(' ').toLowerCase().trim();
            const level = parseInt(args[args.length - 1], 10);

            const defenceType = validDefenceTypes[userFriendlyDefenceType];

            if (!defenceType) {
                return message.reply(`Invalid defence type! Available types are: ${Object.keys(validDefenceTypes).join(', ')}.`);
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
            const attackSpeed = defenceData.attackSpeed || 'Unknown';
            const range = defenceData.range || 'Unknown';
            const hqRequired = levelData.hqRequired || 'N/A';
            const image = levelData.image || '';

            // Calculate DPS if attackSpeed is known
            const dps = attackSpeed !== 'Unknown' ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';

            const embed = new EmbedBuilder()
                .setTitle(`${defenceData.name} - Level ${level}`)
                .setDescription(defenceData.description || 'No description available.')
                .setColor('#0099ff');
				
			if (image) {
                embed.setThumbnail(image);
            }

            // Handle unique stats for certain defences
            if (defenceType === 'shock_launcher') {
                embed.addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'DPS', value: formatNumber(dps), inline: true },
                    { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                    { name: 'Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown', inline: true },
                    { name: 'Shock Duration', value: `${formatNumber(stats.stunDuration)} seconds`, inline: true },
                    { name: 'Upgrade Cost', value: `Wood: ${formatNumber(upgradeCost.wood)}\nStone: ${formatNumber(upgradeCost.stone)}\nIron: ${formatNumber(upgradeCost.iron)}`, inline: true },
                    { name: 'Upgrade Time', value: `${levelData.upgradeTime || 'Not available'}`, inline: true },
                    { name: 'HQ Required', value: hqRequired.toString(), inline: true }
                );
            } else {
                // Handle general defence stats
                let dps = 'N/A';
                let damagePerShot = 'N/A';

                if (stats.damage !== null) {
                    dps = (stats.damage / (defenceData.attackSpeed / 1000)).toFixed(2);
                    damagePerShot = stats.damage.toString();
                }
                embed.addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'DPS', value: formatNumber(dps), inline: true },
                    { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                    { name: 'Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown', inline: true },
                    { name: 'Upgrade Cost', value: `Wood: ${formatNumber(upgradeCost.wood)}\nStone: ${formatNumber(upgradeCost.stone)}\nIron: ${formatNumber(upgradeCost.iron)}`, inline: true },
                    { name: 'Upgrade Time', value: `${levelData.upgradeTime || 'Not available'}`, inline: true },
                    { name: 'HQ Required', value: hqRequired.toString(), inline: true }
                );
            }

            await message.channel.send({ embeds: [embed] });
        }
    }
};
