import { reportExecutionError } from '../../utils/errorHandling.js';
import {
    buildGunboatEmbed,
    parseGunboatLevelValue,
    validateGunboatRequest,
} from '../shared/gunboatCommand.js';

export const customId = 'select_temporary_gunboat_ability_level';
export const customIdPrefix = 'select_temporary_gunboat_ability_level';

export async function execute(interaction) {
    try {
        const {
            abilityType,
            category,
            level,
        } = parseGunboatLevelValue(interaction.values[0]);
        const validationError = validateGunboatRequest(category, abilityType, level);

        if (validationError) {
            return interaction.reply({
                content: validationError,
                ephemeral: true,
            });
        }

        await interaction.update({
            embeds: [buildGunboatEmbed(category, abilityType, level)],
            components: [],
        });
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'An error occurred while updating the temporary gunboat selection. Please try again later.',
            interaction,
            scope: 'interaction-temporary-gunboat-level-failed',
        });
    }
}
