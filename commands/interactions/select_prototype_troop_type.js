import { reportExecutionError } from '../../utils/errorHandling.js';
import {
    buildPrototypeTroopLevelMenuPayload,
    getPrototypeTroop,
    normalizePrototypeTroopType,
} from '../shared/prototypeCommand.js';

export const customId = 'select_prototype_troop_type';
export async function execute(interaction) {
    const selectedTroopType = normalizePrototypeTroopType(interaction.values[0]);
    const troopData = getPrototypeTroop(selectedTroopType);

    if (!troopData) {
        return interaction.reply({ content: 'No data found for the selected troop type.', ephemeral: true });
    }

    try {
        await interaction.update(buildPrototypeTroopLevelMenuPayload(selectedTroopType));
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'There was an issue processing your request. Please try again.',
            interaction,
            scope: 'interaction-prototype-troop-type-failed',
        });
    }
}
