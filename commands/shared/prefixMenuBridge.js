import {
    ActionRowBuilder,
    ComponentType,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from 'discord.js';
import { reportExecutionError } from '../../utils/errorHandling.js';
import {
    createComponentExecutionAdapter,
    createMessageInteractionAdapter,
} from '../../utils/interactionAdapter.js';

export async function runPrefixCommandWithSlashAdapter(
    message,
    optionValues,
    executeSlash,
    extra = {}
) {
    return executeSlash(
        createMessageInteractionAdapter(message, optionValues, extra)
    );
}

export async function runTwoStageSelectPrefixCommand({
    autoExecuteSingleLevel = false,
    args,
    choices,
    dataset,
    executeSlash,
    getLevelDescription,
    getLevels,
    itemTitle,
    levelMenuDescription,
    levelMenuTitle,
    levelOptionName,
    levelOptionText = 'Level',
    lookup,
    message,
    stringOptionName,
    subcommand = null,
    timeoutMs = 30000,
    typeMenuDescription,
    typeMenuTitle,
    typeSelectId,
    levelSelectId,
}) {
    const resolvedType = resolveTypeFromArgs(args, lookup);
    const parsedLevel = parseLevelArg(args);

    if (resolvedType && parsedLevel !== null) {
        return executeSlash(
            createMessageInteractionAdapter(
                message,
                {
                    integers: {
                        [levelOptionName]: parsedLevel,
                    },
                    strings: {
                        [stringOptionName]: resolvedType,
                    },
                    subcommand,
                }
            )
        );
    }

    if (resolvedType) {
        const resolvedItem = dataset[resolvedType];
        const resolvedLevels = resolvedItem ? getLevels(resolvedItem) : [];

        if (autoExecuteSingleLevel && resolvedLevels.length === 1) {
            return executeSlash(
                createMessageInteractionAdapter(
                    message,
                    {
                        integers: {
                            [levelOptionName]: resolvedLevels[0],
                        },
                        strings: {
                            [stringOptionName]: resolvedType,
                        },
                        subcommand,
                    }
                )
            );
        }

        return showLevelMenu({
            autoExecuteSingleLevel,
            choiceValue: resolvedType,
            dataset,
            executeSlash,
            getLevelDescription,
            getLevels,
            levelMenuDescription,
            levelMenuTitle,
            levelOptionName,
            levelOptionText,
            levelSelectId,
            message,
            stringOptionName,
            subcommand,
            timeoutMs,
        });
    }

    if (args.length > 0) {
        await message.reply(
            `I couldn't find a valid ${itemTitle.toLowerCase()} from that input.`
        );
        return;
    }

    const typeOptions = choices.map((choice) => {
        const itemData = dataset[choice.value];
        const description = itemData?.description ?
            itemData.description.slice(0, 100) :
            `View details for ${choice.name}.`;

        return new StringSelectMenuOptionBuilder()
            .setLabel(choice.name)
            .setValue(choice.value)
            .setDescription(description);
    });

    const reply = await message.reply({
        components: [
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(typeSelectId)
                    .setPlaceholder(`Select a ${itemTitle.toLowerCase()}`)
                    .addOptions(typeOptions)
            ),
        ],
        embeds: [
            new EmbedBuilder()
                .setTitle(typeMenuTitle)
                .setDescription(typeMenuDescription)
                .setColor('#0099ff'),
        ],
    });

    const typeCollector = reply.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        max: 1,
        time: timeoutMs,
    });

    typeCollector.on('collect', async (interaction) => {
        if (interaction.customId !== typeSelectId) {
            return;
        }

        if (interaction.user.id !== message.author.id) {
            await interaction.reply({
                content: `Only ${message.author.username} can use this selection menu.`,
                ephemeral: true,
            });
            return;
        }

        typeCollector.stop('selected');

        await showLevelMenu({
            autoExecuteSingleLevel,
            choiceValue: interaction.values[0],
            dataset,
            executeSlash,
            getLevelDescription,
            getLevels,
            interaction,
            levelMenuDescription,
            levelMenuTitle,
            levelOptionName,
            levelOptionText,
            levelSelectId,
            message,
            reply,
            stringOptionName,
            subcommand,
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
                fallbackMessage: 'I could not clean up the selection menu.',
                message,
                scope: 'prefix-type-menu-cleanup-failed',
            });
        }
    });
}

