import {
    ActionRowBuilder,
    ComponentType,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from 'discord.js';
import { reportExecutionError } from '../../utils/errorHandling.js';
import { createComponentExecutionAdapter } from '../../utils/interactionAdapter.js';
import { execute as executeSlash } from '../slash/gunboat.js';
import { runPrefixCommandWithSlashAdapter } from '../shared/prefixMenuBridge.js';
import {
    buildGunboatLevelMenuPayload,
    getCombinedGunboatChoices,
    resolveGunboatAbilityReference,
} from '../shared/gunboatCommand.js';

const CATEGORY_ALIASES = {
    normal: 'normal',
    temp: 'temporary',
    temporary: 'temporary',
};

const TYPE_SELECT_ID = 'select-prefix-gunboat-type';
const LEVEL_SELECT_ID = 'select-prefix-gunboat-level';

export const name = 'gunboat';
export const description = 'Get statistics for a standard or temporary gunboat ability.';
export const permissions = ['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks'];
export const aliases = ['gb'];
export const args = false;
export const usage = '<ability_type> [level]';

function parseLevelArg(args) {
    const lastArg = args.at(-1);
    const parsedLevel = Number.parseInt(lastArg, 10);

    return Number.isNaN(parsedLevel) ? null : parsedLevel;
}

function parseGunboatArgs(args) {
    const explicitCategory = CATEGORY_ALIASES[args[0]?.toLowerCase()] ?? null;
    const remainingArgs = explicitCategory ? args.slice(1) : args;
    const parsedLevel = parseLevelArg(remainingArgs);
    const typeParts = parsedLevel == null ? remainingArgs : remainingArgs.slice(0, -1);
    const normalizedTypeInput = typeParts.join(' ').trim();
    const resolvedReference = normalizedTypeInput ?
        resolveGunboatAbilityReference(normalizedTypeInput, explicitCategory) :
        null;

    return {
        explicitCategory,
        parsedLevel,
        remainingArgs,
        resolvedReference,
    };
}

function buildTypeOptionLabel(choice) {
    return choice.category === 'temporary' ? `${choice.name} (Temporary)` : choice.name;
}

function encodeTypeSelectionValue(choice) {
    return `${choice.category}|${choice.value}`;
}

function parseTypeSelectionValue(value) {
    const [category, abilityType] = String(value).split('|');

    return {
        abilityType,
        category,
    };
}

function getAvailableLevels(reference) {
    return Object.keys(reference?.abilityData?.levels || {})
        .map((value) => Number.parseInt(value, 10))
        .filter(Number.isInteger)
        .sort((left, right) => left - right);
}

function getTypeChoices(explicitCategory) {
    const allChoices = getCombinedGunboatChoices();

    if (!explicitCategory) {
        return allChoices;
    }

    return allChoices.filter((choice) => choice.category === explicitCategory);
}

async function executeResolvedGunboat(messageOrInteraction, reference, level) {
    const optionValues = {
        integers: {
            level,
        },
        strings: {
            ability_type: reference.abilityType,
        },
        subcommand: reference.category,
    };

    if ('customId' in messageOrInteraction) {
        return executeSlash(
            createComponentExecutionAdapter(messageOrInteraction, optionValues)
        );
    }

    return runPrefixCommandWithSlashAdapter(
        messageOrInteraction,
        optionValues,
        executeSlash
    );
}

async function showGunboatLevelMenu({
    message,
    reference,
    interaction = null,
    reply = null,
    timeoutMs = 30000,
}) {
    const levels = getAvailableLevels(reference);

    if (levels.length === 1) {
        return executeResolvedGunboat(
            interaction ?? message,
            reference,
            levels[0]
        );
    }

    const payload = buildGunboatLevelMenuPayload(
        reference.category,
        reference.abilityType,
        LEVEL_SELECT_ID
    );

    let targetMessage = reply;

    if (interaction) {
        await interaction.update(payload);
    } else {
        targetMessage = await message.reply(payload);
    }

    const levelCollector = (targetMessage ?? interaction.message)
        .createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            max: 1,
            time: timeoutMs,
        });

    levelCollector.on('collect', async (levelInteraction) => {
        if (levelInteraction.customId !== LEVEL_SELECT_ID &&
            !levelInteraction.customId.startsWith(`${LEVEL_SELECT_ID}:`)) {
            return;
        }

        if (levelInteraction.user.id !== message.author.id) {
            await levelInteraction.reply({
                content: `Only ${message.author.username} can use this selection menu.`,
                ephemeral: true,
            });
            return;
        }

        const selectedLevel = Number.parseInt(
            String(levelInteraction.values[0]).split('|').at(-1),
            10
        );

        levelCollector.stop('selected');
        await executeResolvedGunboat(levelInteraction, reference, selectedLevel);
    });

    levelCollector.on('end', async (_, reason) => {
        const collectorMessage = targetMessage ?? interaction?.message;

        if (reason === 'selected' || !collectorMessage?.editable) {
            return;
        }

        try {
            await collectorMessage.edit({
                components: [],
            });
        } catch (error) {
            await reportExecutionError({
                error,
                fallbackMessage: 'I could not clean up the gunboat level menu.',
                message,
                scope: 'prefix-gunboat-level-menu-cleanup-failed',
            });
        }
    });
}

