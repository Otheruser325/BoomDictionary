import { reportExecutionError } from '../../utils/errorHandling.js';
import { createComponentExecutionAdapter } from '../../utils/interactionAdapter.js';
import { execute as executeSlash } from '../slash/prototype.js';

export const customId = 'select_prototype_troop_level';
export const customIdPrefix = 'select_prototype_troop_level';
export async function execute(interaction) {
    try {
        const [troopType, level] = interaction.values[0].split('-');
        const levelNum = Number.parseInt(level, 10);

        await executeSlash(
            createComponentExecutionAdapter(
                interaction,
                {
                    integers: {
                        level: levelNum,
                    },
                    strings: {
                        prototroop_type: troopType,
                    },
                    subcommand: 'troop',
                }
            )
        );
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'An error occurred while updating the prototype troop selection. Please try again later.',
            interaction,
            scope: 'interaction-prototype-troop-level-failed',
        });
    }
}
