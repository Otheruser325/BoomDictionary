import {
    ActionRowBuilder,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from 'discord.js';
import normalGunboatAbilities from '../../data/gunboatAbilities.json' with { type: 'json' };
import temporaryGunboatAbilities from '../../data/temporaryGunboatAbilities.json' with { type: 'json' };
import {
    buildChoiceLookup,
    gunboatChoices,
    temporaryGunboatChoices,
} from './choices.js';
import { formatNumber } from '../../utils/formatNumber.js';

const GUNBOAT_DATASETS = {
    normal: normalGunboatAbilities,
    temporary: temporaryGunboatAbilities,
};

const GUNBOAT_CHOICES = {
    normal: gunboatChoices,
    temporary: temporaryGunboatChoices,
};

const GUNBOAT_LOOKUPS = {
    normal: buildChoiceLookup(gunboatChoices, {
        'smoke screen': 'smokescreen',
    }),
    temporary: buildChoiceLookup(temporaryGunboatChoices, {
        'crystal shield': 'crystal_shield_projector',
        'crystal shield projector': 'crystal_shield_projector',
        'defib': 'remote_defib',
        'explosive drone': 'explosive_drones',
        'hack': 'remote_hack',
        'remote defib': 'remote_defib',
        'remote hack': 'remote_hack',
        'shield projector': 'crystal_shield_projector',
        'superwarrior': 'super_warrior',
        'crystal critter': 'crystal_critters',
    }),
};

function normalizeGunboatCategory(category) {
    return category === 'temporary' ? 'temporary' : 'normal';
}

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

function addEmbedField(embed, name, value, inline = true) {
    if (value == null) {
        return;
    }

    embed.addFields({
        name,
        value: String(value),
        inline,
    });
}

function formatResearchCost(gold) {
    return gold == null ? 'N/A' : `Gold: ${formatNumber(gold)}`;
}

function formatArmoryRequirement(levelData) {
    return levelData?.armoryRequired == null ? 'N/A' : formatNumber(levelData.armoryRequired);
}

function formatTiles(value) {
    return value == null ? null : `${formatNumber(value)} Tiles`;
}

function formatSeconds(value) {
    return value == null ? null : `${formatNumber(value)}s`;
}

function formatPercent(value) {
    if (value == null) {
        return null;
    }

    if (typeof value === 'string') {
        return value.endsWith('%') ? value : `${value}%`;
    }

    return `${formatNumber(value)}%`;
}

function formatEnergyCostPattern(abilityData) {
    return abilityData.energyCostsByUse?.join(', ') ?? null;
}

function getRatePerSecond(value, speed) {
    if (!Number.isFinite(value) || !Number.isFinite(speed) || speed <= 0) {
        return null;
    }

    return Number((value / (speed / 1000)).toFixed(2));
}

function getAvailableLevels(abilityData) {
    return Object.keys(abilityData?.levels || {})
        .map((value) => Number.parseInt(value, 10))
        .filter(Number.isInteger)
        .sort((left, right) => left - right);
}

function getResolvedLevel(abilityData, level) {
    if (Number.isInteger(level)) {
        return level;
    }

    const availableLevels = getAvailableLevels(abilityData);
    return availableLevels.length === 1 ? availableLevels[0] : null;
}

function buildBaseGunboatEmbed(abilityData, level, category) {
    const embed = new EmbedBuilder()
        .setTitle(`${abilityData.name} - Level ${level}`)
        .setDescription(abilityData.description || 'No description available.')
        .setColor(category === 'temporary' ? '#7c4dff' : '#0099ff');

    if (abilityData.image) {
        embed.setThumbnail(abilityData.image);
    }

    return embed;
}

function addCommonNormalFields(embed, abilityData, levelData) {
    addEmbedField(embed, 'Energy Cost', formatNumber(abilityData.energyCost));
    addEmbedField(
        embed,
        `Energy Cost Increase per ${abilityData.name}`,
        formatNumber(abilityData.energyCostIncreasePerUse)
    );
    addEmbedField(embed, 'Research Cost', formatResearchCost(levelData.researchCost?.gold));
    addEmbedField(embed, 'Research Time', levelData.upgradeTime || 'N/A');
    addEmbedField(embed, 'Armory Level Required', formatArmoryRequirement(levelData));
}

function addCommonTemporaryFields(embed, abilityData, levelData) {
    addEmbedField(embed, 'Energy Cost', formatNumber(abilityData.energyCost));
    addEmbedField(
        embed,
        'Energy Costs (Uses 1-10)',
        formatEnergyCostPattern(abilityData)
    );
    addEmbedField(
        embed,
        'Energy Cost Increase per Use',
        formatNumber(abilityData.energyCostIncreasePerUse)
    );
    addEmbedField(embed, 'Armory Level Required', formatArmoryRequirement(levelData));
    addEmbedField(
        embed,
        'Auto-Scales With Armory',
        abilityData.autoScalesWithArmory == null ? null : String(abilityData.autoScalesWithArmory)
    );
    addEmbedField(embed, 'Availability', abilityData.availabilityLabel);
    addEmbedField(embed, 'Source Note', abilityData.sourceNote, false);
}

function buildNormalGunboatEmbed(abilityType, abilityData, levelData, level) {
    const stats = levelData.stats || {};
    const embed = buildBaseGunboatEmbed(abilityData, level, 'normal');
    const critterRange = abilityData.critterRange ?? abilityData.critterAttackRange;
    const critterDps = abilityData.critterAttackSpeed ?
        getRatePerSecond(abilityData.critterDamage, abilityData.critterAttackSpeed) :
        null;

    if (abilityType === 'artillery') {
        addEmbedField(embed, 'Damage', formatNumber(stats.damage));
        addEmbedField(embed, 'Explosion Radius', formatTiles(abilityData.explosionRadius));
        addEmbedField(
            embed,
            'Explosion Radius Against Troops',
            formatTiles(abilityData.explosionRadiusAgainstTroops)
        );
    } else if (abilityType === 'flare') {
        addEmbedField(embed, 'Duration', formatSeconds(stats.duration));
    } else if (abilityType === 'medkit') {
        addEmbedField(embed, 'Healing per Pulse', formatNumber(stats.healingPerPulse));
        addEmbedField(embed, 'Total Heal', formatNumber(stats.totalHeal));
        addEmbedField(embed, 'Healing Radius', formatTiles(abilityData.healingRadius));
        addEmbedField(embed, 'Duration', formatSeconds(abilityData.duration));
    } else if (abilityType === 'shock_bomb') {
        addEmbedField(embed, 'Duration', formatSeconds(stats.duration));
    } else if (abilityType === 'barrage') {
        addEmbedField(embed, 'Number of Projectiles', formatNumber(abilityData.numProjectiles));
        addEmbedField(embed, 'Missile Damage', formatNumber(stats.missileDamage));
        addEmbedField(embed, 'Total Damage', formatNumber(stats.totalDamage));
        addEmbedField(embed, 'Impact Radius', formatTiles(abilityData.impactRadius));
        addEmbedField(
            embed,
            'Missile Explosion Radius',
            formatTiles(abilityData.missileExplosionRadius)
        );
        addEmbedField(
            embed,
            'Missile Explosion Radius Against Troops',
            formatTiles(abilityData.missileExplosionRadiusAgainstTroops)
        );
    } else if (abilityType === 'smokescreen') {
        addEmbedField(embed, 'Duration', formatSeconds(stats.duration));
    } else if (abilityType === 'critters') {
        addEmbedField(embed, 'Amount of Critters', formatNumber(stats.amountOfCritters));
        addEmbedField(embed, 'Critter Health', formatNumber(abilityData.critterHealth));
        addEmbedField(embed, 'Critter Damage', formatNumber(abilityData.critterDamage));
        addEmbedField(embed, 'Critter Range', formatTiles(critterRange));
        addEmbedField(
            embed,
            'Critter Attack Speed',
            abilityData.critterAttackSpeed == null ?
                null :
                `${formatNumber(abilityData.critterAttackSpeed)}ms`
        );
        addEmbedField(embed, 'Critter DPS', critterDps == null ? null : formatNumber(critterDps));
    } else {
        throw new Error(`Stat data for the gunboat ability ${abilityData.name} is unavailable.`);
    }

    addCommonNormalFields(embed, abilityData, levelData);
    return embed;
}

function buildTemporaryGunboatEmbed(abilityType, abilityData, levelData, level) {
    const stats = levelData.stats || {};
    const embed = buildBaseGunboatEmbed(abilityData, level, 'temporary');

    if (abilityType === 'cryobomb') {
        addEmbedField(embed, 'Damage', formatNumber(stats.damage));
        addEmbedField(embed, 'Explosion Radius', formatTiles(stats.explosionRadius));
        addEmbedField(embed, 'Freeze Slowdown', formatPercent(stats.freezeSlowdown));
        addEmbedField(embed, 'Duration', formatSeconds(stats.duration));
    } else if (abilityType === 'super_warrior') {
        addEmbedField(embed, 'Health', formatNumber(stats.health));
        addEmbedField(embed, 'DPS', formatNumber(stats.dps));
        addEmbedField(embed, 'Damage per Hit', formatNumber(stats.damage));
        addEmbedField(embed, 'Healing per Hit', formatNumber(stats.healingPerHit));
        addEmbedField(embed, 'Movement Speed', formatNumber(abilityData.movementSpeed));
        addEmbedField(embed, 'Attack Range', formatTiles(abilityData.attackRange));
        addEmbedField(embed, 'Attack Speed', abilityData.attackSpeedLabel);
        addEmbedField(embed, 'Splash Radius', formatTiles(abilityData.splashRadius));
        addEmbedField(embed, 'Freeze Slowdown', formatPercent(abilityData.freezeSlowdown));
        addEmbedField(embed, 'Freeze Duration', formatSeconds(abilityData.freezeDuration));
    } else if (abilityType === 'speed_serum') {
        addEmbedField(embed, 'Effect Radius', formatTiles(stats.effectRadius));
        addEmbedField(embed, 'Movement and Attack Speed Bonus', formatPercent(stats.speedBonus));
        addEmbedField(embed, 'Damage Decrease', formatPercent(stats.damageDecrease));
        addEmbedField(embed, 'Duration', formatSeconds(stats.duration));
    } else if (abilityType === 'deployable_turret') {
        addEmbedField(embed, 'Health', formatNumber(stats.health));
        addEmbedField(embed, 'DPS', formatNumber(stats.dps));
        addEmbedField(embed, 'Damage per Shot', formatNumber(stats.damage));
        addEmbedField(embed, 'Attack Speed', abilityData.attackSpeedLabel);
        addEmbedField(embed, 'Attack Range', formatTiles(abilityData.attackRange));
    } else if (abilityType === 'remote_defib') {
        addEmbedField(embed, 'Housing Space Revived', formatNumber(stats.housingSpaceRevived));
        addEmbedField(embed, 'Revive Delay', formatSeconds(stats.reviveDelay));
        addEmbedField(embed, 'Duration', formatSeconds(abilityData.duration));
    } else if (abilityType === 'explosive_drones') {
        addEmbedField(embed, 'Drone Count', formatNumber(abilityData.droneCount));
        addEmbedField(embed, 'Drone Health', formatNumber(stats.health));
        addEmbedField(embed, 'Drone Damage', formatNumber(stats.damage));
        addEmbedField(embed, 'Drone Movement Speed', formatNumber(abilityData.droneMovementSpeed));
        addEmbedField(embed, 'Arming Time', formatSeconds(abilityData.armingTime));
        addEmbedField(embed, 'Explosion Radius', formatTiles(abilityData.explosionRadius));
        addEmbedField(embed, 'Spawn Radius', formatTiles(abilityData.spawnRadius));
    } else if (abilityType === 'remote_hack') {
        addEmbedField(embed, 'Hack Duration', formatSeconds(stats.duration));
    } else if (abilityType === 'tiny_shock') {
        addEmbedField(embed, 'Duration', formatSeconds(stats.duration));
        addEmbedField(embed, 'Targets', stats.targets);
    } else if (abilityType === 'crystal_shield_projector') {
        addEmbedField(embed, 'Shield Health', formatNumber(stats.shieldHealth));
        addEmbedField(embed, 'Effect Radius', formatTiles(abilityData.effectRadius));
        addEmbedField(embed, 'Duration', formatSeconds(abilityData.duration));
    } else if (abilityType === 'crystal_critters') {
        addEmbedField(embed, 'Crystal Critters Deployed', formatNumber(stats.crittersDeployed));
        addEmbedField(embed, 'Crystal Critter Health', formatNumber(abilityData.health));
        addEmbedField(embed, 'Healing per Second', formatNumber(abilityData.healingPerSecond));
        addEmbedField(embed, 'Heal Range', abilityData.healRangeLabel);
        addEmbedField(embed, 'Heal Speed', abilityData.healSpeedLabel);
        addEmbedField(embed, 'Lifetime', formatSeconds(abilityData.lifetime));
        addEmbedField(embed, 'Movement Speed', formatNumber(abilityData.movementSpeed));
        addEmbedField(embed, 'Spawn Radius', formatTiles(abilityData.spawnRadius));
    } else {
        throw new Error(`Stat data for the temporary gunboat ability ${abilityData.name} is unavailable.`);
    }

    addCommonTemporaryFields(embed, abilityData, levelData);
    return embed;
}

export function normalizeGunboatAbilityType(category, abilityType) {
    const normalizedCategory = normalizeGunboatCategory(category);
    const lookup = GUNBOAT_LOOKUPS[normalizedCategory];
    const normalizedInput = String(abilityType ?? '').trim().toLowerCase();

    return lookup[normalizedInput] ?? abilityType ?? null;
}

export function getGunboatAbility(category, abilityType) {
    const normalizedCategory = normalizeGunboatCategory(category);
    const dataset = GUNBOAT_DATASETS[normalizedCategory];
    const normalizedType = normalizeGunboatAbilityType(normalizedCategory, abilityType);

    return dataset[normalizedType] ?? null;
}

export function getGunboatChoices(category) {
    return GUNBOAT_CHOICES[normalizeGunboatCategory(category)];
}

export function getCombinedGunboatChoices() {
    return [
        ...GUNBOAT_CHOICES.normal.map((choice) => ({
            ...choice,
            category: 'normal',
        })),
        ...GUNBOAT_CHOICES.temporary.map((choice) => ({
            ...choice,
            category: 'temporary',
        })),
    ];
}

export function resolveGunboatAbilityReference(abilityType, preferredCategory = null) {
    const normalizedPreferredCategory = preferredCategory == null ?
        null :
        normalizeGunboatCategory(preferredCategory);
    const categories = normalizedPreferredCategory == null ?
        ['normal', 'temporary'] :
        [normalizedPreferredCategory];

    for (const category of categories) {
        const normalizedType = normalizeGunboatAbilityType(category, abilityType);
        const abilityData = GUNBOAT_DATASETS[category][normalizedType];

        if (abilityData) {
            return {
                abilityData,
                abilityType: normalizedType,
                category,
            };
        }
    }

    return null;
}

export function getGunboatDefaultLevel(category, abilityType) {
    const abilityData = getGunboatAbility(category, abilityType);
    return getResolvedLevel(abilityData, null);
}

export function validateGunboatRequest(category, abilityType, level = null) {
    const abilityData = getGunboatAbility(category, abilityType);

    if (!abilityData) {
        return 'Invalid gunboat ability!';
    }

    const availableLevels = getAvailableLevels(abilityData);

    if (availableLevels.length === 0) {
        return 'No data is available for that gunboat ability yet.';
    }

    if (level == null) {
        if (availableLevels.length === 1) {
            return null;
        }

        return `Please provide a level between ${availableLevels[0]} and ${availableLevels.at(-1)}.`;
    }

    if (!Number.isInteger(level) ||
        level < availableLevels[0] ||
        level > availableLevels.at(-1)) {
        return `Invalid level! Please provide a level between ${availableLevels[0]} and ${availableLevels.at(-1)}.`;
    }

    if (!abilityData.levels[level]) {
        return `No data available for level ${level}.`;
    }

    return null;
}

export function encodeGunboatLevelValue(category, abilityType, level) {
    return `${normalizeGunboatCategory(category)}|${abilityType}|${level}`;
}

export function parseGunboatLevelValue(value) {
    const serializedValue = String(value);

    if (!serializedValue.includes('|')) {
        const [abilityType, level] = serializedValue.split('-');
        const parsedLegacyLevel = Number.parseInt(level, 10);

        return {
            abilityType,
            category: 'normal',
            level: Number.isInteger(parsedLegacyLevel) ? parsedLegacyLevel : null,
        };
    }

    const [category, abilityType, level] = serializedValue.split('|');
    const normalizedCategory = normalizeGunboatCategory(category);
    const parsedLevel = Number.parseInt(level, 10);

    return {
        abilityType,
        category: normalizedCategory,
        level: Number.isInteger(parsedLevel) ? parsedLevel : null,
    };
}

export function buildGunboatLevelComponents(
    category,
    abilityType,
    baseCustomId = 'select_gunboat_ability_level'
) {
    const normalizedCategory = normalizeGunboatCategory(category);
    const normalizedType = normalizeGunboatAbilityType(normalizedCategory, abilityType);
    const abilityData = getGunboatAbility(normalizedCategory, normalizedType);

    if (!abilityData) {
        return [];
    }

    const levels = getAvailableLevels(abilityData);

    if (levels.length <= 1) {
        return [];
    }

    return chunkValues(levels).map((levelChunk, index, chunks) =>
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(createLevelSelectCustomId(baseCustomId, index, chunks.length))
                .setPlaceholder(
                    chunks.length === 1 ?
                        'Select a level' :
                        `Select levels ${levelChunk[0]}-${levelChunk.at(-1)}`
                )
                .addOptions(levelChunk.map((levelValue) =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`Level ${levelValue}`)
                        .setValue(
                            encodeGunboatLevelValue(
                                normalizedCategory,
                                normalizedType,
                                levelValue
                            )
                        )
                        .setDescription(
                            abilityData.levels[levelValue]?.armoryRequired != null ?
                                `Armory Level ${abilityData.levels[levelValue].armoryRequired}` :
                                'Available by default.'
                        )
                ))
        )
    );
}

