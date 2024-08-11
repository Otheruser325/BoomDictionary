const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const fs = require('fs');
const path = require('path');
const commandsPerPage = 10; // Number of commands per page

module.exports = {
    name: 'help',
    description: 'Lists all available prefix commands or provides detailed help for a specific command.',
    async execute(message, args) {
        // Load prefix command files
        const commandFiles = fs.readdirSync(path.join(__dirname, '../../commands/prefix')).filter(file => file.endsWith('.js'));

        const defaultCommands = [];

        for (const file of commandFiles) {
            const command = require(path.join(__dirname, '../../commands/prefix', file));
            if (command.name === 'help') continue; // Skip the help command

            let commandName = command.name;
            let description = command.description;

            if (command.aliases && command.aliases.length > 0) {
                commandName += ` (Aliases: ${command.aliases.join(', ')})`;
            }

            description += `\n${command.usage ? `Usage: ${command.usage}` : ''}`;

            defaultCommands.push({ name: commandName, description: description });
        }

        const generateEmbed = (commands, page) => {
            const start = (page - 1) * commandsPerPage;
            const currentCommands = commands.slice(start, start + commandsPerPage);

            const embed = new MessageEmbed()
                .setColor('BLUE')
                .setTimestamp();

            currentCommands.forEach(cmd => {
                embed.addField(cmd.name, cmd.description);
            });

            embed.setFooter({ text: `Page ${page} of ${Math.ceil(commands.length / commandsPerPage)}` });
            return embed;
        };

        const generateButtons = (currentPage, totalPages) => {
            const row = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId('previous')
                    .setLabel('◀️')
                    .setStyle('PRIMARY')
                    .setDisabled(currentPage === 1),
                new MessageButton()
                    .setCustomId('next')
                    .setLabel('▶️')
                    .setStyle('PRIMARY')
                    .setDisabled(currentPage === totalPages)
            );
            return row;
        };

        let currentPage = 1;
        const totalPages = Math.ceil(defaultCommands.length / commandsPerPage);

        const embed = generateEmbed(defaultCommands, currentPage);
        const row = generateButtons(currentPage, totalPages);

        const messageReply = await message.reply({ embeds: [embed], components: [row], fetchReply: true });

        const filter = (i) => i.user.id === message.author.id;
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
