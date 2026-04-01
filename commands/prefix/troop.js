import troops from '../../data/troops.json' with { type: 'json' };
import { execute as executeSlash } from '../slash/troop.js';
import { buildChoiceLookup, troopChoices } from '../shared/choices.js';
import { runTwoStageSelectPrefixCommand } from '../shared/prefixMenuBridge.js';

const troopLookup = buildChoiceLookup(troopChoices);

export const name = 'troop';
export const description = 'Get statistics for a specific type of troop.';
export const permissions = ['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks'];
export const args = false;
export const usage = '<troop_type> <level>';

export function execute(message, args) {
    return runTwoStageSelectPrefixCommand({
        args,
        choices: troopChoices,
        dataset: troops,
        executeSlash,
        getLevelDescription: (troopData, level) =>
            troopData.levels[level]?.armoryRequired ?
                `Armory Level ${troopData.levels[level].armoryRequired}` :
                'No details available.',
        getLevels: (troopData) => Array.from(
            {
                length: troopData.maxLevel,
            },
            (_, index) => index + 1
        ),
        itemTitle: 'Troop Type',
        levelMenuDescription: 'Please choose a level to view its details.',
        levelMenuTitle: (troopData) => `Select a Level for ${troopData.name}`,
        levelOptionName: 'level',
        lookup: troopLookup,
        message,
        stringOptionName: 'troop_type',
        typeMenuDescription: 'Please choose a troop type to view its details.',
        typeMenuTitle: 'Select a Troop Type',
        typeSelectId: 'select-troop-type',
        levelSelectId: 'select-troop-level',
    });
}
