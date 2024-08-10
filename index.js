const { Client, Intents, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { deployCommands } = require('./deploy-commands'); // Ensure this function is implemented

// Load environment variables from .env file
dotenv.config();

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID; // Your bot's client ID
const guildId = process.env.GUILD_ID; // Your server's guild ID (for guild-specific commands)
const prefixes = ['bd!', 'BD!']; // Define your prefixes

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.DIRECT_MESSAGES
    ]
});

client.commands = new Collection();
client.slashCommands = new Collection();

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

client.once('ready', () => {
    console.log('Bot is online!');
    console.log(`Logged in as ${client.user.tag}`);

    // Deploy slash commands
    deployCommands(clientId, token, client.slashCommands);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Determine if message starts with a valid prefix
    let prefix = prefixes.find(p => message.content.startsWith(p));
    if (!prefix) return;

    // Extract command and arguments
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error('Error executing command:', error);
        await message.reply('There was an error trying to execute that command!');
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
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
});

client.login(token);
