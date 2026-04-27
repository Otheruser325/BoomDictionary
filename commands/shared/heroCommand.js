import {
    ActionRowBuilder,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from 'discord.js';
import heroes from '../../data/heroes.json' with { type: 'json' };
import { formatNumber } from '../../utils/formatNumber.js';

function chunkValues(values, chunkSize = 25) {
    const chunks = [];

    for (let index = 0; index < values.length; index += chunkSize) {
        chunks.push(values.slice(index, index + chunkSize));
    }

    return chunks;
}

function createLevelSelectCustomId(baseId, index, total) {
    return total === 1 ? baseId : `${baseId}:${index}`;
}

function addFieldIfPresent(embed, name, value, inline = true) {
    if (value == null) {
        return;
    }

    embed.addFields({
        name,
        value: String(value),
        inline,
    });
}

function formatGoldCost(gold) {
    return gold == null ? 'N/A' : `Gold: ${formatNumber(gold)}`;
}

function formatTiles(value) {
    if (value == null) {
        return 'Unknown';
    }

    if (typeof value === 'string') {
        return `${value} Tiles`;
    }

    return `${formatNumber(value)} Tiles`;
}

export function getHero(heroType) {
    return heroes[heroType] ?? null;
}

export function getHeroLevelData(heroData, level) {
    return heroData?.levels?.[level] ?? null;
}

export function validateHeroRequest(heroType, level) {
    const heroData = getHero(heroType);

    if (!heroData) {
        return 'Invalid hero type!';
    }

    if (!Number.isInteger(level) || level < 1 || level > (heroData.maxLevel || 1)) {
        return `Invalid level! Please provide a level between 1 and ${heroData.maxLevel}.`;
    }

    if (!getHeroLevelData(heroData, level)) {
        return `No data available for level ${level}.`;
    }

    return null;
}

export function buildHeroLevelComponents(heroType, baseCustomId = 'select_hero_level') {
    const heroData = getHero(heroType);

    if (!heroData) {
        return [];
    }

    const levels = Array.from({ length: heroData.maxLevel }, (_, index) => index + 1);

    return chunkValues(levels).map((levelChunk, index, chunks) =>
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(createLevelSelectCustomId(baseCustomId, index, chunks.length))
                .setPlaceholder(
                    chunks.length === 1 ?
                        'Select a level' :
                        `Select levels ${levelChunk[0]}-${levelChunk.at(-1)}`
                )
                .addOptions(levelChunk.map((level) => {
                    const levelData = getHeroLevelData(heroData, level);

                    return new StringSelectMenuOptionBuilder()
                        .setLabel(`Level ${level}`)
                        .setValue(`${heroType}-${level}`)
                        .setDescription(
                            levelData?.heroHutRequired ?
                                `HQ ${levelData.heroHutRequired} required` :
                                'Requirement unavailable.'
                        );
                }))
        )
    );
}

function addHeroSpecificStats(embed, heroType, stats) {
    if (heroType === 'sergeant_brick') {
        addFieldIfPresent(embed, 'DPS', formatNumber(stats.dps));
        addFieldIfPresent(embed, 'Damage per Shot', formatNumber(stats.damagePerShot));
        addFieldIfPresent(embed, 'Grenade Damage', formatNumber(stats.grenadeDamage));
        return;
    }

    if (heroType === 'corporal_kavan') {
        addFieldIfPresent(embed, 'Heal per Second', formatNumber(stats.healPerSecond));
        addFieldIfPresent(embed, 'Damage Reduction', stats.damageReduction);
        return;
    }

    if (heroType === 'captain_everspark') {
        addFieldIfPresent(embed, 'In-Game DPS', formatNumber(stats.inGameDps));
        addFieldIfPresent(embed, 'Real DPS', formatNumber(stats.realDps));
        addFieldIfPresent(embed, 'Damage per Shot', formatNumber(stats.damagePerShot));
        addFieldIfPresent(embed, 'Critter Spawn Rate', stats.critterSpawnRate);
        return;
    }

    if (heroType === 'private_bullet') {
        addFieldIfPresent(embed, 'DPS', formatNumber(stats.dps));
        addFieldIfPresent(embed, 'Damage Limit', formatNumber(stats.damageLimit));
        return;
    }

    if (heroType === 'captain_ruddero') {
        addFieldIfPresent(embed, 'DPS', formatNumber(stats.dps));
        addFieldIfPresent(embed, 'Damage per Shot', formatNumber(stats.damagePerShot));
    }
}

export function buildHeroEmbed(heroType, level) {
    const heroData = getHero(heroType);
    const levelData = getHeroLevelData(heroData, level);
    const stats = levelData.stats || {};

    const embed = new EmbedBuilder()
        .setTitle(`${heroData.name} - Level ${level}`)
        .setDescription(heroData.description || 'No description available.')
        .setColor('#00b894');

    if (heroData.image) {
        embed.setThumbnail(heroData.image);
    }

    embed.addFields({
        name: 'Health',
        value: formatNumber(stats.health ?? 'N/A'),
        inline: true,
    }, {
        name: 'Attack Type',
        value: heroData.attackType || 'Unknown',
        inline: true,
    }, {
        name: 'Attack Range',
        value: formatTiles(heroData.attackRange),
        inline: true,
    }, {
        name: 'Attack Speed',
        value: heroData.attackSpeedLabel || 'Unknown',
        inline: true,
    }, {
        name: 'Movement Speed',
        value: heroData.movementSpeed == null ? 'Unknown' : formatNumber(heroData.movementSpeed),
        inline: true,
    }, {
        name: 'Unit Type',
        value: heroData.unitType || 'Unknown',
        inline: true,
    });

    addHeroSpecificStats(embed, heroType, stats);

    embed.addFields({
        name: 'Upgrade Cost',
        value: formatGoldCost(levelData.upgradeCost?.gold),
        inline: true,
    }, {
        name: 'Upgrade Time',
        value: levelData.upgradeTime ?? 'N/A',
        inline: true,
    }, {
        name: 'HQ Required',
        value: formatNumber(levelData.heroHutRequired ?? 'N/A'),
        inline: true,
    });

    return embed;
}
