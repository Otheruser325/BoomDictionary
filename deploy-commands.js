const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const path = require('path');

const deployCommands = async (clientId, token, commands) => {
    const rest = new REST({ version: '9' }).setToken(token);

    const commandData = commands.map(command => command.data.toJSON());

    try {
        console.log('Started refreshing application (/) commands.');

        // Fetch existing global commands
        const existingCommandsResponse = await rest.get(Routes.applicationCommands(clientId));
        const existingCommands = await existingCommandsResponse.json();

        // Delete commands that are not present in the current commands directory
        for (const existingCommand of existingCommands) {
            if (!commandData.some(cmd => cmd.name === existingCommand.name)) {
                await rest.delete(Routes.applicationCommand(clientId, existingCommand.id));
                console.log(`Deleted command: ${existingCommand.name}`);
            }
        }

        // Register or update current slash commands globally
        for (const command of commandData) {
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

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error refreshing application (/) commands:', error);
    }
};

module.exports = {
    deployCommands
};
