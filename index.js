const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
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

    // Check if the bot has the necessary permissions
    const botMissingPermissions = message.channel.permissionsFor(message.guild.me).missing(['SEND_MESSAGES', 'EMBED_LINKS']);
    if (botMissingPermissions.length) {
        return message.reply(`I don't have the necessary permissions to send messages or embeds: ${botMissingPermissions.join(', ')}`);
    }

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error('Error executing command:', error);
        if (botMissingPermissions.includes('SEND_MESSAGES')) {
            console.warn('Bot does not have permission to send messages.');
        } else {
            await message.reply('There was an error trying to execute that command!');
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
		
		// Check if the user has the necessary permissions
        if (command.permissions) {
            const member = interaction.guild.members.cache.get(interaction.user.id);
            const missingPermissions = command.permissions.filter(permission => !member.permissions.has(permission));
            if (missingPermissions.length) {
                return interaction.reply({ content: `You don't have the necessary permissions to use this command: ${missingPermissions.join(', ')}`, ephemeral: true });
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

client.login(token);