function parseLevelArg(args) {
    const lastArg = args.at(-1);
    const parsedLevel = Number.parseInt(lastArg, 10);

    return Number.isNaN(parsedLevel) ? null : parsedLevel;
}

function resolveTypeFromArgs(args, lookup) {
    if (args.length === 0) {
        return null;
    }

    const parsedLevel = parseLevelArg(args);
    const typeParts = parsedLevel === null ? args : args.slice(0, -1);
    const normalizedType = typeParts.join(' ').trim().toLowerCase();

    return lookup[normalizedType] ?? null;
}

async function showLevelMenu({
    autoExecuteSingleLevel = false,
    choiceValue,
    dataset,
    executeSlash,
    getLevelDescription,
    getLevels,
    interaction = null,
    levelMenuDescription,
    levelMenuTitle,
    levelOptionName,
    levelOptionText,
    levelSelectId,
    message,
    reply = null,
    stringOptionName,
    subcommand,
    timeoutMs,
}) {
    const itemData = dataset[choiceValue];

    if (!itemData) {
        await message.reply('I could not find data for that selection.');
        return;
    }

    const levels = getLevels(itemData);

    if (autoExecuteSingleLevel && levels.length === 1) {
        if (interaction) {
            await executeSlash(
                createComponentExecutionAdapter(
                    interaction,
                    {
                        integers: {
                            [levelOptionName]: levels[0],
                        },
                        strings: {
                            [stringOptionName]: choiceValue,
                        },
                        subcommand,
                    }
                )
            );
        } else {
            await executeSlash(
                createMessageInteractionAdapter(
                    message,
                    {
                        integers: {
                            [levelOptionName]: levels[0],
                        },
                        strings: {
                            [stringOptionName]: choiceValue,
                        },
                        subcommand,
                    }
                )
            );
        }

        return;
    }

    const levelChunks = chunkItems(levels, 25);

    const payload = {
        components: levelChunks.map((levelChunk, index, chunks) =>
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(
                        chunks.length === 1 ?
                            levelSelectId :
                            `${levelSelectId}:${index}`
                    )
                    .setPlaceholder(
                        chunks.length === 1 ?
                            `Select a ${levelOptionText.toLowerCase()}` :
                            `${levelOptionText}s ${levelChunk[0]}-${levelChunk.at(-1)}`
                    )
                    .addOptions(levelChunk.map((level) =>
                        new StringSelectMenuOptionBuilder()
                            .setLabel(`${levelOptionText} ${level}`)
                            .setValue(String(level))
                            .setDescription(getLevelDescription(itemData, level))
                    ))
            )
        ),
        embeds: [
            new EmbedBuilder()
                .setTitle(levelMenuTitle(itemData))
                .setDescription(levelMenuDescription)
                .setColor('#0099ff'),
        ],
    };

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
        if (levelInteraction.customId !== levelSelectId &&
            !levelInteraction.customId.startsWith(`${levelSelectId}:`)) {
            return;
        }

        if (levelInteraction.user.id !== message.author.id) {
            await levelInteraction.reply({
                content: `Only ${message.author.username} can use this selection menu.`,
                ephemeral: true,
            });
            return;
        }

        levelCollector.stop('selected');

        await executeSlash(
            createComponentExecutionAdapter(
                levelInteraction,
                {
                    integers: {
                        [levelOptionName]: Number.parseInt(
                            levelInteraction.values[0],
                            10
                        ),
                    },
                    strings: {
                        [stringOptionName]: choiceValue,
                    },
                    subcommand,
                }
            )
        );
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
                fallbackMessage: 'I could not clean up the level menu.',
                message,
                scope: 'prefix-level-menu-cleanup-failed',
            });
        }
    });
}

function chunkItems(items, chunkSize) {
    const chunks = [];

    for (let index = 0; index < items.length; index += chunkSize) {
        chunks.push(items.slice(index, index + chunkSize));
    }

    return chunks;
}
