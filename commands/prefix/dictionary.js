import {
    ComponentType,
} from 'discord.js';
import { reportExecutionError } from '../../utils/errorHandling.js';
import { createComponentExecutionAdapter } from '../../utils/interactionAdapter.js';
import { execute as executeSlash } from '../slash/dictionary.js';
import {
    buildDictionaryCategoriesEmbed,
    buildDictionaryCategoryComponents,
    buildDictionaryCategoryEmbed,
    buildDictionaryTermComponents,
    getDictionaryCategory,
} from '../shared/dictionaryCommand.js';
import { runPrefixCommandWithSlashAdapter } from '../shared/prefixMenuBridge.js';

export const name = 'dictionary';
export const description = 'Get definitions for terms or view categories.';
export const permissions = ['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks'];

export async function execute(message, args) {
    const firstArg = args[0]?.toLowerCase();

    if (firstArg === 'random') {
        return runPrefixCommandWithSlashAdapter(
            message,
            {
                subcommand: 'random',
            },
            executeSlash
        );
    }

    if (firstArg === 'categories') {
        return runPrefixCommandWithSlashAdapter(
            message,
            {
                subcommand: 'categories',
            },
            executeSlash
        );
    }

    if (args.length > 0) {
        return runPrefixCommandWithSlashAdapter(
            message,
            {
                strings: {
                    term: args.join(' '),
                },
                subcommand: 'define',
            },
            executeSlash
        );
    }

    const reply = await message.reply({
        components: buildDictionaryCategoryComponents('select-category'),
        embeds: [buildDictionaryCategoriesEmbed()],
    });

    const categoryCollector = reply.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        max: 1,
        time: 30000,
    });

    categoryCollector.on('collect', async (interaction) => {
        if (interaction.customId !== 'select-category' &&
            !interaction.customId.startsWith('select-category:')) {
            return;
        }

        if (interaction.user.id !== message.author.id) {
            await interaction.reply({
                content: `Only ${message.author.username} can use this selection menu.`,
                ephemeral: true,
            });
            return;
        }

        categoryCollector.stop('selected');

        const selectedCategory = interaction.values[0];
        const categoryData = getDictionaryCategory(selectedCategory);

        if (!categoryData) {
            await interaction.reply({
                content: 'That category could not be found.',
                ephemeral: true,
            });
            return;
        }

        await interaction.update({
            components: buildDictionaryTermComponents(selectedCategory, 'select-term'),
            embeds: [buildDictionaryCategoryEmbed(selectedCategory)],
        });

        const termCollector = reply.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            max: 1,
            time: 30000,
        });

        termCollector.on('collect', async (termInteraction) => {
            if (termInteraction.customId !== 'select-term' &&
                !termInteraction.customId.startsWith('select-term:')) {
                return;
            }

            if (termInteraction.user.id !== message.author.id) {
                await termInteraction.reply({
                    content: `Only ${message.author.username} can use this selection menu.`,
                    ephemeral: true,
                });
                return;
            }

            termCollector.stop('selected');

            await executeSlash(
                createComponentExecutionAdapter(
                    termInteraction,
                    {
                        strings: {
                            term: termInteraction.values[0],
                        },
                        subcommand: 'define',
                    }
                )
            );
        });

        termCollector.on('end', async (_, reason) => {
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
                    fallbackMessage: 'I could not clean up the term menu.',
                    message,
                    scope: 'prefix-dictionary-term-cleanup-failed',
                });
            }
        });
    });

    categoryCollector.on('end', async (_, reason) => {
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
                fallbackMessage: 'I could not clean up the category menu.',
                message,
                scope: 'prefix-dictionary-category-cleanup-failed',
            });
        }
    });
}
