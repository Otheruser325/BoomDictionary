import {
    ActionRowBuilder,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from 'discord.js';
import gunboatAbilities from '../../data/gunboatAbilities.json' with { type: 'json' };
import { formatNumber } from '../../utils/formatNumber.js';

function chunkValues(values, chunkSize = 25) {
    const chunks = [];

    for (let index = 0; index < values.length; index += chunkSize) {
        chunks.push(values.slice(index, index + chunkSize));
    }

    return chunks;
}

function formatResearchCost(gold) {
    return gold == null ? 'N/A' : `Gold: ${formatNumber(gold)}`;
}

function createLevelSelectCustomId(baseId, index, total) {
    return total === 1 ? baseId : `${baseId}:${index}`;
}

export function getGunboatAbility(abilityType) {
    return gunboatAbilities[abilityType] ?? null;
}

export function validateGunboatRequest(abilityType, level) {
    const abilityData = getGunboatAbility(abilityType);

    if (!abilityData) {
        return 'Invalid gunboat ability!';
    }

    if (!Number.isInteger(level) || level < 1 || level > (abilityData.maxLevel || 1)) {
        return `Invalid level! Please provide a level between 1 and ${abilityData.maxLevel}.`;
    }

    if (!abilityData.levels[level]) {
        return `No data available for level ${level}.`;
    }

    return null;
}

export function buildGunboatLevelComponents(
    abilityType,
    baseCustomId = 'select_gunboat_ability_level'
) {
    const abilityData = getGunboatAbility(abilityType);

    if (!abilityData) {
        return [];
    }

    const levels = Array.from(
        {
            length: abilityData.maxLevel,
        },
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
                        .setValue(`${abilityType}-${level}`)
                        .setDescription(
                            abilityData.levels[level]?.armoryRequired ?
                                `Armory Level ${abilityData.levels[level].armoryRequired}` :
                                'Available by default.'
                        )
                ))
        )
    );
}

