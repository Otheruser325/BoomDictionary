import { reportExecutionError } from '../../utils/errorHandling.js';
import {
    buildDefenceEmbed,
    validateDefenceRequest,
} from '../shared/defenceCommand.js';

export const customId = 'select_defence_level';
export const customIdPrefix = 'select_defence_level';
export async function execute(interaction) {
    try {
        const [defenceType, level] = interaction.values[0].split('-');
        const levelNum = Number.parseInt(level, 10);
        const validationError = validateDefenceRequest(defenceType, levelNum);

        if (validationError) {
            return interaction.reply({ content: validationError, ephemeral: true });
        }

        await interaction.update({ embeds: [buildDefenceEmbed(defenceType, levelNum)], components: [] });
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'An error occurred while updating the defence selection. Please try again later.',
            interaction,
            scope: 'interaction-defence-level-failed',
        });
    }
}
