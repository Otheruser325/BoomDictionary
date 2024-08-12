const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const troops = require('../../data/troops.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('troop')
        .setDescription('Get statistics for a specific type of troop.')
        .addStringOption(option =>
            option.setName('troop_type')
                .setDescription('Type of troop')
                .setRequired(true)
                .addChoices(
                    { name: 'Rifleman', value: 'rifleman' },
                    { name: 'Heavy', value: 'heavy' },
                    { name: 'Zooka', value: 'zooka' },
                    { name: 'Tank', value: 'tank' },
                    { name: 'Grenadier', value: 'grenadier' }
                )
        )
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Level of the troop')
                .setRequired(true)
        ),
    async execute(interaction) {
        const troopType = interaction.options.getString('troop_type');
        const level = interaction.options.getInteger('level');
        const troopData = troops[troopType];

        if (!troopData) {
            return interaction.reply({ content: 'Invalid troop type!', ephemeral: true });
        }

        if (level < 1 || level > (troopData.maxLevel || 1)) {
            return interaction.reply({ content: `Invalid level! Please provide a level between 1 and ${troopData.maxLevel}.`, ephemeral: true });
        }

        const stats = troopData.levels[level].stats;
        const embed = new EmbedBuilder()
            .setTitle(`${troopData.name} - Level ${level}`)
            .setDescription(troopData.description || 'No description available.')
            .addFields(
                { name: 'Health', value: stats.health.toString(), inline: true },
                { name: 'Damage', value: stats.damage.toString(), inline: true },
                { name: 'Range', value: stats.range.toString(), inline: true }
            )
            .setColor('#0099ff');

        await interaction.reply({ embeds: [embed] });
    },
};
