const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionsBitField } = require('discord.js');
const troops = require('../../data/troops.json');
const { formatNumber } = require('../../utils/formatNumber');

const validTroopTypes = {
    'rifleman': 'rifleman',
    'heavy': 'heavy',
    'zooka': 'zooka',
    'warrior': 'warrior',
    'tank': 'tank',
    'medic': 'medic',
    'grenadier': 'grenadier',
	'scorcher': 'scorcher',
    'cryoneer': 'cryoneer',
	'bombardier': 'bombardier'
};

module.exports = {
    name: 'troop',
    description: 'Get statistics for a specific type of troop.',
	permissions: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
    args: false,
    usage: '<troop_type> <level>',
    
    async execute(message, args) {
		// Check bot permissions
        const botPermissions = message.channel.permissionsFor(message.guild.members.me);
        const requiredPermissions = new PermissionsBitField(['SendMessages', 'ViewChannel', 'ReadMessageHistory']);

        if (!botPermissions.has(requiredPermissions)) {
            return message.reply("I don't have the necessary permissions to execute this command. Please make sure I have `SEND_MESSAGES`, `VIEW_CHANNEL`, and `READ_MESSAGE_HISTORY` permissions.");
        }
		
		try {
        if (args.length === 0) {
            // Display list of troop types
            const troopOptions = Object.keys(validTroopTypes).map(troopKey => {
                const troop = troops[validTroopTypes[troopKey]];
                const description = (troop && troop.description) ? troop.description.substring(0, 100) : 'No description available.';
                return new StringSelectMenuOptionBuilder()
                    .setLabel(troopKey.charAt(0).toUpperCase() + troopKey.slice(1))
                    .setValue(troopKey)
                    .setDescription(description);
            });

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

            const stats = levelData.stats || {};
            const trainingCost = levelData.trainingCost || { gold: 0 };
            const researchCost = levelData.researchCost || { gold: 0 };
            const range = troopData.attackRange;
            const image = troopData.image || '';
            const attackSpeed = troopData.attackSpeed;
            const dps = attackSpeed ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';
			const hps = attackSpeed ? (stats.healing / (attackSpeed / 1000)).toFixed(2) : 'Unknown';
            const armoryRequired = levelData.armoryRequired || 'N/A';
            const upgradeTime = levelData.upgradeTime || 'N/A';

            const embed = new EmbedBuilder()
                .setTitle(`${troopData.name} - Level ${level}`)
                .setDescription(troopData.description || 'No description available.')
                .setColor('#0099ff');
				
			if (image) {
                embed.setThumbnail(image);
            }

            // Handle unique stats for certain troops
            if (troopType === 'warrior') {
                embed.addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'DPS', value: formatNumber(dps), inline: true },
                    { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                    { name: 'Healing per Attack', value: formatNumber(stats.selfHeal), inline: true },
                    { name: 'Training Cost', value: `Gold: ${formatNumber(trainingCost.gold)}`, inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                    { name: 'Unit Size', value: formatNumber(troopData.unitSize), inline: true },
                    { name: 'Training Time', value: troopData.trainingTime || 'Unknown', inline: true },
                    { name: 'Movement Speed', value: troopData.movementSpeed || 'Unknown', inline: true },
                    { name: 'Attack Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown', inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            } else if (troopType === 'medic') {
                embed.addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'Healing Per Second', value: formatNumber(hps), inline: true },
                    { name: 'Healing Per Shot', value: formatNumber(stats.healing), inline: true },
                    { name: 'Training Cost', value: `Gold: ${formatNumber(trainingCost.gold)}`, inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                    { name: 'Unit Size', value: formatNumber(troopData.unitSize), inline: true },
                    { name: 'Training Time', value: troopData.trainingTime || 'Unknown', inline: true },
                    { name: 'Movement Speed', value: troopData.movementSpeed || 'Unknown', inline: true },
                    { name: 'Heal Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Heal Speed', value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown', inline: true },
					{ name: 'Heal Type', value: `Splash (${formatNumber(troopData.splashRadius)} Tiles)`, inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            } else if (troopType === 'cryoneer') {
                embed.addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'DPS', value: formatNumber(dps), inline: true },
                    { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                    { name: 'Freeze Power', value: `${formatNumber(troopData.speedReduction)}%`, inline: true },
                    { name: 'Freeze Duration', value: `${formatNumber(troopData.freezeDuration)} seconds`, inline: true },
                    { name: 'Training Cost', value: `Gold: ${formatNumber(trainingCost.gold)}`, inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                    { name: 'Unit Size', value: formatNumber(troopData.unitSize), inline: true },
                    { name: 'Training Time', value: troopData.trainingTime || 'Unknown', inline: true },
                    { name: 'Movement Speed', value: troopData.movementSpeed || 'Unknown', inline: true },
                    { name: 'Attack Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown', inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            } else if (troopType === 'grenadier' || troopType === 'bombardier') {
                embed.addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'DPS', value: formatNumber(dps), inline: true },
                    { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                    { name: 'Splash Radius', value: `${formatNumber(troopData.splashRadius)} Tiles`, inline: true },
                    { name: 'Training Cost', value: `Gold: ${formatNumber(trainingCost.gold)}`, inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                    { name: 'Unit Size', value: formatNumber(troopData.unitSize), inline: true },
                    { name: 'Training Time', value: troopData.trainingTime || 'Unknown', inline: true },
                    { name: 'Movement Speed', value: troopData.movementSpeed || 'Unknown', inline: true },
                    { name: 'Attack Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown', inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            } else if (troopType === 'scorcher') {
                embed.addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'DPS', value: formatNumber(dps), inline: true },
                    { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                    { name: 'Death Damage', value: `${formatNumber(stats.deathDamage)}`, inline: true },
					{ name: 'Death Radius', value: `${formatNumber(troopData.deathRadius)} Tiles`, inline: true },
                    { name: 'Training Cost', value: `Gold: ${formatNumber(trainingCost.gold)}`, inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                    { name: 'Unit Size', value: formatNumber(troopData.unitSize), inline: true },
                    { name: 'Training Time', value: troopData.trainingTime || 'Unknown', inline: true },
                    { name: 'Movement Speed', value: troopData.movementSpeed || 'Unknown', inline: true },
                    { name: 'Attack Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown', inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            } else {
                // Handle general troop stats
                let dps = 'N/A';
                let damagePerShot = 'N/A';

                if (stats.damage !== null) {
                    dps = (stats.damage / (troopData.attackSpeed / 1000)).toFixed(2);
                    damagePerShot = stats.damage.toString();
                }
                embed.addFields(
                    { name: 'Health', value: formatNumber(stats.health), inline: true },
                    { name: 'DPS', value: formatNumber(dps), inline: true },
                    { name: 'Damage Per Shot', value: formatNumber(stats.damage), inline: true },
                    { name: 'Training Cost', value: `Gold: ${formatNumber(trainingCost.gold)}`, inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                    { name: 'Unit Size', value: formatNumber(troopData.unitSize), inline: true },
                    { name: 'Training Time', value: troopData.trainingTime || 'Unknown', inline: true },
                    { name: 'Movement Speed', value: troopData.movementSpeed || 'Unknown', inline: true },
                    { name: 'Attack Range', value: `${formatNumber(range)} Tiles`, inline: true },
                    { name: 'Attack Speed', value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown', inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            }

                await message.channel.send({ embeds: [embed] });
		    }
        } catch (error) {
            console.error('Error executing troop command:', error);
            message.reply('An error occurred while executing the troop command. Please try again later.');
        }
    }
};
