const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const gunboatAbilities = require('../../data/gunboatAbilities.json');
const { formatNumber } = require('../../utils/formatNumber');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gunboat')
        .setDescription('Get statistics for a specific type of gunboat ability.')
        .addStringOption(option =>
            option.setName('ability_type')
                .setDescription('Type of troop')
                .setRequired(true)
                .addChoices(
                    { name: 'Rifleman', value: 'rifleman' },
                    { name: 'Heavy', value: 'heavy' },
                    { name: 'Zooka', value: 'zooka' },
                    { name: 'Warrior', value: 'warrior' },
                    { name: 'Tank', value: 'tank' },
                    { name: 'Medic', value: 'medic' },
                    { name: 'Grenadier', value: 'grenadier' },
					{ name: 'Scorcher', value: 'scorcher' },
                    { name: 'Cryoneer', value: 'cryoneer' },
					{ name: 'Bombardier', value: 'bombardier' }
                )
        )
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Level of the troop')
                .setRequired(true)
        ),
    async execute(interaction) {
        const abilityType = interaction.options.getString('ability_type');
        const level = interaction.options.getInteger('level');
        const abilityData = gunboatAbilities[abilityType];

        if (!abilityData) {
            return interaction.reply({ content: 'Invalid gunboat ability!', ephemeral: true });
        }

        if (level < 1 || level > (abilityData.maxLevel || 1)) {
            return interaction.reply({ content: `Invalid level! Please provide a level between 1 and ${abilityData.maxLevel}.`, ephemeral: true });
        }

        const levelData = abilityData.levels[level];
        if (!levelData) {
            return interaction.reply({ content: `No data available for level ${level}.`, ephemeral: true });
        }

        const stats = levelData.stats;
        const researchCost = levelData.researchCost || { gold: 0 };
        const armoryRequired = levelData.armoryRequired || 'Not specified';
        const image = levelData.image || '';

        const embed = new EmbedBuilder()
                .setTitle(`${abilityData.name} - Level ${level}`)
                .setDescription(abilityData.description || 'No description available.')
                .setThumbnail(image)
                .setColor('#0099ff');

            // Handle unique stats for gunboat abilities
            if (abilityType === 'artillery') {
                embed.addFields(
                    { name: 'Damage', value: formatNumber(stats.damage), inline: true },
					{ name: 'Energy Cost', value: formatNumber(abilityData.energyCost), inline: true },
					{ name: `Energy Cost Increase per ${abilityData.name}`, value: formatNumber(abilityData.energyCostIncreasePerUse), inline: true },
                    { name: 'Research Cost', value: `Gold: ${formatNumber(researchCost.gold)}`, inline: true },
                    { name: 'Research Time', value: `${levelData.upgradeTime || 'Not available'}`, inline: true },
                    { name: 'Armory Level Required', value: armoryRequired.toString(), inline: true }
                );
            } else {
                return message.reply(`Stat data for the gunboat ability ${abilityData.name} is currently unavailable.`);
            }

        await interaction.reply({ embeds: [embed] });
    },
};