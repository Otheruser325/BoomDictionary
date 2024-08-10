const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const deployCommands = async () => {
    try {
        console.log('Started refreshing global application (/) commands.');

        const commands = [];
        const commandFiles = fs.readdirSync(path.join(__dirname, 'commands/slash')).filter(file => file.endsWith('.js'));

        // Read command files and add to commands array
        for (const file of commandFiles) {
            const command = require(path.join(__dirname, 'commands/slash', file));
            if (command.data) {
                commands.push(command.data);
            }
        }

        // Fetch existing global commands
        const existingCommandsResponse = await fetch(`https://discord.com/api/v9/applications/${clientId}/commands`, {
            headers: {
                'Authorization': `Bot ${token}`
            }
        });

        if (!existingCommandsResponse.ok) {
            throw new Error(`Error fetching existing global commands: ${existingCommandsResponse.statusText}`);
        }

        const existingCommands = await existingCommandsResponse.json();

        // Delete commands that are not present in the current commands/slash directory
        for (const existingCommand of existingCommands) {
            if (!commands.some(cmd => cmd.name === existingCommand.name)) {
                await fetch(`https://discord.com/api/v9/applications/${clientId}/commands/${existingCommand.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bot ${token}`
                    }
                });
                console.log(`Deleted command: ${existingCommand.name}`);
            }
        }

        // Register or update current slash commands globally
        for (const command of commands) {
            const existingCommand = existingCommands.find(cmd => cmd.name === command.name);
            if (existingCommand) {
                // Update existing command
                await fetch(`https://discord.com/api/v9/applications/${clientId}/commands/${existingCommand.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bot ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(command)
                });
                console.log(`Updated command: ${command.name}`);
            } else {
                // Register new command globally
                await fetch(`https://discord.com/api/v9/applications/${clientId}/commands`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bot ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(command)
                });
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