export function buildGunboatLevelMenuPayload(
    category,
    abilityType,
    baseCustomId = 'select_gunboat_ability_level'
) {
    const normalizedCategory = normalizeGunboatCategory(category);
    const normalizedType = normalizeGunboatAbilityType(normalizedCategory, abilityType);
    const abilityData = getGunboatAbility(normalizedCategory, normalizedType);

    return {
        components: buildGunboatLevelComponents(normalizedCategory, normalizedType, baseCustomId),
        embeds: [
            new EmbedBuilder()
                .setTitle(`Select a Level for ${abilityData.name}`)
                .setDescription('Please choose a level to view its details.')
                .setColor(normalizedCategory === 'temporary' ? '#7c4dff' : '#0099ff'),
        ],
    };
}

export function buildGunboatSelectionPayload(
    category,
    abilityType,
    baseCustomId = 'select_gunboat_ability_level'
) {
    const normalizedCategory = normalizeGunboatCategory(category);
    const normalizedType = normalizeGunboatAbilityType(normalizedCategory, abilityType);
    const abilityData = getGunboatAbility(normalizedCategory, normalizedType);
    const defaultLevel = getResolvedLevel(abilityData, null);

    if (defaultLevel != null) {
        return {
            components: [],
            embeds: [buildGunboatEmbed(normalizedCategory, normalizedType, defaultLevel)],
        };
    }

    return buildGunboatLevelMenuPayload(normalizedCategory, normalizedType, baseCustomId);
}

