import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { config } from 'dotenv';

config();

export const deployCommands = async (clientId, token, slashCommands) => {
    const rest = new REST({ version: '10' }).setToken(token);

    try {
        console.log('Started refreshing global application (/) commands.');

        const commands = [...slashCommands.values()].map(command => command.data.toJSON());
        const existingCommands = await rest.get(Routes.applicationCommands(clientId));

        for (const existingCommand of existingCommands) {
            if (!commands.some(cmd => cmd.name === existingCommand.name)) {
                await rest.delete(Routes.applicationCommand(clientId, existingCommand.id));
                console.log(`Deleted command: ${existingCommand.name}`);
            }
        }

        for (const command of commands) {
            const existing = existingCommands.find(cmd => cmd.name === command.name);
            if (existing) {
                await rest.patch(Routes.applicationCommand(clientId, existing.id), { body: command });
                console.log(`Updated command: ${command.name}`);
            } else {
                await rest.post(Routes.applicationCommands(clientId), { body: command });
                console.log(`Registered command: ${command.name}`);
            }
        }

        console.log('Successfully reloaded global application (/) commands.');
    } catch (error) {
        console.error('Error refreshing commands:', error);
    }
};