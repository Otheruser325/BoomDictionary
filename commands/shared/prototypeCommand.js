import {
    ActionRowBuilder,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from 'discord.js';
import prototypeDefences from '../../data/prototypeDefences.json' with { type: 'json' };
import prototypeTroops from '../../data/prototypeTroops.json' with { type: 'json' };
import {
    buildChoiceLookup,
    prototypeDefenceChoices,
    prototypeTroopChoices,
} from './choices.js';
import { formatNumber } from '../../utils/formatNumber.js';

const MIN_PROTOTYPE_TROOP_LEVEL = 12;
const prototypeDefenceLookup = buildChoiceLookup(prototypeDefenceChoices);
const prototypeTroopLookup = buildChoiceLookup(prototypeTroopChoices);

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

function getAvailableLevels(levels) {
    return Object.keys(levels || {})
        .map((value) => Number.parseInt(value, 10))
        .filter(Number.isInteger)
        .sort((left, right) => left - right);
}

function getRatePerSecond(value, speed) {
    if (!Number.isFinite(value) || !Number.isFinite(speed) || speed <= 0) {
        return 'Unknown';
    }

    return Number((value / (speed / 1000)).toFixed(2));
}

function formatPrototypeBuildCost(buildCost = {}) {
    return `Fuses: ${formatNumber(buildCost.fuses ?? 0)}\n` +
        `Gears: ${formatNumber(buildCost.gears ?? 0)}\n` +
        `Rods: ${formatNumber(buildCost.rods ?? 0)}\n` +
        `Capacitors: ${formatNumber(buildCost.capacitors ?? 0)}`;
}

function formatPrototypeTrainingCost(trainingCost = {}) {
    return `Gold: ${formatNumber(trainingCost.gold ?? null)}`;
}

function getPrototypeTokenCost(level) {
    return level < 26 ? 250 + (level - MIN_PROTOTYPE_TROOP_LEVEL) * 100 : 2500;
}

function addSharedPrototypeDefenceFields(
    embed,
    defenceData,
    levelData,
    stats,
    attackSpeed,
    dps,
    {
        showDetectionFields = true,
        showRange = true,
    } = {}
) {
    const buildCost = levelData.buildCost || {};

    embed.addFields({
        name: 'Build Cost',
        value: formatPrototypeBuildCost(buildCost),
        inline: true,
    }, {
        name: 'Build Time',
        value: levelData.buildTime || 'N/A',
        inline: true,
    }, {
        name: 'Weapon Lab Required',
        value: `${levelData.weaponLabRequired || 'Not available'}`,
        inline: true,
    }, {
        name: 'Mark',
        value: `${levelData.marks || 'N/A'}`,
        inline: true,
    });

    if (showDetectionFields && defenceData.canDetectSmoke != null) {
        embed.addFields({
            name: 'Can Detect Smoke',
            value: String(defenceData.canDetectSmoke),
            inline: true,
        });
    }

    if (showDetectionFields && defenceData.canTargetAir != null) {
        embed.addFields({
            name: 'Can Target Air',
            value: String(defenceData.canTargetAir),
            inline: true,
        });
    }

    if (showRange && Number.isFinite(defenceData.range)) {
        embed.addFields({
            name: 'Range',
            value: `${formatNumber(defenceData.range)} Tiles`,
            inline: true,
        });
    }

    if (attackSpeed === 'Unknown') {
        return;
    }

    if (stats.damage != null) {
        embed.addFields({
            name: 'DPS',
            value: formatNumber(dps),
            inline: true,
        }, {
            name: 'Damage Per Shot',
            value: formatNumber(stats.damage),
            inline: true,
        });
    }

    embed.addFields({
        name: 'Attack Speed',
        value: `${formatNumber(attackSpeed)}ms`,
        inline: true,
    });
}

export function normalizePrototypeDefenceType(value) {
    return prototypeDefenceLookup[String(value).toLowerCase()] ?? value ?? null;
}

export function normalizePrototypeTroopType(value) {
    return prototypeTroopLookup[String(value).toLowerCase()] ?? value ?? null;
}

export function getPrototypeDefence(defenceType) {
    return prototypeDefences[normalizePrototypeDefenceType(defenceType)] ?? null;
}

export function getPrototypeTroop(troopType) {
    return prototypeTroops[normalizePrototypeTroopType(troopType)] ?? null;
}

export function validatePrototypeDefenceRequest(defenceType, level) {
    const defenceData = getPrototypeDefence(defenceType);

    if (!defenceData) {
        return 'Invalid prototype defence!';
    }

    if (!Number.isInteger(level) || level < 1 || level > (defenceData.maxLevel || 1)) {
        return `Invalid level! Please provide a level between 1 and ${defenceData.maxLevel || 1}.`;
    }

    if (!defenceData.levels[level]) {
        return `No data available for level ${level}.`;
    }

    return null;
}

export function validatePrototypeTroopRequest(troopType, level) {
    const troopData = getPrototypeTroop(troopType);
    const availableLevels = getAvailableLevels(troopData?.levels);

    if (!troopData) {
        return 'Invalid prototype troop type!';
    }

    if (!Number.isInteger(level) || availableLevels.length === 0) {
        return 'No level data is available for this prototype troop yet.';
    }

    if (level < availableLevels[0] || level > availableLevels.at(-1)) {
        return `Invalid level! Please provide a level between ${availableLevels[0]} and ${availableLevels.at(-1)}.`;
    }

    if (!troopData.levels[level]) {
        return `No data available for level ${level}.`;
    }

    return null;
}

export function buildPrototypeDefenceLevelComponents(
    defenceType,
    baseCustomId = 'select_prototype_defence_level'
) {
    const normalizedType = normalizePrototypeDefenceType(defenceType);
    const defenceData = getPrototypeDefence(normalizedType);

    if (!defenceData) {
        return [];
    }

    const levels = Array.from({ length: defenceData.maxLevel }, (_, index) => index + 1);

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
                        .setValue(`${normalizedType}-${level}`)
                        .setDescription(
                            defenceData.levels[level]?.buildTime || 'No details available.'
                        )
                ))
        )
    );
}

