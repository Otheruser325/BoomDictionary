import { reportExecutionError } from '../../utils/errorHandling.js';
import {
    buildTroopEmbed,
    validateTroopRequest,
} from '../shared/troopCommand.js';

export const customId = 'select_troop_level';
export const customIdPrefix = 'select_troop_level';
export async function execute(interaction) {
    try {
        const [troopType, level] = interaction.values[0].split('-');
        const levelNum = Number.parseInt(level, 10);
        const validationError = validateTroopRequest(troopType, levelNum);

        if (validationError) {
            return interaction.reply({ content: validationError, ephemeral: true });
        }

        await interaction.update({ embeds: [buildTroopEmbed(troopType, levelNum)], components: [] });
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'An error occurred while updating the troop selection. Please try again later.',
            interaction,
            scope: 'interaction-troop-level-failed',
        });
    }
}
