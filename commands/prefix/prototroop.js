import prototypeTroops from '../../data/prototypeTroops.json' with { type: 'json' };
import { execute as executeSlash } from '../slash/prototype.js';
import {
    buildChoiceLookup,
    prototypeTroopChoices,
} from '../shared/choices.js';
import { runTwoStageSelectPrefixCommand } from '../shared/prefixMenuBridge.js';

const prototypeTroopLookup = buildChoiceLookup(prototypeTroopChoices);

export const name = 'prototroop';
export const description = 'Get statistics for a prototype troop.';
export const permissions = ['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks'];
export const aliases = ['prototypeTroop'];
export const usage = '<prototroop_type> <level>';

export function execute(message, args) {
    return runTwoStageSelectPrefixCommand({
        args,
        choices: prototypeTroopChoices,
        dataset: prototypeTroops,
        executeSlash,
        getLevelDescription: (troopData, level) =>
            troopData.levels[level]?.workshopRequired ?
                `Workshop Level ${troopData.levels[level].workshopRequired}` :
                troopData.levels[level]?.armoryRequired ?
                    `Armory Level ${troopData.levels[level].armoryRequired}` :
                'No details available.',
        getLevels: (troopData) => Object.keys(troopData.levels || {})
            .map((value) => Number.parseInt(value, 10))
            .filter(Number.isInteger)
            .sort((left, right) => left - right),
        itemTitle: 'Prototype Troop',
        levelMenuDescription: 'Please choose a level to view its details.',
        levelMenuTitle: (troopData) => `Select a Level for ${troopData.name}`,
        levelOptionName: 'level',
        lookup: prototypeTroopLookup,
        message,
        stringOptionName: 'prototroop_type',
        subcommand: 'troop',
        typeMenuDescription: 'Please choose a prototype troop to view its details.',
        typeMenuTitle: 'Select a Prototype Troop',
        typeSelectId: 'select-prototype-troop-type',
        levelSelectId: 'select-prototype-troop-level',
    });
}
