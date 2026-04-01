import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} from 'discord.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { reportExecutionError } from '../../utils/errorHandling.js';
import {
    loadDirectoryModules,
    resolvePrefixCommand,
    resolveSlashCommand,
} from '../../utils/moduleRegistry.js';

const commandsPerPage = 10;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const prefixMeta = {
    description: 'Lists all available prefix commands or provides detailed help for a specific command.',
    name: 'help',
    permissions: ['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks'],
};

export const slashData = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Lists all available slash commands or provides detailed help for a specific command.');

export async function executePrefixHelp(message) {
    return executeHelp({
        authorId: message.author.id,
        avatarUrl: message.author.displayAvatarURL(),
        commandResolver: resolvePrefixCommand,
        commandType: 'prefix',
        context: message,
        reply: (payload) => message.reply(payload),
    });
}

export async function executeSlashHelp(interaction) {
    return executeHelp({
        authorId: interaction.user.id,
        avatarUrl: interaction.user.displayAvatarURL(),
        commandResolver: resolveSlashCommand,
        commandType: 'slash',
        context: interaction,
        reply: (payload) => interaction.reply({
            ...payload,
            fetchReply: true,
        }),
    });
}

async function executeHelp({
    authorId,
    avatarUrl,
    commandResolver,
    commandType,
    context,
    reply,
}) {
    try {
        const commandDirectory = join(__dirname, `../${commandType}`);
        const loadedCommands = await loadDirectoryModules(
            commandDirectory,
            commandResolver
        );

        const commands = loadedCommands
            .filter((command) => command.name !== 'help')
            .map((command) => formatCommand(command, commandType));

        const totalPages = Math.max(
            1,
            Math.ceil(commands.length / commandsPerPage)
        );
        let currentPage = 1;

        const helpMessage = await reply({
            components: [generateButtons(currentPage, totalPages)],
            embeds: [generateEmbed(commands, currentPage, avatarUrl)],
        });

        const collector = helpMessage.createMessageComponentCollector({
            filter: (interaction) => interaction.user.id === authorId,
            time: 60000,
        });

        collector.on('collect', async (interaction) => {
            try {
                if (interaction.customId === 'previous' && currentPage > 1) {
                    currentPage -= 1;
                } else if (
                    interaction.customId === 'next' &&
                    currentPage < totalPages
                ) {
                    currentPage += 1;
                }

                await interaction.update({
                    components: [generateButtons(currentPage, totalPages)],
                    embeds: [generateEmbed(commands, currentPage, avatarUrl)],
                });
            } catch (error) {
                await reportExecutionError({
                    error,
                    fallbackMessage: 'The help menu could not be updated.',
                    interaction,
                    scope: `${commandType}-help-update-failed`,
                });
            }
        });

        collector.on('end', async () => {
            if (!helpMessage.editable) {
                return;
            }

            try {
                await helpMessage.edit({
                    components: [],
                });
            } catch (error) {
                await reportExecutionError({
                    error,
                    fallbackMessage: 'The help menu could not be cleaned up.',
                    interaction: commandType === 'slash' ? context : null,
                    message: commandType === 'prefix' ? context : null,
                    scope: `${commandType}-help-cleanup-failed`,
                });
            }
        });
    } catch (error) {
        await reportExecutionError({
            error,
            fallbackMessage: 'There was an error loading the help command list.',
            interaction: commandType === 'slash' ? context : null,
            message: commandType === 'prefix' ? context : null,
            scope: `${commandType}-help-failed`,
        });
    }
}

function formatCommand(command, commandType) {
    if (commandType === 'slash') {
        let description = command.module.data.description || 'No description available.';

        if (command.module.data.usage) {
            description += `\nUsage: ${command.module.data.usage}`;
        }

        return {
            description,
            name: command.module.data.name,
        };
    }

    let name = command.name;
    let description = command.module.description || 'No description available.';

    if (command.aliases.length > 0) {
        name += ` (Aliases: ${command.aliases.join(', ')})`;
    }

    if (command.module.usage) {
        description += `\nUsage: ${command.module.usage}`;
    }

    return {
        description,
        name,
    };
}

function generateEmbed(commands, page, avatarUrl) {
    const startIndex = (page - 1) * commandsPerPage;
    const currentCommands = commands.slice(startIndex, startIndex + commandsPerPage);

    const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTimestamp();

    for (const command of currentCommands) {
        embed.addFields({
            name: command.name,
            value: command.description,
        });
    }

    embed.setFooter({
        iconURL: avatarUrl,
        text: `Page ${page} of ${Math.max(1, Math.ceil(commands.length / commandsPerPage))}`,
    });

    return embed;
}

function generateButtons(currentPage, totalPages) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('previous')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 1),
        new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages)
    );
}
