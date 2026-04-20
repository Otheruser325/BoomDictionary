import { reportExecutionError } from '../../utils/errorHandling.js';
import {
    buildGunboatSelectionPayload,
    getGunboatAbility,
} from '../shared/gunboatCommand.js';

export const customId = 'select_temporary_gunboat_ability_type';

export async function execute(interaction) {
    const selectedAbilityType = interaction.values[0];
    const abilityData = getGunboatAbility('temporary', selectedAbilityType);

    if (!abilityData) {
        return interaction.reply({
            content: 'No data found for the selected temporary gunboat ability.',
            ephemeral: true,
        });
    }

    try {
        await interaction.update(
            buildGunboatSelectionPayload(
                'temporary',
                selectedAbilityType,
                'select_temporary_gunboat_ability_level'
            )
        );
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'There was an issue processing your request. Please try again.',
            interaction,
            scope: 'interaction-temporary-gunboat-type-failed',
        });
    }
}
