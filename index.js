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

// Load interaction handlers
const interactionFiles = fs.readdirSync(path.join(__dirname, 'commands/interactions')).filter(file => file.endsWith('.js'));
for (const file of interactionFiles) {
    const interaction = require(path.join(__dirname, 'commands/interactions', file));
    client.interactions.set(interaction.customId, interaction);
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
        if (!botMissingPermissions.includes('SEND_MESSAGES')) {
            await message.reply('There was an error trying to execute that command!');
        } else {
            console.warn('Bot does not have permission to send messages.');
        }
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isCommand()) {
        const command = client.slashCommands.get(interaction.commandName);
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }
		
		if (!interaction.guild) {
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('Error executing interaction in DMs:', error);
                await interaction.reply({ content: 'There was an error executing this command in DMs!', ephemeral: true });
            }
            return;
        }
		
		// Check if the user has the necessary permissions
        if (command.permissions) {
            try {
                // Fetch the member if not cached
                const member = await interaction.guild.members.fetch(interaction.user.id);
                const missingPermissions = command.permissions.filter(permission => !member.permissions.has(permission));
                if (missingPermissions.length) {
                    return interaction.reply({ content: `You don't have the necessary permissions to use this command: ${missingPermissions.join(', ')}`, ephemeral: true });
                }
            } catch (error) {
                console.error('Error fetching member:', error);
                return interaction.reply({ content: 'There was an error checking your permissions.', ephemeral: true });
            }
        }

        // Check if the bot has necessary permissions
        const botMissingPermissions = interaction.channel.permissionsFor(interaction.guild.me).missing(['SEND_MESSAGES', 'EMBED_LINKS']);
        if (botMissingPermissions.length) {
            return interaction.reply({ content: `I don't have the necessary permissions to send messages or embeds: ${botMissingPermissions.join(', ')}`, ephemeral: true });
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('Error executing interaction command:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
            } else {
                await interaction.followUp({ content: 'There was an error executing this command!', ephemeral: true });
            }
        }
    } else if (interaction.isStringSelectMenu()) {
        const interactionHandler = client.interactions.get(interaction.customId);
        if (!interactionHandler) {
            console.error(`No interaction handler matching ${interaction.customId} was found.`);
            return;
        }

        try {
            await interactionHandler.execute(interaction);
        } catch (error) {
            console.error('Error executing interaction:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'There was an error executing this interaction!', ephemeral: true });
            } else {
                await interaction.followUp({ content: 'There was an error executing this interaction!', ephemeral: true });
            }
        }
    } else if (interaction.isButton()) {
        const interactionHandler = client.interactions.get(interaction.customId);
        if (!interactionHandler) {
            console.error(`No interaction handler matching ${interaction.customId} was found.`);
            return;
        }

        try {
            await interactionHandler.execute(interaction);
        } catch (error) {
            console.error('Error executing button interaction:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'There was an error executing this interaction!', ephemeral: true });
            } else {
                await interaction.followUp({ content: 'There was an error executing this interaction!', ephemeral: true });
            }
        }
    } else if (interaction.isModalSubmit()) {
        const interactionHandler = client.interactions.get(interaction.customId);
        if (!interactionHandler) {
            console.error(`No modal interaction handler matching ${interaction.customId} was found.`);
            return;
        }

        try {
            await interactionHandler.execute(interaction);
        } catch (error) {
            console.error('Error executing modal interaction:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'There was an error executing this form submission!', ephemeral: true });
            } else {
                await interaction.followUp({ content: 'There was an error executing this form submission!', ephemeral: true });
            }
        }
    }  else {
        console.error('Received an unhandled interaction type.');
    }
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

client.login(token);