export function buildGunboatEmbed(category, abilityType, level = null) {
    const normalizedCategory = normalizeGunboatCategory(category);
    const normalizedType = normalizeGunboatAbilityType(normalizedCategory, abilityType);
    const abilityData = getGunboatAbility(normalizedCategory, normalizedType);
    const resolvedLevel = getResolvedLevel(abilityData, level);
    const levelData = abilityData.levels[resolvedLevel];

    if (normalizedCategory === 'temporary') {
        return buildTemporaryGunboatEmbed(
            normalizedType,
            abilityData,
            levelData,
            resolvedLevel
        );
    }

    return buildNormalGunboatEmbed(
        normalizedType,
        abilityData,
        levelData,
        resolvedLevel
    );
}

export async function executeGunboatCommand(interaction) {
    const subcommand = normalizeGunboatCategory(
        interaction.options.getSubcommand?.() ?? 'normal'
    );
    const abilityType = interaction.options.getString('ability_type');
    const level = interaction.options.getInteger('level');
    const validationError = validateGunboatRequest(subcommand, abilityType, level);

    if (validationError) {
        return interaction.reply({
            content: validationError,
            ephemeral: true,
        });
    }

    return interaction.reply({
        embeds: [buildGunboatEmbed(subcommand, abilityType, level)],
        components: [],
    });
}
