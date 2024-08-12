const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const defences = require('../../data/defences.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('defence')
        .setDescription('Get statistics for a specific type of defence.')
        .addStringOption(option =>
            option.setName('defence_type')
                .setDescription('Type of defence')
                .setRequired(true)
                .addChoices(
                    { name: 'Sniper Tower', value: 'sniper_tower' },
                    { name: 'Machine Gun', value: 'machine_gun' },
                    { name: 'Mortar', value: 'mortar' },
                    { name: 'Cannon', value: 'cannon' },
                    { name: 'Flamethrower', value: 'flamethrower' },
                    { name: 'Boom Cannon', value: 'boom_cannon' },
                    { name: 'Critter Launcher', value: 'critter_launcher' },
                    { name: 'Rocket Launcher', value: 'rocket_launcher' },
                    { name: 'Shock Launcher', value: 'shock_launcher' }
                )
        )
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Level of the defence')
                .setRequired(true)
        ),
    async execute(interaction) {
        const defenceType = interaction.options.getString('defence_type');
        const level = interaction.options.getInteger('level');
        const defenceData = defences[defenceType];

        if (!defenceData) {
            return interaction.reply({ content: 'Invalid defence type!', ephemeral: true });
        }

        if (level < 1 || level > (defenceData.maxLevel || 1)) {
            return interaction.reply({ content: `Invalid level! Please provide a level between 1 and ${defenceData.maxLevel}.`, ephemeral: true });
        }

        const stats = defenceData.levels[level].stats;
        const embed = new EmbedBuilder()
            .setTitle(`${defenceData.name} - Level ${level}`)
            .setDescription(defenceData.description || 'No description available.')
            .addFields(
                { name: 'Health', value: stats.health.toString(), inline: true },
                { name: 'Damage', value: stats.damage.toString(), inline: true },
                { name: 'Range', value: stats.range.toString(), inline: true }
            )
            .setColor('#0099ff');

        await interaction.reply({ embeds: [embed] });
    },
};