export function buildPrototypeTroopLevelComponents(
    troopType,
    baseCustomId = 'select_prototype_troop_level'
) {
    const normalizedType = normalizePrototypeTroopType(troopType);
    const troopData = getPrototypeTroop(normalizedType);

    if (!troopData) {
        return [];
    }

    const levels = getAvailableLevels(troopData.levels);

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
                        .setValue(`${normalizedType}-${level}`)
                        .setDescription(
                            troopData.levels[level]?.workshopRequired ?
                                `Workshop Level ${troopData.levels[level].workshopRequired}` :
                                troopData.levels[level]?.armoryRequired ?
                                    `Armory Level ${troopData.levels[level].armoryRequired}` :
                                'No details available.'
                        )
                ))
        )
    );
}

export function buildPrototypeDefenceLevelMenuPayload(defenceType) {
    const defenceData = getPrototypeDefence(defenceType);

    return {
        components: buildPrototypeDefenceLevelComponents(defenceType),
        embeds: [
            new EmbedBuilder()
                .setTitle(`Select a Level for ${defenceData.name}`)
                .setDescription('Please choose a level to view its details.')
                .setColor('#0099ff'),
        ],
    };
}

export function buildPrototypeTroopLevelMenuPayload(troopType) {
    const troopData = getPrototypeTroop(troopType);

    return {
        components: buildPrototypeTroopLevelComponents(troopType),
        embeds: [
            new EmbedBuilder()
                .setTitle(`Select a Level for ${troopData.name}`)
                .setDescription('Please choose a level to view its details.')
                .setColor('#0099ff'),
        ],
    };
}

