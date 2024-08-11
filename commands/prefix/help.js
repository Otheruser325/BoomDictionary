const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const commandsPerPage = 10; // Number of commands per page

module.exports = {
    data: {
        name: 'help',
        description: 'Lists all available commands or provides detailed help for a specific command.',
    },
    async execute(interaction) {
        // Load prefix commands
        const prefixCommandsDir = path.join(__dirname, '../prefix');
        const prefixCommandFiles = fs.readdirSync(prefixCommandsDir).filter(file => file.endsWith('.js'));

        const prefixCommands = [];

        for (const file of prefixCommandFiles) {
            const command = require(path.join(prefixCommandsDir, file));
            let commandName = command.name;
            let description = command.description;

            if (command.aliases && command.aliases.length > 0) {
                commandName += ` (Aliases: ${command.aliases.join(', ')})`;
            }

            description += `\n${command.usage ? `Usage: ${command.usage}` : ''}`;

            prefixCommands.push({ name: commandName, description: description });
        }

        // Load slash commands
        const slashCommandsDir = path.join(__dirname, '../slash');
        const slashCommandFiles = fs.readdirSync(slashCommandsDir).filter(file => file.endsWith('.js'));

        const slashCommands = [];

        for (const file of slashCommandFiles) {
            const command = require(path.join(slashCommandsDir, file));
            let commandName = command.data.name;
            let description = command.data.description;

            if (command.data.aliases && command.data.aliases.length > 0) {
                commandName += ` (Aliases: ${command.data.aliases.join(', ')})`;
            }

            description += `\n${command.data.usage ? `Usage: ${command.data.usage}` : ''}`;

            slashCommands.push({ name: commandName, description: description });
        }

        // Combine both command arrays
        const commands = [...prefixCommands, ...slashCommands];

        const generateEmbed = (commands, page) => {
            const start = (page - 1) * commandsPerPage;
            const currentCommands = commands.slice(start, start + commandsPerPage);

            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setTimestamp();

            currentCommands.forEach(cmd => {
                embed.addFields({ name: cmd.name, value: cmd.description });
            });

            embed.setFooter({ text: `Page ${page} of ${Math.ceil(commands.length / commandsPerPage)}` });
            return embed;
        };

        const generateButtons = (currentPage, totalPages) => {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('◀️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 1),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === totalPages)
            );
            return row;
        };

        let currentPage = 1;
        const totalPages = Math.ceil(commands.length / commandsPerPage);

        const embed = generateEmbed(commands, currentPage);
        const row = generateButtons(currentPage, totalPages);

        const messageReply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        const filter = (i) => i.user.id === interaction.user.id;
        const collector = messageReply.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (i) => {
            if (i.customId === 'previous' && currentPage > 1) {
                currentPage--;
            } else if (i.customId === 'next' && currentPage < totalPages) {
                currentPage++;
            }

            const newEmbed = generateEmbed(commands, currentPage);
            await i.update({ embeds: [newEmbed], components: [generateButtons(currentPage, totalPages)] });
        });

        collector.on('end', async () => {
            if (messageReply.editable) {
                await messageReply.edit({ components: [] });
            }
        });

        // Specific command help
        const requestedCommand = interaction.options.getString('command');
        if (requestedCommand) {
            const command = commands.find(cmd =>
                cmd.name.toLowerCase() === requestedCommand.toLowerCase()
            );
            if (command) {
                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setTitle(`Command: ${command.name}`)
                    .addFields({ name: 'Description:', value: `**${command.description}**` })
                    .addFields({ name: 'Usage:', value: command.usage || 'No usage information available.' });

                return interaction.reply({ embeds: [embed] });
            } else {
                return interaction.reply(`Command '${requestedCommand}' not found.`);
            }
        }
    }
};
