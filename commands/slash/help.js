const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const commandsPerPage = 10; // Number of commands per page

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Lists all available slash commands or provides detailed help for a specific command.'),
    async execute(interaction) {
        // Load slash command files
        const commandFiles = fs.readdirSync(path.join(__dirname, '../../commands/slash')).filter(file => file.endsWith('.js'));

        const defaultCommands = [];

        for (const file of commandFiles) {
            const command = require(path.join(__dirname, '../../commands/slash', file));
            if (command.data.name === 'help') continue; // Skip the help command

            let commandName = command.data.name;
            let description = command.data.description;

            if (command.data.aliases && command.data.aliases.length > 0) {
                commandName += ` (Aliases: ${command.data.aliases.join(', ')})`;
            }

            description += `\n${command.data.usage ? `Usage: ${command.data.usage}` : ''}`;

            defaultCommands.push({ name: commandName, description: description });
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
        const totalPages = Math.ceil(defaultCommands.length / commandsPerPage);

        const embed = generateEmbed(defaultCommands, currentPage);
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

            const newEmbed = generateEmbed(defaultCommands, currentPage);
            await i.update({ embeds: [newEmbed], components: [generateButtons(currentPage, totalPages)] });
        });

        collector.on('end', async () => {
            if (messageReply.editable) {
                await messageReply.edit({ components: [] });
            }
        });
    }
};
