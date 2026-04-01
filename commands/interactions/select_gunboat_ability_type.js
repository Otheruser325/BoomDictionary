import { EmbedBuilder } from 'discord.js';
import { reportExecutionError } from '../../utils/errorHandling.js';
import {
    buildGunboatLevelComponents,
    getGunboatAbility,
} from '../shared/gunboatCommand.js';

export const customId = 'select_gunboat_ability_type';
export async function execute(interaction) {
    const selectedAbilityType = interaction.values[0];
    const abilityData = getGunboatAbility(selectedAbilityType);

    if (!abilityData) {
        return interaction.reply({ content: 'No data found for the selected gunboat ability.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle(`Select a Level for ${abilityData.name}`)
        .setDescription('Please choose a level to view its details.')
        .setColor('#0099ff');

    try {
        await interaction.update({
            embeds: [embed],
            components: buildGunboatLevelComponents(selectedAbilityType),
        });
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'There was an issue processing your request. Please try again.',
            interaction,
            scope: 'interaction-gunboat-type-failed',
        });
    }
}
