import { reportExecutionError } from '../../utils/errorHandling.js';
import {
    buildGunboatEmbed,
    validateGunboatRequest,
} from '../shared/gunboatCommand.js';

export const customId = 'select_gunboat_ability_level';
export const customIdPrefix = 'select_gunboat_ability_level';
export async function execute(interaction) {
    try {
        const [abilityType, level] = interaction.values[0].split('-');
        const levelNum = Number.parseInt(level, 10);
        const validationError = validateGunboatRequest(abilityType, levelNum);

        if (validationError) {
            return interaction.reply({
                content: validationError,
                ephemeral: true,
            });
        }

        await interaction.update({
            embeds: [buildGunboatEmbed(abilityType, levelNum)],
            components: [],
        });
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'An error occurred while updating the gunboat selection. Please try again later.',
            interaction,
            scope: 'interaction-gunboat-level-failed',
        });
    }
}
