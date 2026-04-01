import {
    ActionRowBuilder,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from 'discord.js';
import troops from '../../data/troops.json' with { type: 'json' };
import { formatNumber } from '../../utils/formatNumber.js';

function chunkValues(values, chunkSize = 25) {
    const chunks = [];

    for (let index = 0; index < values.length; index += chunkSize) {
        chunks.push(values.slice(index, index + chunkSize));
    }

    return chunks;
}

function formatGoldCost(gold) {
    return gold == null ? 'N/A' : `Gold: ${formatNumber(gold)}`;
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

export function getTroop(troopType) {
    return troops[troopType] ?? null;
}

export function validateTroopRequest(troopType, level) {
    const troopData = getTroop(troopType);

    if (!troopData) {
        return 'Invalid troop type!';
    }

    if (!Number.isInteger(level) || level < 1 || level > (troopData.maxLevel || 1)) {
        return `Invalid level! Please provide a level between 1 and ${troopData.maxLevel}.`;
    }

    if (!troopData.levels[level]) {
        return `No data available for level ${level}.`;
    }

    return null;
}

export function buildTroopLevelComponents(
    troopType,
    baseCustomId = 'select_troop_level'
) {
    const troopData = getTroop(troopType);

    if (!troopData) {
        return [];
    }

    const levels = Array.from(
        { length: troopData.maxLevel },
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
                        .setValue(`${troopType}-${level}`)
                        .setDescription(
                            troopData.levels[level]?.armoryRequired ?
                                `Armory Level ${troopData.levels[level].armoryRequired}` :
                                'Available by default.'
                        )
                ))
        )
    );
}

export function buildTroopEmbed(troopType, level) {
    const troopData = getTroop(troopType);
    const levelData = troopData.levels[level];
    const stats = levelData.stats || {};
    const trainingCost = levelData.trainingCost || { gold: null };
    const researchCost = levelData.researchCost || { gold: null };
    const attackSpeed = Number(troopData.attackSpeed);
    const range = troopData.attackRange ?? 'Unknown';
    const unitSize = troopData.unitSize ?? 'N/A';
    const trainingTime = troopData.trainingTime ?? 'N/A';
    const movementSpeed = troopData.movementSpeed ?? 'N/A';
    const armoryRequired = levelData.armoryRequired ?? 'N/A';
    const health = stats.health ?? 'N/A';
    const damage = stats.damage ?? 'N/A';
    const dps = getRatePerSecond(stats.damage, attackSpeed);
    const hps = getRatePerSecond(stats.healing, attackSpeed);

    const embed = new EmbedBuilder()
        .setTitle(`${troopData.name} - Level ${level}`)
        .setDescription(troopData.description || 'No description available.')
        .setColor('#0099ff');

    if (troopData.image) {
        embed.setThumbnail(troopData.image);
    }

    if (troopType === 'warrior') {
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
            name: 'Healing Per Attack',
            value: formatNumber(stats.selfHeal ?? 'N/A'),
            inline: true,
        });
    } else if (troopType === 'medic') {
        embed.addFields({
            name: 'Health',
            value: formatNumber(health),
            inline: true,
        }, {
            name: 'Healing Per Second',
            value: formatNumber(hps),
            inline: true,
        }, {
            name: 'Healing Per Shot',
            value: formatNumber(stats.healing ?? 'N/A'),
            inline: true,
        }, {
            name: 'Heal Range',
            value: `${formatNumber(range)} Tiles`,
            inline: true,
        }, {
            name: 'Heal Speed',
            value: Number.isFinite(attackSpeed) ? `${formatNumber(attackSpeed)}ms` : 'Unknown',
            inline: true,
        }, {
            name: 'Heal Type',
            value: `Splash (${formatNumber(troopData.splashRadius ?? 'N/A')} Tiles)`,
            inline: true,
        });
    } else if (troopType === 'cryoneer') {
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
            name: 'Freeze Power',
            value: `${formatNumber(troopData.speedReduction ?? 'N/A')}%`,
            inline: true,
        }, {
            name: 'Freeze Duration',
            value: `${formatNumber(troopData.freezeDuration ?? 'N/A')} seconds`,
            inline: true,
        }, {
            name: 'Beam Extension',
            value: `${formatNumber(stats.beamExtension ?? 'N/A')}%`,
            inline: true,
        });
    } else if (troopType === 'grenadier' || troopType === 'bombardier') {
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
            name: 'Splash Radius',
            value: `${formatNumber(troopData.splashRadius ?? 'N/A')} Tiles`,
            inline: true,
        });
    } else if (troopType === 'scorcher') {
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
            name: 'Death Damage',
            value: formatNumber(stats.deathDamage ?? 'N/A'),
            inline: true,
        }, {
            name: 'Death Radius',
            value: `${formatNumber(troopData.deathRadius ?? 'N/A')} Tiles`,
            inline: true,
        });
    } else if (troopType === 'laser_ranger') {
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
            name: 'Beam Extension',
            value: `${formatNumber(stats.beamExtension ?? 'N/A')}%`,
            inline: true,
        });
    } else if (troopType === 'mech') {
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
            name: 'Splash Radius',
            value: `${formatNumber(troopData.splashRadius ?? 'N/A')} Tiles`,
            inline: true,
        }, {
            name: 'Shock Duration',
            value: `${formatNumber(troopData.stunDuration ?? 'N/A')} seconds`,
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
        });
    }

    if (troopType !== 'medic') {
        embed.addFields({
            name: 'Training Cost',
            value: formatGoldCost(trainingCost.gold),
            inline: true,
        }, {
            name: 'Research Cost',
            value: formatGoldCost(researchCost.gold),
            inline: true,
        }, {
            name: 'Unit Size',
            value: formatNumber(unitSize),
            inline: true,
        }, {
            name: 'Training Time',
            value: trainingTime.toString(),
            inline: true,
        }, {
            name: 'Movement Speed',
            value: movementSpeed.toString(),
            inline: true,
        }, {
            name: 'Attack Range',
            value: `${formatNumber(range)} Tiles`,
            inline: true,
        }, {
            name: 'Attack Speed',
            value: Number.isFinite(attackSpeed) ? `${formatNumber(attackSpeed)}ms` : 'Unknown',
            inline: true,
        }, {
            name: 'Armory Level Required',
            value: armoryRequired.toString(),
            inline: true,
        });

        return embed;
    }

    embed.addFields({
        name: 'Training Cost',
        value: formatGoldCost(trainingCost.gold),
        inline: true,
    }, {
        name: 'Research Cost',
        value: formatGoldCost(researchCost.gold),
        inline: true,
    }, {
        name: 'Unit Size',
        value: formatNumber(unitSize),
        inline: true,
    }, {
        name: 'Training Time',
        value: trainingTime.toString(),
        inline: true,
    }, {
        name: 'Movement Speed',
        value: movementSpeed.toString(),
        inline: true,
    }, {
        name: 'Armory Level Required',
        value: armoryRequired.toString(),
        inline: true,
    });

    return embed;
}
