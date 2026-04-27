import heroes from '../../data/heroes.json' with { type: 'json' };
import { execute as executeSlash } from '../slash/hero.js';
import { buildChoiceLookup, heroChoices } from '../shared/choices.js';
import { runTwoStageSelectPrefixCommand } from '../shared/prefixMenuBridge.js';

const heroLookup = buildChoiceLookup(heroChoices, {
    brick: 'sergeant_brick',
    kavan: 'corporal_kavan',
    'dr kavan': 'corporal_kavan',
    everspark: 'captain_everspark',
    bullit: 'private_bullet',
    bullet: 'private_bullet',
    ruddero: 'captain_ruddero',
});

export const name = 'hero';
export const description = 'Get statistics for a specific Boom Beach hero.';
export const permissions = ['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks'];
export const args = false;
export const usage = '<hero_type> <level>';

export function execute(message, args) {
    return runTwoStageSelectPrefixCommand({
        args,
        choices: heroChoices,
        dataset: heroes,
        executeSlash,
        getLevelDescription: (heroData, level) =>
            heroData.levels[level]?.heroHutRequired ?
                `Hero Hut Level ${heroData.levels[level].heroHutRequired}` :
                'HQ requirement is listed per level.',
        getLevels: (heroData) => Array.from(
            {
                length: heroData.maxLevel,
            },
            (_, index) => index + 1
        ),
        itemTitle: 'Hero Type',
        levelMenuDescription: 'Please choose a level to view hero details.',
        levelMenuTitle: (heroData) => `Select a Level for ${heroData.name}`,
        levelOptionName: 'level',
        lookup: heroLookup,
        message,
        stringOptionName: 'hero_type',
        typeMenuDescription: 'Please choose a hero type to view its details.',
        typeMenuTitle: 'Select a Hero Type',
        typeSelectId: 'select-hero-type',
        levelSelectId: 'select-hero-level',
    });
}
