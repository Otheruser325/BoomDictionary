import { reportExecutionError } from '../../utils/errorHandling.js';
import {
    buildHeroEmbed,
    validateHeroRequest,
} from '../shared/heroCommand.js';

export const customId = 'select_hero_level';
export const customIdPrefix = 'select_hero_level';

export async function execute(interaction) {
    try {
        const [heroType, level] = interaction.values[0].split('-');
        const levelNum = Number.parseInt(level, 10);
        const validationError = validateHeroRequest(heroType, levelNum);

        if (validationError) {
            return interaction.reply({ content: validationError, ephemeral: true });
        }

        await interaction.update({ embeds: [buildHeroEmbed(heroType, levelNum)], components: [] });
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'An error occurred while updating the hero selection. Please try again later.',
            interaction,
            scope: 'interaction-hero-level-failed',
        });
    }
}