export function buildPrototypeDefenceEmbed(defenceType, level) {
    const normalizedType = normalizePrototypeDefenceType(defenceType);
    const defenceData = getPrototypeDefence(normalizedType);
    const levelData = defenceData.levels[level];
    const stats = levelData.stats || {};
    let attackSpeed = Number.isFinite(defenceData.attackSpeed) ? defenceData.attackSpeed : 'Unknown';

    if (normalizedType === 'simo' && level >= 2) {
        attackSpeed = 2000 - (level - 1) * 500;
    }

    const dps = attackSpeed === 'Unknown' ? 'Unknown' : getRatePerSecond(stats.damage, attackSpeed);

    const embed = new EmbedBuilder()
        .setTitle(`${defenceData.name} - Level ${level}`)
        .setDescription(defenceData.description || 'No description available.')
        .setColor('#0099ff');

    if (levelData.image) {
        embed.setThumbnail(levelData.image);
    }

    embed.addFields({
        name: 'Health',
        value: formatNumber(stats.health),
        inline: true,
    });

    if (normalizedType === 'shock_blaster') {
        embed.addFields({
            name: 'Shock Duration',
            value: `${formatNumber(stats.stunDuration)} seconds`,
            inline: true,
        });
    } else if (normalizedType === 'damage_amplifier') {
        embed.addFields({
            name: 'Buffing Radius',
            value: `${formatNumber(defenceData.range)} Tiles`,
            inline: true,
        }, {
            name: 'Damage Increase',
            value: `${formatNumber(stats.damageIncrease)}%`,
            inline: true,
        });
    } else if (normalizedType === 'shield_generator') {
        embed.addFields({
            name: 'Headquarters Shield Strength',
            value: `${formatNumber(stats.shieldStrength)}%`,
            inline: true,
        });
    } else if (normalizedType === 'sky_shield') {
        embed.addFields({
            name: 'Shield Health',
            value: `${formatNumber(stats.shieldHealth)} Tiles`,
            inline: true,
        }, {
            name: 'Shield Radius',
            value: `${formatNumber(defenceData.range)} Tiles`,
            inline: true,
        });
    } else if (normalizedType === 'flotsam_cannon') {
        embed.addFields({
            name: 'Death Damage',
            value: formatNumber(stats.deathDamage),
            inline: true,
        }, {
            name: 'Death Explosion Radius',
            value: `${formatNumber(defenceData.deathExplosionRadius)} Tiles`,
            inline: true,
        }, {
            name: 'Death Delay',
            value: `${formatNumber(defenceData.deathExplosionDelay)}s`,
            inline: true,
        });
    }

    addSharedPrototypeDefenceFields(
        embed,
        defenceData,
        levelData,
        stats,
        attackSpeed,
        dps,
        normalizedType === 'damage_amplifier' ||
        normalizedType === 'shield_generator' ||
        normalizedType === 'sky_shield' ? {
            showDetectionFields: false,
            showRange: false,
        } : {}
    );
    return embed;
}

