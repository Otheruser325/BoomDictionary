import {
    Client,
    Collection,
    Events,
    GatewayIntentBits,
    PermissionsBitField,
} from 'discord.js';
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { deployCommands } from './deploy-commands.js';
import {
    attachProcessErrorHandlers,
    logError,
    reportExecutionError,
} from './utils/errorHandling.js';
import {
    loadDirectoryModules,
    resolveInteractionHandler,
    resolvePrefixCommand,
    resolveSlashCommand,
} from './utils/moduleRegistry.js';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const prefixes = ['bd!', 'BD!'];

if (!token || !clientId) {
    console.error(
        'Missing required environment variables. Expected TOKEN and CLIENT_ID.'
    );
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageTyping,
    ],
});

client.commands = new Collection();
client.slashCommands = new Collection();
client.interactions = new Collection();
client.interactionPrefixes = [];

attachProcessErrorHandlers(client);

await registerPrefixCommands();
await registerSlashCommands();
await registerGlobalInteractionHandlers();

client.once(Events.ClientReady, async (readyClient) => {
    console.log('Bot is online!');
    console.log(`Logged in as ${readyClient.user.tag}`);

    try {
        await deployCommands(clientId, token, client.slashCommands);
    } catch (error) {
        logError('deploy-commands-failed', error, {
            clientId,
        });
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) {
        return;
    }

    const prefix = prefixes.find((candidate) =>
        message.content.startsWith(candidate)
    );

    if (!prefix) {
        return;
    }

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) {
        return;
    }

    const command = client.commands.get(commandName);

    if (!command) {
        return;
    }

    if (command.permissions?.length) {
        const memberPermissions = message.member?.permissions;
        const missingPermissions = command.permissions.filter((permission) =>
            !memberPermissions?.has(permission)
        );

        if (missingPermissions.length) {
            await message.reply(
                `You do not have the necessary permissions to use this command: ${missingPermissions.join(', ')}`
            );
            return;
        }
    }

    const botPermissions = message.guild?.members?.me ?
        message.channel.permissionsFor(message.guild.members.me) :
        null;
    const requiredBotPermissions = [
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.EmbedLinks,
    ];
    const botMissingPermissions = botPermissions ?
        botPermissions.missing(requiredBotPermissions) :
        [];

    if (botMissingPermissions.length) {
        await message.reply(
            `I do not have the necessary permissions to send messages or embeds: ${botMissingPermissions.join(', ')}`
        );
        return;
    }

    try {
        await command.execute(message, args);
    } catch (error) {
        await reportExecutionError({
            error,
            fallbackMessage: 'There was an error trying to execute that command.',
            message,
            metadata: {
                commandName,
                filePath: command.__filePath ?? null,
                type: 'prefix',
            },
            scope: 'prefix-command-failed',
        });
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            await handleSlashCommand(interaction);
            return;
        }

        if (interaction.isButton()) {
            await handleComponentInteraction(interaction, {
                fallbackMessage: 'There was an error processing that button.',
                type: 'button',
            });
            return;
        }

        if (interaction.isStringSelectMenu()) {
            await handleComponentInteraction(interaction, {
                fallbackMessage: 'There was an error processing that menu.',
                type: 'select-menu',
            });
            return;
        }

        if (interaction.isModalSubmit()) {
            await handleComponentInteraction(interaction, {
                fallbackMessage: 'There was an error submitting that form.',
                type: 'modal',
            });
        }
    } catch (error) {
        await reportExecutionError({
            error,
            fallbackMessage: 'There was an unexpected error while processing that interaction.',
            interaction,
            metadata: {
                customId: interaction.customId ?? null,
                interactionType: interaction.type,
            },
            scope: 'interaction-dispatch-failed',
        });
    }
});

client.login(token);

async function registerPrefixCommands() {
    const commandDirectory = join(__dirname, 'commands/prefix');
    const prefixCommands = await loadDirectoryModules(
        commandDirectory,
        resolvePrefixCommand
    );

    for (const prefixCommand of prefixCommands) {
        const command = {
            ...prefixCommand.module,
            __filePath: prefixCommand.filePath,
        };

        client.commands.set(prefixCommand.name, command);

        for (const alias of prefixCommand.aliases) {
            client.commands.set(alias, command);
        }
    }
}

async function registerSlashCommands() {
    const commandDirectory = join(__dirname, 'commands/slash');
    const slashCommands = await loadDirectoryModules(
        commandDirectory,
        resolveSlashCommand
    );

    for (const slashCommand of slashCommands) {
        client.slashCommands.set(slashCommand.name, {
            ...slashCommand.module,
            __filePath: slashCommand.filePath,
        });
    }
}

async function registerGlobalInteractionHandlers() {
    const interactionDirectory = join(__dirname, 'commands/interactions');
    const interactionHandlers = await loadDirectoryModules(
        interactionDirectory,
        resolveInteractionHandler
    );

    for (const interactionHandler of interactionHandlers) {
        if (!interactionHandler.global) {
            continue;
        }

        if (interactionHandler.customId) {
            client.interactions.set(
                interactionHandler.customId,
                {
                    ...interactionHandler.module,
                    __filePath: interactionHandler.filePath,
                }
            );
        }

        if (interactionHandler.customIdPrefix) {
            client.interactionPrefixes.push({
                ...interactionHandler,
                module: {
                    ...interactionHandler.module,
                    __filePath: interactionHandler.filePath,
                },
            });
        }
    }
}

function getInteractionHandler(customId) {
    if (!customId) {
        return null;
    }

    const exactHandler = client.interactions.get(customId);

    if (exactHandler) {
        return exactHandler;
    }

    const prefixHandler = client.interactionPrefixes.find((handler) =>
        customId.startsWith(handler.customIdPrefix)
    );

    return prefixHandler?.module ?? null;
}

async function handleSlashCommand(interaction) {
    const command = client.slashCommands.get(interaction.commandName);

    if (!command) {
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        await reportExecutionError({
            error,
            fallbackMessage: 'There was an error executing this command.',
            interaction,
            metadata: {
                commandName: interaction.commandName,
                filePath: command.__filePath ?? null,
                type: 'slash',
            },
            scope: 'slash-command-failed',
        });
    }
}

async function handleComponentInteraction(
    interaction,
    {
        fallbackMessage,
        type,
    }
) {
    const handler = getInteractionHandler(interaction.customId);

    if (!handler) {
        return;
    }

    try {
        await handler.execute(interaction);
    } catch (error) {
        await reportExecutionError({
            error,
            fallbackMessage,
            interaction,
            metadata: {
                customId: interaction.customId,
                filePath: handler.__filePath ?? null,
                type,
            },
            scope: 'component-handler-failed',
        });
    }
}
