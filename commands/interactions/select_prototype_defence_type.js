const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const prototypeDefences = require('../../data/prototypeDefences.json');

const validPrototypeDefenceTypes = {
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
    customId: 'select_prototype_defence_type',
    async execute(interaction) {
        const selectedDefenceType = interaction.values[0].toLowerCase();
        const mappedDefenceType = validPrototypeDefenceTypes[selectedDefenceType];

        const defenceData = prototypeDefences[mappedDefenceType];

        if (!defenceData) {
            return interaction.reply({ content: 'Invalid prototype defence type selected!', ephemeral: true });
        }

        const maxOptions = 25; // Define the maximum options for levels
        const levels = Array.from({ length: defenceData.maxLevel }, (_, i) => i + 1);
        const levelOptions = levels.slice(0, maxOptions).map(level => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(`Level ${level}`)
                .setValue(`${mappedDefenceType}-${level}`)
                .setDescription(defenceData.levels[level]?.buildTime || 'No details available.');
        });

        const levelSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_prototype_defence_level')
            .setPlaceholder('Select a level')
            .addOptions(levelOptions);

        const row = new ActionRowBuilder().addComponents(levelSelectMenu);

        const embed = new EmbedBuilder()
            .setTitle(`Select a Level for ${defenceData.name}`)
            .setDescription('Please choose a level to view its details.')
            .setColor('#0099ff');

        try {
            await interaction.update({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error('Error updating interaction:', error);
            if (error.code === 10062 || error.code === 40060) { 
                return interaction.followUp({ content: 'There was an issue processing your request. Please try again.', ephemeral: true });
            }
        }
    }
};