export function buildPrototypeTroopEmbed(troopType, level) {
    const normalizedType = normalizePrototypeTroopType(troopType);
    const troopData = getPrototypeTroop(normalizedType);
    const levelData = troopData.levels[level];
    const stats = levelData.stats || {};
    const trainingCost = levelData.trainingCost || {};
    const attackSpeed = Number(troopData.attackSpeed);
    const dps = stats.dps ?? getRatePerSecond(stats.damage, attackSpeed);

    const embed = new EmbedBuilder()
        .setTitle(`${troopData.name} - Level ${level}`)
        .setDescription(troopData.description || 'No description available.')
        .setColor('#0099ff');

    if (troopData.image) {
        embed.setThumbnail(troopData.image);
    }

    embed.addFields({
        name: 'Health',
        value: formatNumber(stats.health),
        inline: true,
    });

    if (normalizedType === 'critter_cannon') {
        const crittersPerSalvo = stats.crittersPerSalvo || 0;
        embed.addFields({
            name: 'Critters Per Salvo',
            value: formatNumber(crittersPerSalvo),
            inline: true,
        }, {
            name: 'Critters Per Second',
            value: formatNumber(getRatePerSecond(crittersPerSalvo, attackSpeed)),
            inline: true,
        });
    } else if (normalizedType === 'heavy_choppa') {
        embed.addFields({
            name: 'DPS',
            value: formatNumber(dps),
            inline: true,
        }, {
            name: 'Damage Per Shot',
            value: formatNumber(stats.damage),
            inline: true,
        }, {
            name: 'Heavy Spawn Speed',
            value: `${formatNumber((troopData.spawnSpeed || 0) / 1000)}s`,
            inline: true,
        }, {
            name: 'Max Heavy Drops',
            value: formatNumber(troopData.maxSpawnCount || 0),
            inline: true,
        }, {
            name: 'Heavy Death Spawn Amount',
            value: formatNumber(troopData.deathSpawnAmount || 0),
            inline: true,
        });
    } else if (normalizedType === 'turret_engineer') {
        const spawnSpeed = level < 26 ? 7000 - (level - MIN_PROTOTYPE_TROOP_LEVEL) * 100 : 5600;
        embed.addFields({
            name: 'Turret Hitpoints',
            value: formatNumber(stats.turretHealth || 0),
            inline: true,
        }, {
            name: 'Turret Damage',
            value: formatNumber(stats.turretDamage || 0),
            inline: true,
        }, {
            name: 'Turret DPS',
            value: formatNumber(getRatePerSecond(stats.turretDamage, troopData.turretAttackSpeed)),
            inline: true,
        }, {
            name: 'Spawn Speed',
            value: `${formatNumber(spawnSpeed)}ms`,
            inline: true,
        });
    } else if (normalizedType === 'critter_engineer') {
        embed.addFields({
            name: 'Critters Per Throw',
            value: '1',
            inline: true,
        }, {
            name: 'Spawn Speed',
            value: `${formatNumber(stats.spawnSpeed)}s`,
            inline: true,
        });
    } else {
        embed.addFields({
            name: 'DPS',
            value: formatNumber(dps),
            inline: true,
        }, {
            name: 'Damage Per Shot',
            value: formatNumber(stats.damage),
            inline: true,
        });

        if (normalizedType === 'cryobombardier') {
            embed.addFields({
                name: 'Freeze Power',
                value: `${formatNumber(troopData.speedReduction || 0)}%`,
                inline: true,
            }, {
                name: 'Protection Debuff',
                value: `${formatNumber(troopData.protectionDebuff || 0)}%`,
                inline: true,
            }, {
                name: 'Freeze Duration',
                value: `${formatNumber(troopData.freezeDuration || 0)}s`,
                inline: true,
            });
        }
    }

    embed.addFields({
        name: 'Training Cost',
        value: formatPrototypeTrainingCost(trainingCost),
        inline: true,
    }, {
        name: 'Upgrade Cost',
        value: `Proto Tokens: ${formatNumber(getPrototypeTokenCost(level))}`,
        inline: true,
    }, {
        name: 'Unit Size',
        value: formatNumber(troopData.unitSize),
        inline: true,
    }, {
        name: 'Training Time',
        value: troopData.trainingTime || 'Unknown',
        inline: true,
    }, {
        name: 'Movement Speed',
        value: troopData.movementSpeed || 'Unknown',
        inline: true,
    });

    if (troopData.availabilityLabel) {
        embed.addFields({
            name: 'Availability',
            value: troopData.availabilityLabel,
            inline: true,
        });
    }

    if (troopData.attackRangeLabel || Number.isFinite(troopData.attackRange)) {
        embed.addFields({
            name: 'Attack Range',
            value: troopData.attackRangeLabel || `${formatNumber(troopData.attackRange)} Tiles`,
            inline: true,
        });
    }

    if (Number.isFinite(attackSpeed)) {
        embed.addFields({
            name: 'Attack Speed',
            value: `${formatNumber(attackSpeed)}ms`,
            inline: true,
        });
    }

    return embed;
}

export async function executePrototypeCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'defence') {
        const defenceType = interaction.options.getString('protodefence_type');
        const level = interaction.options.getInteger('level');
        const validationError = validatePrototypeDefenceRequest(defenceType, level);

        if (validationError) {
            return interaction.reply({
                content: validationError,
                ephemeral: true,
            });
        }

        return interaction.reply({
            embeds: [buildPrototypeDefenceEmbed(defenceType, level)],
        });
    }

    const troopType = interaction.options.getString('prototroop_type');
    const level = interaction.options.getInteger('level');
    const validationError = validatePrototypeTroopRequest(troopType, level);

    if (validationError) {
        return interaction.reply({
            content: validationError,
            ephemeral: true,
        });
    }

    return interaction.reply({
        embeds: [buildPrototypeTroopEmbed(troopType, level)],
    });
}
