const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const defences = require('../../data/defences.json');
const { formatNumber } = require('../../utils/formatNumber');

// Mapping user-friendly names to actual keys in defences.json
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
    aliases: ['defense'],
    args: false,
    usage: '<defence_type> <level>',

    async execute(message, args) {
        if (args.length === 0) {
            // No arguments; show select menu for defence types
            const defenceOptions = Object.keys(validDefenceTypes).map(defenceKey => {
                const defence = defences[validDefenceTypes[defenceKey]];
                const description = (defence && defence.description) ? defence.description.substring(0, 100) : 'No description available.';
                return new StringSelectMenuOptionBuilder()
                    .setLabel(defenceKey.charAt(0).toUpperCase() + defenceKey.slice(1))
                    .setValue(defenceKey)
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
            // Arguments provided; process defence type and level
            const userFriendlyDefenceType = args.slice(0, -1).join(' ').toLowerCase().trim();
            const level = parseInt(args[args.length - 1], 10);

            // Map user-friendly name to actual key
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
            const attackSpeed = defenceData.attackSpeed || 'Unknown'; // Attack speed in milliseconds
            const range = defenceData.range || 'Unknown'; // Range in game units
            const hqRequired = levelData.hqRequired || 'Not specified'; // HQ level required

            // Calculate DPS
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
                    { name: 'HQ Required', value: hqRequired.toString(), inline: true }
                )
                .setColor('#0099ff');

            await message.channel.send({ embeds: [embed] });
        }
    },
};

module.exports.handleInteraction = async (interaction) => {
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'select_defence_type') {
            const selectedDefenceType = interaction.values[0];
            const defenceType = validDefenceTypes[selectedDefenceType];

            if (!defenceType) {
                return interaction.reply({ content: 'Invalid defence type selected!', ephemeral: true });
            }

            const defenceData = defences[defenceType];
            const levelOptions = Array.from({ length: defenceData.maxLevel }, (_, i) => i + 1).map(level => {
                return new StringSelectMenuOptionBuilder()
                    .setLabel(`Level ${level}`)
                    .setValue(level.toString())
                    .setDescription(defenceData.levels[level]?.upgradeTime || 'No details available.');
            });

            const levelSelectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_defence_level')
                .setPlaceholder('Select a level')
                .addOptions(levelOptions);

            const row = new ActionRowBuilder().addComponents(levelSelectMenu);

            const embed = new EmbedBuilder()
                .setTitle(`Select a Level for ${defenceData.name}`)
                .setDescription('Please choose a level to view its details.')
                .setColor('#0099ff');

            await interaction.update({ embeds: [embed], components: [row] });
        } else if (interaction.customId === 'select_defence_level') {
            const selectedLevel = parseInt(interaction.values[0], 10);
            const selectedDefenceType = interaction.message.interaction?.customId;

            const defenceType = validDefenceTypes[selectedDefenceType];

            if (!defenceType) {
                return interaction.reply({ content: 'Invalid defence type selected!', ephemeral: true });
            }

            const defenceData = defences[defenceType];

            if (!defenceData) {
                return interaction.reply({ content: 'No data found for the selected defence type.', ephemeral: true });
            }

            if (selectedLevel < 1 || selectedLevel > defenceData.maxLevel) {
                return interaction.reply({ content: `Invalid level! Please provide a level between 1 and ${defenceData.maxLevel}.`, ephemeral: true });
            }

            const levelData = defenceData.levels[selectedLevel];
            if (!levelData) {
                return interaction.reply({ content: `No data available for level ${selectedLevel}.`, ephemeral: true });
            }

            const stats = levelData.stats;
            const upgradeCost = levelData.upgradeCost || { wood: 0, stone: 0, iron: 0 };
            const attackSpeed = defenceData.attackSpeed || 'Unknown'; // Attack speed in milliseconds
            const range = defenceData.range || 'Unknown'; // Range in game units
            const hqRequired = levelData.hqRequired || 'Not specified'; // HQ level required

            // Calculate DPS
            const dps = attackSpeed !== 'Unknown' ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';

            const embed = new EmbedBuilder()
                .setTitle(`${defenceData.name} - Level ${selectedLevel}`)
                .setDescription(defenceData.description || 'No description available.')
                .addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'DPS', value: formatNumber(dps), inline: true },
                    { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                    { name: 'Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${attackSpeed} ms` : 'Unknown', inline: true },
                    { name: 'Upgrade Cost', value: `Wood: ${formatNumber(upgradeCost.wood)}\nStone: ${formatNumber(upgradeCost.stone)}\nIron: ${formatNumber(upgradeCost.iron)}`, inline: true },
                    { name: 'Upgrade Time', value: `${levelData.upgradeTime || 'Not available'}`, inline: true },
                    { name: 'HQ Required', value: hqRequired.toString(), inline: true }
                )
                .setColor('#0099ff');

            await interaction.update({ embeds: [embed], components: [] });
        }
    }
};
