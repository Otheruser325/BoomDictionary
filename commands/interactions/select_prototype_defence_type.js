import { reportExecutionError } from '../../utils/errorHandling.js';
import {
    buildPrototypeDefenceLevelMenuPayload,
    getPrototypeDefence,
    normalizePrototypeDefenceType,
} from '../shared/prototypeCommand.js';

export const customId = 'select_prototype_defence_type';
export async function execute(interaction) {
    const mappedDefenceType = normalizePrototypeDefenceType(interaction.values[0]);
    const defenceData = getPrototypeDefence(mappedDefenceType);

    if (!defenceData) {
        return interaction.reply({ content: 'Invalid prototype defence type selected!', ephemeral: true });
    }

    try {
        await interaction.update(buildPrototypeDefenceLevelMenuPayload(mappedDefenceType));
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'There was an issue processing your request. Please try again.',
            interaction,
            scope: 'interaction-prototype-defence-type-failed',
        });
    }
}