export function buildGunboatEmbed(abilityType, level) {
    const abilityData = getGunboatAbility(abilityType);
    const levelData = abilityData.levels[level];
    const stats = levelData.stats;
    const researchCost = levelData.researchCost || {
        gold: null,
    };
    const armoryRequired = levelData.armoryRequired ?? 'N/A';
    const critterRange = abilityData.critterRange ?? abilityData.critterAttackRange;
    const critterDps = abilityData.critterAttackSpeed ?
        Number(
            (
                abilityData.critterDamage /
                (abilityData.critterAttackSpeed / 1000)
            ).toFixed(2)
        ) :
        null;

    const embed = new EmbedBuilder()
        .setTitle(`${abilityData.name} - Level ${level}`)
        .setDescription(abilityData.description || 'No description available.')
        .setColor('#0099ff');

    if (abilityData.image) {
        embed.setThumbnail(abilityData.image);
    }

    if (abilityType === 'artillery') {
        embed.addFields({
            name: 'Damage',
            value: formatNumber(stats.damage),
            inline: true,
        }, {
            name: 'Energy Cost',
            value: formatNumber(abilityData.energyCost),
            inline: true,
        }, {
            name: `Energy Cost Increase per ${abilityData.name}`,
            value: formatNumber(abilityData.energyCostIncreasePerUse),
            inline: true,
        }, {
            name: 'Explosion Radius',
            value: `${formatNumber(abilityData.explosionRadius)} Tiles`,
            inline: true,
        }, {
            name: 'Research Cost',
            value: formatResearchCost(researchCost.gold),
            inline: true,
        }, {
            name: 'Research Time',
            value: levelData.upgradeTime || 'N/A',
            inline: true,
        }, {
            name: 'Armory Level Required',
            value: armoryRequired.toString(),
            inline: true,
        });

        return embed;
    }

    if (abilityType === 'flare' || abilityType === 'shock_bomb' || abilityType === 'smokescreen') {
        embed.addFields({
            name: 'Duration',
            value: `${formatNumber(stats.duration)}s`,
            inline: true,
        }, {
            name: 'Energy Cost',
            value: formatNumber(abilityData.energyCost),
            inline: true,
        }, {
            name: `Energy Cost Increase per ${abilityData.name}`,
            value: formatNumber(abilityData.energyCostIncreasePerUse),
            inline: true,
        }, {
            name: 'Research Cost',
            value: formatResearchCost(researchCost.gold),
            inline: true,
        }, {
            name: 'Research Time',
            value: levelData.upgradeTime || 'N/A',
            inline: true,
        }, {
            name: 'Armory Level Required',
            value: armoryRequired.toString(),
            inline: true,
        });

        return embed;
    }

    if (abilityType === 'medkit') {
        embed.addFields({
            name: 'Healing per Pulse',
            value: formatNumber(stats.healingPerPulse),
            inline: true,
        }, {
            name: 'Total Heal',
            value: formatNumber(stats.totalHeal),
            inline: true,
        }, {
            name: 'Energy Cost',
            value: formatNumber(abilityData.energyCost),
            inline: true,
        }, {
            name: `Energy Cost Increase per ${abilityData.name}`,
            value: formatNumber(abilityData.energyCostIncreasePerUse),
            inline: true,
        }, {
            name: 'Healing Radius',
            value: `${formatNumber(abilityData.healingRadius)} Tiles`,
            inline: true,
        }, {
            name: 'Duration',
            value: `${formatNumber(abilityData.duration)}s`,
            inline: true,
        }, {
            name: 'Research Cost',
            value: formatResearchCost(researchCost.gold),
            inline: true,
        }, {
            name: 'Research Time',
            value: levelData.upgradeTime || 'N/A',
            inline: true,
        }, {
            name: 'Armory Level Required',
            value: armoryRequired.toString(),
            inline: true,
        });

        return embed;
    }

    if (abilityType === 'barrage') {
        embed.addFields({
            name: 'Number of Projectiles',
            value: formatNumber(abilityData.numProjectiles),
            inline: true,
        }, {
            name: 'Missile Damage',
            value: formatNumber(stats.missileDamage),
            inline: true,
        }, {
            name: 'Total Damage',
            value: formatNumber(stats.totalDamage),
            inline: true,
        }, {
            name: 'Energy Cost',
            value: formatNumber(abilityData.energyCost),
            inline: true,
        }, {
            name: `Energy Cost Increase per ${abilityData.name}`,
            value: formatNumber(abilityData.energyCostIncreasePerUse),
            inline: true,
        }, {
            name: 'Impact Radius',
            value: `${formatNumber(abilityData.impactRadius)} Tiles`,
            inline: true,
        }, {
            name: 'Missile Explosion Radius',
            value: `${formatNumber(abilityData.missileExplosionRadius)} Tiles`,
            inline: true,
        }, {
            name: 'Research Cost',
            value: formatResearchCost(researchCost.gold),
            inline: true,
        }, {
            name: 'Research Time',
            value: levelData.upgradeTime || 'N/A',
            inline: true,
        }, {
            name: 'Armory Level Required',
            value: armoryRequired.toString(),
            inline: true,
        });

        return embed;
    }

    if (abilityType === 'critters') {
        embed.addFields({
            name: 'Amount of Critters',
            value: formatNumber(stats.amountOfCritters),
            inline: true,
        }, {
            name: 'Critter Health',
            value: formatNumber(abilityData.critterHealth),
            inline: true,
        }, {
            name: 'Critter Damage',
            value: formatNumber(abilityData.critterDamage),
            inline: true,
        }, {
            name: 'Critter Range',
            value: `${formatNumber(critterRange)} Tiles`,
            inline: true,
        }, {
            name: 'Critter DPS',
            value: critterDps == null ? 'Unknown' : formatNumber(critterDps),
            inline: true,
        }, {
            name: 'Energy Cost',
            value: formatNumber(abilityData.energyCost),
            inline: true,
        }, {
            name: `Energy Cost Increase per ${abilityData.name}`,
            value: formatNumber(abilityData.energyCostIncreasePerUse),
            inline: true,
        }, {
            name: 'Research Cost',
            value: formatResearchCost(researchCost.gold),
            inline: true,
        }, {
            name: 'Research Time',
            value: levelData.upgradeTime || 'N/A',
            inline: true,
        }, {
            name: 'Armory Level Required',
            value: armoryRequired.toString(),
            inline: true,
        });

        return embed;
    }

    throw new Error(`Stat data for the gunboat ability ${abilityData.name} is currently unavailable.`);
}