async function showGunboatTypeMenu({
    explicitCategory = null,
    message,
    timeoutMs = 30000,
}) {
    const typeChoices = getTypeChoices(explicitCategory);
    const typeOptions = typeChoices.map((choice) => {
        const resolvedReference = resolveGunboatAbilityReference(choice.value, choice.category);
        const descriptionPrefix = choice.category === 'temporary' ? 'Temporary' : 'Normal';
        const description = resolvedReference?.abilityData?.description ?
            `${descriptionPrefix}: ${resolvedReference.abilityData.description}`.slice(0, 100) :
            `View details for ${choice.name}.`;

        return new StringSelectMenuOptionBuilder()
            .setLabel(buildTypeOptionLabel(choice))
            .setValue(encodeTypeSelectionValue(choice))
            .setDescription(description);
    });

    const reply = await message.reply({
        components: [
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(TYPE_SELECT_ID)
                    .setPlaceholder('Select a gunboat ability')
                    .addOptions(typeOptions)
            ),
        ],
        embeds: [
            new EmbedBuilder()
                .setTitle(explicitCategory === 'temporary' ?
                    'Select a Temporary Gunboat Ability' :
                    explicitCategory === 'normal' ?
                        'Select a Gunboat Ability' :
                        'Select a Gunboat Ability')
                .setDescription(explicitCategory ?
                    'Please choose a gunboat ability to view its details.' :
                    'Please choose a standard or temporary gunboat ability to view its details.')
                .setColor(explicitCategory === 'temporary' ? '#7c4dff' : '#0099ff'),
        ],
    });

    const typeCollector = reply.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        max: 1,
        time: timeoutMs,
    });

    typeCollector.on('collect', async (interaction) => {
        if (interaction.customId !== TYPE_SELECT_ID) {
            return;
        }

        if (interaction.user.id !== message.author.id) {
            await interaction.reply({
                content: `Only ${message.author.username} can use this selection menu.`,
                ephemeral: true,
            });
            return;
        }

        const selected = parseTypeSelectionValue(interaction.values[0]);
        const reference = resolveGunboatAbilityReference(
            selected.abilityType,
            selected.category
        );

        if (!reference) {
            await interaction.reply({
                content: 'I could not find data for that gunboat ability.',
                ephemeral: true,
            });
            return;
        }

        typeCollector.stop('selected');
        await showGunboatLevelMenu({
            interaction,
            message,
            reference,
            reply,
            timeoutMs,
        });
    });

    typeCollector.on('end', async (_, reason) => {
        if (reason === 'selected' || !reply.editable) {
            return;
        }

        try {
            await reply.edit({
                components: [],
            });
        } catch (error) {
            await reportExecutionError({
                error,
                fallbackMessage: 'I could not clean up the gunboat selection menu.',
                message,
                scope: 'prefix-gunboat-type-menu-cleanup-failed',
            });
        }
    });
}

export async function execute(message, args) {
    const parsed = parseGunboatArgs(args);

    if (parsed.resolvedReference && parsed.parsedLevel != null) {
        return executeResolvedGunboat(
            message,
            parsed.resolvedReference,
            parsed.parsedLevel
        );
    }

    if (parsed.resolvedReference) {
        return showGunboatLevelMenu({
            message,
            reference: parsed.resolvedReference,
        });
    }

    if (parsed.remainingArgs.length > 0) {
        await message.reply('I could not find a valid gunboat ability from that input.');
        return;
    }

    return showGunboatTypeMenu({
        explicitCategory: parsed.explicitCategory,
        message,
    });
}
