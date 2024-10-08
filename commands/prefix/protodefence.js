const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionsBitField } = require('discord.js');
const prototypeDefences = require('../../data/prototypeDefences.json');
const { formatNumber } = require('../../utils/formatNumber');

const validDefenceTypes = {
    'shock blaster': 'shock_blaster',
    'lazor beam': 'lazor_beam',
    'doom cannon': 'doom_cannon',
    'damage amplifier': 'damage_amplifier',
    'shield generator': 'shield_generator',
    'hot pot': 'hot_pot',
    'grappler': 'grappler',
    's.i.m.o.': 'simo',
    'sky shield': 'sky_shield',
    "microwav'r": 'microwavr',
    'boom surprise': 'boom_surprise',
    'flotsam cannon': 'flotsam_cannon'
};

module.exports = {
    name: 'protodefence',
    description: 'Get statistics for a prototype defence.',
	permissions: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY', 'EMBED_LINKS'],
    aliases: ['protodefense', 'prototypedefence', 'prototypedefense'],
    args: false,
    usage: '<defence_type> <level>',

    async execute(message, args) {
		// Check bot permissions
        const botPermissions = message.channel.permissionsFor(message.guild.members.me);
        const requiredPermissions = new PermissionsBitField(['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks']);

        if (!botPermissions.has(requiredPermissions)) {
            return message.reply("I don't have the necessary permissions to execute this command. Please make sure I have `SEND_MESSAGES`, `VIEW_CHANNEL`, `READ_MESSAGE_HISTORY`, and `EMBED_LINKS` permissions.");
        }
		
        if (args.length === 0) {
            // Display selection box for choosing a prototype defence type
            const defenceOptions = Object.keys(validDefenceTypes).map(defenceKey => {
                const defence = prototypeDefences[validDefenceTypes[defenceKey]];
                const description = (defence && defence.description) ? defence.description.substring(0, 100) : 'No description available.';
                return new StringSelectMenuOptionBuilder()
                    .setLabel(defenceKey.charAt(0).toUpperCase() + defenceKey.slice(1))
                    .setValue(defenceKey)
                    .setDescription(description);
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_prototype_defence_type')
                .setPlaceholder('Select a prototype defence type')
                .addOptions(defenceOptions);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const embed = new EmbedBuilder()
                .setTitle('Select a Prototype Defence Type')
                .setDescription('Please choose a prototype defence type to view its details.')
                .setColor('#0099ff');

            await message.channel.send({ embeds: [embed], components: [row] });
        } else {
            // Handle the command with specific arguments
            const userFriendlyDefenceType = args.slice(0, -1).join(' ').toLowerCase().trim();
            const level = parseInt(args[args.length - 1], 10);

            const defenceType = validDefenceTypes[userFriendlyDefenceType];

            if (!defenceType) {
                return message.reply(`Invalid prototype defence type! Available types are: ${Object.keys(validDefenceTypes).join(', ')}.`);
            }

            const defenceData = prototypeDefences[defenceType];

            if (!defenceData) {
                return message.reply('No data found for the provided prototype defence type.');
            }

            if (isNaN(level) || level < 1 || level > defenceData.maxLevel) {
                return message.reply(`Invalid level! Please provide a level between 1 and ${defenceData.maxLevel}.`);
            }

            const levelData = defenceData.levels[level];
            if (!levelData) {
                return message.reply(`No data available for level ${level}.`);
            }

            const stats = levelData.stats;
            const buildCost = levelData.buildCost || { fuses: 0, gears: 0, rods: 0, capacitors: 0 };
            const range = defenceData.range || 'Unknown';
            const marks = levelData.marks || 'Not specified';
            const image = levelData.image || '';
            
            let attackSpeed = defenceData.attackSpeed || 'Unknown';
            if (defenceType === 'grappler') {
                // Special handling for Grappler
                if (level >= 2) {
                    attackSpeed = 5000 - (level - 1) * 1000; // Reduces by 1s per level from level 2
                }
            } else if (defenceType === 'simo') {
                // Special handling for S.I.M.O.
                if (level >= 2) {
                    attackSpeed = 2000 - (level - 1) * 500; // Reduces by 0.5s per level from level 2
                }
            }

            // Calculate DPS if attackSpeed is known
            const dps = attackSpeed !== 'Unknown' ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';

            // Handle special stats for certain prototype defences
            let special = '';
            if (defenceType === 'shock_blaster') {
                special = level === 1 ? 'Stuns enemies for 0.6s with each hit; reapplies' :
                         level === 2 ? 'Stuns enemies for 0.8s with each hit; reapplies' :
                         'Stuns enemies for 1s with each hit; reapplies';
            } else if (defenceType === 'damage_amplifier') {
                special = level === 1 ? 'Provides 50% damage boost to nearby defences' :
                         level === 2 ? 'Provides 75% damage boost to nearby defences' :
                         'Provides 100% damage boost to nearby defences';
            } else if (defenceType === 'shield_generator') {
                special = level === 1 ? 'Gives the Headquarters 50% of shield equivalent to its maximum HP' :
                         level === 2 ? 'Gives the Headquarters 100% of shield equivalent to its maximum HP' :
                         'Gives the Headquarters 150% of shield equivalent to its maximum HP';
            } else if (defenceType === 'simo') {
                special = level === 1 ? 'Can see through smokescreens; targets low-health enemies' :
                         level === 2 ? 'Can see through smokescreens; targets low-health enemies' :
                         'Can see through smokescreens; targets low-health enemies';
            } else if (defenceType === 'sky_shield') {
                special = level === 1 ? 'Creates a shield around itself against Gunboat Weaponry' :
                         level === 2 ? 'Creates a shield around itself against Gunboat Weaponry' :
                         'Creates a shield around itself against Gunboat Weaponry';
            } else if (defenceType === 'flotsam_cannon') {
                special = level === 1 ? 'Deals 2,000 death damage upon defeat; 6.5 tiles of radius; 3-second delay' :
                         level === 2 ? 'Deals 2,400 death damage upon defeat; 6.5 tiles of radius; 3-second delay' :
                         'Deals 3,000 death damage upon defeat; 6.5 tiles of radius; 3-second delay';
            }

            const embed = new EmbedBuilder()
                .setTitle(`${defenceData.name} - Level ${level}`)
                .setDescription(defenceData.description || 'No description available.')
                .setColor('#0099ff');
				
			if (image) {
                embed.setThumbnail(image);
            }

            // Handle unique stats for certain protodefences
            if (defenceType === 'shield_generator') {
                embed.addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'Build Cost', value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`, inline: true },
                    { name: 'Build Time', value: `${levelData.buildTime || 'Not available'}`, inline: true },
                    { name: 'Weapon Lab Required', value: `${levelData.weaponLabRequired || 'Not available'}`, inline: true },
                    { name: 'Marks', value: marks.toString(), inline: true },
                    { name: 'Special', value: special || 'None', inline: true }
                );
            } else if (defenceType === 'sky_shield') {
                embed.addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'Shield Health', value: formatNumber(stats.shieldHealth), inline: true },
                    { name: 'Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Build Cost', value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`, inline: true },
                    { name: 'Build Time', value: `${levelData.buildTime || 'Not available'}`, inline: true },
                    { name: 'Weapon Lab Required', value: `${levelData.weaponLabRequired || 'Not available'}`, inline: true },
                    { name: 'Marks', value: marks.toString(), inline: true },
                    { name: 'Special', value: special || 'None', inline: true }
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
                    { name: 'Build Cost', value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`, inline: true },
                    { name: 'Build Time', value: `${levelData.buildTime || 'Not available'}`, inline: true },
                    { name: 'Weapon Lab Required', value: `${levelData.weaponLabRequired || 'Not available'}`, inline: true },
                    { name: 'Marks', value: marks.toString(), inline: true },
                    { name: 'Special', value: special || 'None', inline: true }
                );
            }

            await message.reply({ embeds: [embed] });
        }
    }
};
