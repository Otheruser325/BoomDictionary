import prototypeDefences from '../../data/prototypeDefences.json' with { type: 'json' };
import { execute as executeSlash } from '../slash/prototype.js';
import {
    buildChoiceLookup,
    prototypeDefenceChoices,
} from '../shared/choices.js';
import { runTwoStageSelectPrefixCommand } from '../shared/prefixMenuBridge.js';

const prototypeDefenceLookup = buildChoiceLookup(prototypeDefenceChoices, {
    's.i.m.o': 'simo',
});

export const name = 'protodefence';
export const description = 'Get statistics for a prototype defence.';
export const permissions = ['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks'];
export const aliases = ['protodefense', 'prototypedefence', 'prototypedefense'];
export const args = false;
export const usage = '<protodefence_type> <level>';

export function execute(message, args) {
    return runTwoStageSelectPrefixCommand({
        args,
        choices: prototypeDefenceChoices,
        dataset: prototypeDefences,
        executeSlash,
        getLevelDescription: (defenceData, level) =>
            defenceData.levels[level]?.buildTime || 'No details available.',
        getLevels: (defenceData) => Array.from(
            {
                length: defenceData.maxLevel,
            },
            (_, index) => index + 1
        ),
        itemTitle: 'Prototype Defence',
        levelMenuDescription: 'Please choose a mark to view its details.',
        levelMenuTitle: (defenceData) => `Select a Mark for ${defenceData.name}`,
        levelOptionName: 'level',
        levelOptionText: 'Mark',
        lookup: prototypeDefenceLookup,
        message,
        stringOptionName: 'protodefence_type',
        subcommand: 'defence',
        typeMenuDescription: 'Please choose a prototype defence to view its details.',
        typeMenuTitle: 'Select a Prototype Defence',
        typeSelectId: 'select-prototype-defence-type',
        levelSelectId: 'select-prototype-defence-level',
    });
}
