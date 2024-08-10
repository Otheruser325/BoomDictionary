const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const deployCommands = async () => {
    const rest = new REST({ version: '9' }).setToken(token);

    try {
        console.log('Started refreshing global application (/) commands.');

        // Load command files
        const commandFiles = fs.readdirSync(path.join(__dirname, 'commands/slash')).filter(file => file.endsWith('.js'));
        const commands = commandFiles.map(file => {
            const command = require(path.join(__dirname, 'commands/slash', file));
            return command.data.toJSON();
        });

        // Fetch existing global commands
        const existingCommands = await rest.get(Routes.applicationCommands(clientId));

        // Delete commands that are not in the current commands directory
        for (const existingCommand of existingCommands) {
            if (!commands.some(cmd => cmd.name === existingCommand.name)) {
                await rest.delete(Routes.applicationCommand(clientId, existingCommand.id));
                console.log(`Deleted command: ${existingCommand.name}`);
            }
        }

        // Register or update current slash commands globally
        for (const command of commands) {
            const existingCommand = existingCommands.find(cmd => cmd.name === command.name);
            if (existingCommand) {
                // Update existing command
                await rest.patch(Routes.applicationCommand(clientId, existingCommand.id), { body: command });
                console.log(`Updated command: ${command.name}`);
            } else {
                // Register new command globally
                await rest.post(Routes.applicationCommands(clientId), { body: command });
                console.log(`Registered command: ${command.name}`);
            }
        }

        console.log('Successfully reloaded global application (/) commands.');
    } catch (error) {
        console.error('Error refreshing global application (/) commands:', error);
    }
};

module.exports = {
    deployCommands
};
