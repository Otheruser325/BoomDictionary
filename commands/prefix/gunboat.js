import gunboatAbilities from '../../data/gunboatAbilities.json' with { type: 'json' };
import { execute as executeSlash } from '../slash/gunboat.js';
import { buildChoiceLookup, gunboatChoices } from '../shared/choices.js';
import { runTwoStageSelectPrefixCommand } from '../shared/prefixMenuBridge.js';

const gunboatLookup = buildChoiceLookup(gunboatChoices, {
    'smoke screen': 'smokescreen',
});

export const name = 'gunboat';
export const description = 'Get statistics for a gunboat ability.';
export const permissions = ['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks'];
export const aliases = ['gb'];
export const args = false;
export const usage = '<ability_type> <level>';

export function execute(message, args) {
    return runTwoStageSelectPrefixCommand({
        args,
        choices: gunboatChoices,
        dataset: gunboatAbilities,
        executeSlash,
        getLevelDescription: (abilityData, level) =>
            abilityData.levels[level]?.armoryRequired ?
                `Armory Level ${abilityData.levels[level].armoryRequired}` :
                'No details available.',
        getLevels: (abilityData) => Array.from(
            {
                length: abilityData.maxLevel,
            },
            (_, index) => index + 1
        ),
        itemTitle: 'Gunboat Ability',
        levelMenuDescription: 'Please choose a level to view its details.',
        levelMenuTitle: (abilityData) => `Select a Level for ${abilityData.name}`,
        levelOptionName: 'level',
        lookup: gunboatLookup,
        message,
        stringOptionName: 'ability_type',
        typeMenuDescription: 'Please choose a gunboat ability to view its details.',
        typeMenuTitle: 'Select a Gunboat Ability',
        typeSelectId: 'select-gunboat-ability-type',
        levelSelectId: 'select-gunboat-ability-level',
    });
}
