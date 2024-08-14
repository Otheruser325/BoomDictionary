const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const defences = require('../../data/defences.json');

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
    customId: 'select_defence_type',
    async execute(interaction) {
        const selectedDefenceType = interaction.values[0];
        const defenceType = validDefenceTypes[selectedDefenceType];

        if (!defenceType) {
            return interaction.reply({ content: 'Invalid defence type selected!', ephemeral: true });
        }

        const defenceData = defences[defenceType];

        if (!defenceData) {
            return interaction.reply({ content: 'No data found for the selected defence type.', ephemeral: true });
        }

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
    }
};
