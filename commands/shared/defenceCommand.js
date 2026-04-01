import {
    ActionRowBuilder,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from 'discord.js';
import defences from '../../data/defences.json' with { type: 'json' };
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

function getRatePerSecond(value, speed) {
    if (!Number.isFinite(value) || !Number.isFinite(speed) || speed <= 0) {
        return 'Unknown';
    }

    return Number((value / (speed / 1000)).toFixed(2));
}

function formatUpgradeCost(upgradeCost) {
    const resources = [
        ['Wood', upgradeCost.wood],
        ['Stone', upgradeCost.stone],
        ['Iron', upgradeCost.iron],
    ].filter(([, value]) => value != null && value !== 0);

    if (resources.length === 0) {
        return 'N/A';
    }

    return resources.map(([name, value]) => `${name}: ${formatNumber(value)}`).join('\n');
}

export function getDefence(defenceType) {
    return defences[defenceType] ?? null;
}

export function validateDefenceRequest(defenceType, level) {
    const defenceData = getDefence(defenceType);

    if (!defenceData) {
        return 'Invalid defence type!';
    }

    if (!Number.isInteger(level) || level < 1 || level > (defenceData.maxLevel || 1)) {
        return `Invalid level! Please provide a level between 1 and ${defenceData.maxLevel}.`;
    }

    if (!defenceData.levels[level]) {
        return `No data available for level ${level}.`;
    }

    return null;
}

export function buildDefenceLevelComponents(
    defenceType,
    baseCustomId = 'select_defence_level'
) {
    const defenceData = getDefence(defenceType);

    if (!defenceData) {
        return [];
    }

    const levels = Array.from(
        { length: defenceData.maxLevel },
        (_, index) => index + 1
    );

    return chunkValues(levels).map((levelChunk, index, chunks) =>
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(createLevelSelectCustomId(baseCustomId, index, chunks.length))
                .setPlaceholder(
                    chunks.length === 1 ?
                        'Select a level' :
                        `Select levels ${levelChunk[0]}-${levelChunk.at(-1)}`
                )
                .addOptions(levelChunk.map((level) =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`Level ${level}`)
                        .setValue(`${defenceType}-${level}`)
                        .setDescription(
                            defenceData.levels[level]?.upgradeTime ||
                            'Available by default.'
                        )
                ))
        )
    );
}

export function buildDefenceEmbed(defenceType, level) {
    const defenceData = getDefence(defenceType);
    const levelData = defenceData.levels[level];
    const stats = levelData.stats || {};
    const upgradeCost = levelData.upgradeCost || {
        wood: null,
        stone: null,
        iron: null,
    };
    const attackSpeed = Number(defenceData.attackSpeed);
    const health = stats.health ?? 'N/A';
    const damage = stats.damage ?? 'N/A';
    const range = defenceData.range ?? 'Unknown';
    const upgradeTime = levelData.upgradeTime ?? 'N/A';
    const hqRequired = levelData.hqRequired ?? 'N/A';
    const dps = getRatePerSecond(stats.damage, attackSpeed);

    const embed = new EmbedBuilder()
        .setTitle(`${defenceData.name} - Level ${level}`)
        .setDescription(defenceData.description || 'No description available.')
        .setColor('#0099ff');

    if (levelData.image) {
        embed.setThumbnail(levelData.image);
    }

    if (defenceType === 'critter_launcher') {
        const crittersPerShot = 1;

        embed.addFields({
            name: 'Health',
            value: formatNumber(health),
            inline: true,
        }, {
            name: 'DPS',
            value: formatNumber(dps),
            inline: true,
        }, {
            name: 'Damage Per Shot',
            value: formatNumber(damage),
            inline: true,
        }, {
            name: 'Range',
            value: `${formatNumber(range)} Tiles`,
            inline: true,
        }, {
            name: 'Attack Speed',
            value: Number.isFinite(attackSpeed) ? `${formatNumber(attackSpeed)}ms` : 'Unknown',
            inline: true,
        }, {
            name: 'Critters Per Shot',
            value: formatNumber(crittersPerShot),
            inline: true,
        }, {
            name: 'Critters Per Second',
            value: formatNumber(getRatePerSecond(crittersPerShot, attackSpeed)),
            inline: true,
        });
    } else if (defenceType === 'shock_launcher') {
        embed.addFields({
            name: 'Health',
            value: formatNumber(health),
            inline: true,
        }, {
            name: 'DPS',
            value: formatNumber(dps),
            inline: true,
        }, {
            name: 'Damage Per Shot',
            value: formatNumber(damage),
            inline: true,
        }, {
            name: 'Range',
            value: `${formatNumber(range)} Tiles`,
            inline: true,
        }, {
            name: 'Attack Speed',
            value: Number.isFinite(attackSpeed) ? `${formatNumber(attackSpeed)}ms` : 'Unknown',
            inline: true,
        }, {
            name: 'Shock Duration',
            value: `${formatNumber(stats.stunDuration ?? 'N/A')} seconds`,
            inline: true,
        });
    } else {
        embed.addFields({
            name: 'Health',
            value: formatNumber(health),
            inline: true,
        }, {
            name: 'DPS',
            value: formatNumber(dps),
            inline: true,
        }, {
            name: 'Damage Per Shot',
            value: formatNumber(damage),
            inline: true,
        }, {
            name: 'Range',
            value: `${formatNumber(range)} Tiles`,
            inline: true,
        }, {
            name: 'Attack Speed',
            value: Number.isFinite(attackSpeed) ? `${formatNumber(attackSpeed)}ms` : 'Unknown',
            inline: true,
        });
    }

    embed.addFields({
        name: 'Upgrade Cost',
        value: formatUpgradeCost(upgradeCost),
        inline: true,
    }, {
        name: 'Upgrade Time',
        value: upgradeTime.toString(),
        inline: true,
    }, {
        name: 'HQ Required',
        value: hqRequired.toString(),
        inline: true,
    });

    return embed;
}
