const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const gunboatAbilities = require('../../data/gunboatAbilities.json');

module.exports = {
    customId: 'select_gunboat_ability_type',
    async execute(interaction) {
        const selectedAbilityType = interaction.values[0];
        const abilityData = gunboatAbilities[selectedAbilityType];

        if (!abilityData) {
            return interaction.reply({ content: 'No data found for the selected gunboat ability.', ephemeral: true });
        }

        const maxOptions = 25;
        const levels = Array.from({ length: abilityData.maxLevel }, (_, i) => i + 1);
        const levelOptions = levels.slice(0, maxOptions).map(level => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(`Level ${level}`)
                .setValue(`${selectedAbilityType}-${level}`)
                .setDescription(abilityData.levels[level]?.armoryRequired ? `Armory Level ${abilityData.levels[level].armoryRequired}` : 'No details available.');
        });

        const levelSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_gunboat_ability_level')
            .setPlaceholder('Select a level')
            .addOptions(levelOptions);

        const row = new ActionRowBuilder().addComponents(levelSelectMenu);

        const embed = new EmbedBuilder()
            .setTitle(`Select a Level for ${abilityData.name}`)
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
