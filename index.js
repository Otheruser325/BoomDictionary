const { Client, GatewayIntentBits, PermissionsBitField, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { deployCommands } = require('./deploy-commands');

// Load environment variables from .env file
dotenv.config();

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; // Optional: for guild-specific commands
const prefixes = ['bd!', 'BD!'];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageTyping // Ensure this intent is included if you use message typing events
    ]
});

client.commands = new Collection();
client.slashCommands = new Collection();
client.interactions = new Collection();

// Load prefix commands
const prefixCommandFiles = fs.readdirSync(path.join(__dirname, 'commands/prefix')).filter(file => file.endsWith('.js'));
for (const file of prefixCommandFiles) {
    const command = require(path.join(__dirname, 'commands/prefix', file));
    client.commands.set(command.name, command);
    if (command.aliases) {
        command.aliases.forEach(alias => client.commands.set(alias, command));
    }
}

// Load slash commands
const slashCommandFiles = fs.readdirSync(path.join(__dirname, 'commands/slash')).filter(file => file.endsWith('.js'));
for (const file of slashCommandFiles) {
    const command = require(path.join(__dirname, 'commands/slash', file));
    client.slashCommands.set(command.data.name, command);
}

client.once('ready', async () => {
    console.log('Bot is online!');
    console.log(`Logged in as ${client.user.tag}`);

    // Deploy slash commands
    await deployCommands(clientId, token, client.slashCommands);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    let prefix = prefixes.find(p => message.content.startsWith(p));
    if (!prefix) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);
    if (!command) return;

    // Check if the user has the necessary permissions
    if (command.permissions) {
        const missingPermissions = command.permissions.filter(permission => !message.member.permissions.has(permission));
        if (missingPermissions.length) {
            return message.reply(`You don't have the necessary permissions to use this command: ${missingPermissions.join(', ')}`);
        }
    }

    // Safely check if the bot has the necessary permissions
    let botMissingPermissions = [];
    if (message.guild && message.guild.me) {
        try {
            botMissingPermissions = message.channel.permissionsFor(message.guild.members.me).missing([
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.EmbedLinks
            ]);
        } catch (err) {
            console.error('Error checking bot permissions:', err);
            botMissingPermissions = [];
        }
    }

    if (botMissingPermissions.length) {
        return message.reply(`I don't have the necessary permissions to send messages or embeds: ${botMissingPermissions.join(', ')}`);
    }

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error('Error executing command:', error);

        if (error.code === 10062 || error.status === 403 || error.status === 404 || error.status === 503 || error.status === 520) {
            return message.reply('An unexpected error has occurred. Please try again later.');
        }

        if (!botMissingPermissions.includes('SEND_MESSAGES')) {
            await message.reply('There was an error trying to execute that command!');
        } else {
            console.warn('Bot does not have permission to send messages.');
        }
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isCommand()) {
        await handleSlashCommand(interaction);
    } else if (interaction.isStringSelectMenu()) {
        await handleSelectMenu(interaction);
    } else if (interaction.isButton()) {
        await handleButton(interaction);
    } else if (interaction.isModalSubmit()) {
        await handleModalSubmit(interaction);
    } else {
        console.error('Received an unhandled interaction type.');
    }
});

async function handleSlashCommand(interaction) {
    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command: ${interaction.commandName}`, error);
        await handleInteractionError(interaction, 'There was an error executing this command!');
    }
}

async function handleSelectMenu(interaction) {
    const handler = client.interactions.get(interaction.customId);
    if (!handler) return;

    try {
        await handler.execute(interaction);
    } catch (error) {
        console.error(`Error executing select menu interaction: ${interaction.customId}`, error);
        await handleInteractionError(interaction, 'There was an error processing the selection menu!');
    }
}

async function handleButton(interaction) {
    const handler = client.interactions.get(interaction.customId);
    if (!handler) return;

    try {
        await handler.execute(interaction);
    } catch (error) {
        console.error(`Error executing button interaction: ${interaction.customId}`, error);
        await handleInteractionError(interaction, 'There was an error processing the button interaction!');
    }
}

async function handleModalSubmit(interaction) {
    const handler = client.interactions.get(interaction.customId);
    if (!handler) return;

    try {
        await handler.execute(interaction);
    } catch (error) {
        console.error(`Error executing modal interaction: ${interaction.customId}`, error);
        await handleInteractionError(interaction, 'There was an error submitting the form!');
    }
}

function handleInteractionError(interaction, message) {
    if (!interaction.replied) {
        interaction.reply({ content: message, ephemeral: true });
    } else {
        interaction.followUp({ content: message, ephemeral: true });
    }
}

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);

    if (reason instanceof Error) {
        console.error('Error stack:', reason.stack);
    }
});

client.login(token);