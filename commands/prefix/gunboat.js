const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionsBitField } = require('discord.js');
const gunboatAbilities = require('../../data/gunboatAbilities.json');
const { formatNumber } = require('../../utils/formatNumber');

const validAbilityTypes = {
    'artillery': 'artillery',
    'flare': 'flare',
    'medkit': 'medkit',
    'shock bomb': 'shock_bomb',
    'barrage': 'barrage',
    'smoke screen': 'smokescreen',
    'critters': 'critters'
};

module.exports = {
    name: 'gunboat',
    description: 'Get statistics for a gunboat ability.',
	permissions: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
    aliases: ['gb'],
    args: false,
    usage: '<ability_type> <level>',

    async execute(message, args) {
		// Check bot permissions
        const botPermissions = message.channel.permissionsFor(message.guild.members.me);
        const requiredPermissions = new PermissionsBitField(['SendMessages', 'ViewChannel', 'ReadMessageHistory']);

        if (!botPermissions.has(requiredPermissions)) {
            return message.reply("I don't have the necessary permissions to execute this command. Please make sure I have `SEND_MESSAGES`, `VIEW_CHANNEL`, and `READ_MESSAGE_HISTORY` permissions.");
        }
		
		try {
        if (args.length === 0) {
            const defenceOptions = Object.keys(validAbilityTypes).map(abilityKey => {
                const ability = gunboatAbilities[validAbilityTypes[abilityKey]];
                const description = (ability && ability.description) ? ability.description.substring(0, 100) : 'No description available.';
                return new StringSelectMenuOptionBuilder()
                    .setLabel(abilityKey.charAt(0).toUpperCase() + abilityKey.slice(1))
                    .setValue(validAbilityTypes[abilityKey]) // Use the internal key
                    .setDescription(description);
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_gunboat_ability_type')
                .setPlaceholder('Select a gunboat ability')
                .addOptions(defenceOptions);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const embed = new EmbedBuilder()
                .setTitle('Select a Gunboat Ability')
                .setDescription('Please choose a gunboat ability to view its details.')
                .setColor('#0099ff');

            await message.channel.send({ embeds: [embed], components: [row] });
        } else {
            const userFriendlyAbilityType = args.slice(0, -1).join(' ').toLowerCase().trim();
            const level = parseInt(args[args.length - 1], 10);

            const abilityType = validAbilityTypes[userFriendlyAbilityType];

            if (!abilityType) {
                return message.reply(`Invalid ability type! Available types are: ${Object.keys(validAbilityTypes).join(', ')}.`);
            }

            const abilityData = gunboatAbilities[abilityType];

            if (!abilityData) {
                return message.reply('No data found for the provided gunboat ability.');
            }

            if (isNaN(level) || level < 1 || level > abilityData.maxLevel) {
                return message.reply(`Invalid level! Please provide a level between 1 and ${abilityData.maxLevel}.`);
            }

            const levelData = abilityData.levels[level];
            if (!levelData) {
                return message.reply(`No data available for level ${level}.`);
            }

            const stats = levelData.stats || {};
            const researchCost = levelData.researchCost || { gold: 0 };
            const armoryRequired = levelData.armoryRequired || 'N/A';
            const image = abilityData.image || '';
			const critterDPS = abilityData.critterAttackSpeed ? (abilityData.critterDamage / (abilityData.critterAttackSpeed / 1000)).toFixed(2) : 'Unknown';

            const embed = new EmbedBuilder()
                .setTitle(`${abilityData.name} - Level ${level}`)
                .setDescription(abilityData.description || 'No description available.')
                .setColor('#0099ff');
				
			if (image) {
                embed.setThumbnail(image);
            }

            // Handle unique stats for gunboat abilities
            if (abilityType === 'artillery') {
                embed.addFields(
                    { name: 'Damage', value: formatNumber(stats.damage), inline: true },
					{ name: 'Energy Cost', value: formatNumber(abilityData.energyCost), inline: true },
					{ name: `Energy Cost Increase per ${abilityData.name}`, value: formatNumber(abilityData.energyCostIncreasePerUse), inline: true },
					{ name: 'Explosion Radius', value: `${formatNumber(abilityData.explosionRadius)} Tiles`, inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                    { name: 'Research Time', value: `${levelData.upgradeTime || 'N/A'}`, inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            } else if (abilityType === 'flare' || abilityType === 'shock_bomb' || abilityType === 'smokescreen') {
                embed.addFields(
                    { name: 'Duration', value: `${formatNumber(stats.duration)}s`, inline: true },
					{ name: 'Energy Cost', value: formatNumber(abilityData.energyCost), inline: true },
					{ name: `Energy Cost Increase per ${abilityData.name}`, value: formatNumber(abilityData.energyCostIncreasePerUse), inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold) || 'N/A'}`, inline: true },
                    { name: 'Research Time', value: `${levelData.upgradeTime || 'N/A'}`, inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            } else if (abilityType === 'medkit') {
                embed.addFields(
                    { name: 'Healing per Pulse', value: formatNumber(stats.healingPerPulse), inline: true },
					{ name: 'Total Heal', value: formatNumber(stats.totalHeal), inline: true },
					{ name: 'Energy Cost', value: formatNumber(abilityData.energyCost), inline: true },
					{ name: `Energy Cost Increase per ${abilityData.name}`, value: formatNumber(abilityData.energyCostIncreasePerUse), inline: true },
					{ name: 'Healing Radius', value: `${formatNumber(abilityData.healingRadius)} Tiles`, inline: true },
					{ name: 'Duration', value: `${formatNumber(abilityData.duration)}s`, inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                    { name: 'Research Time', value: `${levelData.upgradeTime || 'N/A'}`, inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            } else if (abilityType === 'barrage') {
                embed.addFields(
				    { name: 'Number of Projectiles', value: formatNumber(abilityData.numProjectiles), inline: true },
                    { name: 'Missile Damage', value: formatNumber(stats.missileDamage), inline: true },
					{ name: 'Total Damage', value: formatNumber(stats.totalDamage), inline: true },
					{ name: 'Energy Cost', value: formatNumber(abilityData.energyCost), inline: true },
					{ name: `Energy Cost Increase per ${abilityData.name}`, value: formatNumber(abilityData.energyCostIncreasePerUse), inline: true },
					{ name: 'Impact Radius', value: `${formatNumber(abilityData.impactRadius)} Tiles`, inline: true },
					{ name: 'Missile Explosion Radius', value: `${formatNumber(abilityData.missileExplosionRadius)} Tiles`, inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                    { name: 'Research Time', value: `${levelData.upgradeTime || 'N/A'}`, inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            } else if (abilityType === 'critters') {
                embed.addFields(
                    { name: 'Amount of Critters', value: `${formatNumber(stats.amountOfCritters)}`, inline: true },
					{ name: 'Critter Health', value: `${formatNumber(abilityData.critterHealth)}`, inline: true },
					{ name: 'Critter Damage', value: `${formatNumber(abilityData.critterDamage)}`, inline: true },
					{ name: 'Critter Range', value: `${formatNumber(abilityData.critterAttackRange)} Tiles`, inline: true },
					{ name: 'Critter DPS', value: `${formatNumber(critterDPS)}`, inline: true },
					{ name: 'Energy Cost', value: formatNumber(abilityData.energyCost), inline: true },
					{ name: `Energy Cost Increase per ${abilityData.name}`, value: formatNumber(abilityData.energyCostIncreasePerUse), inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold) || 'N/A'}`, inline: true },
                    { name: 'Research Time', value: `${levelData.upgradeTime || 'N/A'}`, inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            } else {
                return message.reply(`Stat data for the gunboat ability ${abilityData.name} is currently unavailable.`);
            }

                await message.channel.send({ embeds: [embed] });
		    }
        } catch (error) {
            console.error('Error executing gunboat command:', error);
            message.reply('An error occurred while executing the gunboat command. Please try again later.');
        }
    }
};