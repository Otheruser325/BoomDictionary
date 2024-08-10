const fs = require('fs');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const commandsPerPage = 10; // Number of commands per page

module.exports = {
    data: {
        name: 'help',
        description: 'Lists all available commands or provides detailed help for a specific command.',
    },
    async execute(interaction) {
        // Load command files
        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js') && file !== 'help.js');
        
        const commands = [];
        
        for (const file of commandFiles) {
            const command = require(`./${file}`);
            let commandName = command.data.name;
            let description = command.data.description;

            if (command.data.aliases && command.data.aliases.length > 0) {
                commandName += ` (Aliases: ${command.data.aliases.join(', ')})`;
            }

            description += `\n${command.data.usage ? `Usage: ${command.data.usage}` : ''}`;

            commands.push({ name: commandName, description: description, command: command });
        }

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

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'previous' && currentPage > 1) {
                currentPage--;
            } else if (interaction.customId === 'next' && currentPage < totalPages) {
                currentPage++;
            }

            const newEmbed = generateEmbed(commands, currentPage);
            await interaction.update({ embeds: [newEmbed], components: [generateButtons(currentPage, totalPages)] });
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
                cmd.command.data.name.toLowerCase() === requestedCommand.toLowerCase() || 
                (cmd.command.data.aliases && cmd.command.data.aliases.map(alias => alias.toLowerCase()).includes(requestedCommand.toLowerCase()))
            );
            if (command) {
                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setTitle(`Command: ${command.name}`)
                    .addFields({ name: 'Description:', value: `**${command.command.data.description}**` })
                    .addFields({ name: 'Usage:', value: command.command.data.usage || 'No usage information available.' });

                if (command.command.data.note) {
                    embed.addFields({ name: 'Note:', value: command.command.data.note });
                }

                if (command.command.data.exampleUsage) {
                    embed.addFields({ name: 'Example Usage:', value: command.command.data.exampleUsage });
                }

                return interaction.reply({ embeds: [embed] });
            } else {
                return interaction.reply(`Command '${requestedCommand}' not found.`);
            }
        }
    }
};
