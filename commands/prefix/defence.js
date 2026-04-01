import defences from '../../data/defences.json' with { type: 'json' };
import { execute as executeSlash } from '../slash/defence.js';
import { buildChoiceLookup, defenceChoices } from '../shared/choices.js';
import { runTwoStageSelectPrefixCommand } from '../shared/prefixMenuBridge.js';

const defenceLookup = buildChoiceLookup(defenceChoices);

export const name = 'defence';
export const description = 'Get statistics for a specific type of defence.';
export const permissions = ['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks'];
export const aliases = ['defense'];
export const args = false;

export function execute(message, args) {
    return runTwoStageSelectPrefixCommand({
        args,
        choices: defenceChoices,
        dataset: defences,
        executeSlash,
        getLevelDescription: (defenceData, level) =>
            defenceData.levels[level]?.upgradeTime || 'No details available.',
        getLevels: (defenceData) => Array.from(
            {
                length: defenceData.maxLevel,
            },
            (_, index) => index + 1
        ),
        itemTitle: 'Defence Type',
        levelMenuDescription: 'Please choose a level to view its details.',
        levelMenuTitle: (defenceData) => `Select a Level for ${defenceData.name}`,
        levelOptionName: 'level',
        lookup: defenceLookup,
        message,
        stringOptionName: 'defence_type',
        typeMenuDescription: 'Please choose a defence type to view its details.',
        typeMenuTitle: 'Select a Defence Type',
        typeSelectId: 'select-defence-type',
        levelSelectId: 'select-defence-level',
    });
}
