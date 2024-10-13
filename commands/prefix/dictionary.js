const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    PermissionsBitField,
    ComponentType
} = require('discord.js');
const dictionary = require('../../data/dictionary.json');

module.exports = {
    name: 'dictionary',
    description: 'Get definitions for terms or view categories.',
    permissions: ['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks'],
    async execute(message, args) {
        const botPermissions = message.channel.permissionsFor(message.guild.members.me);
        const requiredPermissions = new PermissionsBitField(['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks']);

        if (!botPermissions.has(requiredPermissions)) {
            return message.reply("I don't have the necessary permissions to execute this command. Please make sure I have `SEND_MESSAGES`, `VIEW_CHANNEL`, `READ_MESSAGE_HISTORY`, and `EMBED_LINKS` permissions.");
        }

        try {
            if (args.length === 0) {
                // No argument provided; show categories
                const categories = Object.keys(dictionary);
                const categoryOptions = categories.map(category =>
                    new StringSelectMenuOptionBuilder()
                    .setLabel(category)
                    .setDescription(dictionary[category].description || 'No description available.')
                    .setValue(category)
                );

                const categorySelectMenu = new StringSelectMenuBuilder()
                    .setCustomId('select-category')
                    .setPlaceholder('Select a category')
                    .addOptions(categoryOptions);

                const row = new ActionRowBuilder().addComponents(categorySelectMenu);

                const embed = new EmbedBuilder()
                    .setTitle('Boom Dictionary Categories')
                    .setDescription('Select a category to view terms.')
                    .setColor('#0099ff');

                const reply = await message.reply({
                    embeds: [embed],
                    components: [row]
                });

                const filter = interaction => interaction.user.id === message.author.id;
                const categoryCollector = reply.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    time: 30000
                });

                categoryCollector.on('collect', async (interaction) => {
                    if (interaction.customId !== 'select-category') return;

                    if (interaction.user.id !== message.author.id) {
                        return interaction.reply({
                            content: `Only ${message.author.username} can use this selection menu!`,
                            ephemeral: true
                        });
                    }

                    const selectedCategory = interaction.values[0];
                    const categoryData = dictionary[selectedCategory];

                    if (!categoryData) {
                        return interaction.reply({
                            content: 'Invalid category!',
                            ephemeral: true
                        });
                    }

                    // Generate term options for the selected category
                    const termOptions = Object.keys(categoryData)
                        .filter(term => typeof categoryData[term] === 'object' && categoryData[term].terminology)
                        .map(term =>
                            new StringSelectMenuOptionBuilder()
                            .setLabel(categoryData[term].terminology)
                            .setValue(term)
                        );

                    if (termOptions.length === 0) {
                        return interaction.reply({
                            content: 'No terms available for this category.',
                            ephemeral: true
                        });
                    }

                    // Create term selection menu without colon
                    const termSelectMenu = new StringSelectMenuBuilder()
                        .setCustomId('select-term')
                        .setPlaceholder('Select a term')
                        .addOptions(termOptions);

                    const row = new ActionRowBuilder().addComponents(termSelectMenu);
                    const embed = new EmbedBuilder()
                        .setTitle(selectedCategory)
                        .setDescription(categoryData.description || 'No description available for this category.')
                        .setColor('#0099ff');

                    await interaction.update({
                        embeds: [embed],
                        components: [row]
                    });

                    // Create a new collector for term selection
                    const termCollector = reply.createMessageComponentCollector({
                        componentType: ComponentType.StringSelect,
                        time: 30000
                    });

                    termCollector.on('collect', async (interaction) => {
                        if (interaction.customId !== 'select-term') return;

                        if (interaction.user.id !== message.author.id) {
                            return interaction.reply({
                                content: `Only ${message.author.username} can use this selection menu!`,
                                ephemeral: true
                            });
                        }

                        const selectedTerm = interaction.values[0];
                        const termData = categoryData[selectedTerm];

                        if (!termData) {
                            return interaction.reply({
                                content: 'Invalid term!',
                                ephemeral: true
                            });
                        }

                        // Send term definition
                        const embedTerm = new EmbedBuilder()
                            .setTitle(`Definition of ${termData.terminology}`)
                            .setDescription(termData.definition || 'No definition available.')
                            .addFields({
                                name: 'Category',
                                value: selectedCategory
                            }, {
                                name: 'Word Class',
                                value: termData.class || 'Unknown'
                            }, {
                                name: 'Origin',
                                value: termData.origin || 'Unknown'
                            }, {
                                name: 'Pronunciation',
                                value: termData.pronunciation || 'Not available'
                            })
                            .setColor('#0099ff');

                        await interaction.update({
                            embeds: [embedTerm],
                            components: []
                        });
                        termCollector.stop();
                    });

                    termCollector.on('end', async (collected, reason) => {
                        if (reason === 'time' && collected.size === 0) {
                            await reply.edit({
                                content: 'You did not select a term in time. Please try again.',
                                embeds: [],
                                components: []
                            });
                        }
                    });
                });

                categoryCollector.on('end', async (collected, reason) => {
                    if (reason === 'time' && collected.size === 0) {
                        await reply.edit({
                            content: 'You did not select anything in time. Please try again.',
                            embeds: [],
                            components: []
                        });
                    }
                });
            } else {
                // Argument provided; fetch the definition directly
                const term = args.join(' ');
                let definitionFound = false;

                for (const [category, terms] of Object.entries(dictionary)) {
                    if (terms[term]) {
                        const {
                            terminology,
                            definition,
                            class: wordClass,
                            origin,
                            pronunciation
                        } = terms[term];
                        const embed = new EmbedBuilder()
                            .setTitle(`Boom Dictionary: ${terminology || term}`)
                            .setDescription(definition)
                            .addFields({
                                name: 'Category',
                                value: category
                            }, {
                                name: 'Word Class',
                                value: wordClass || 'Unknown'
                            }, {
                                name: 'Origin',
                                value: origin || 'Unknown'
                            }, {
                                name: 'Pronunciation',
                                value: pronunciation || 'Not available'
                            })
                            .setColor('#0099ff');

                        await message.reply({
                            embeds: [embed]
                        });
                        definitionFound = true;
                        break;
                    }
                }

                if (!definitionFound) {
                    return message.reply(`No definition found for \`${term}\`. Please check the term and try again.`);
                }
            }
        } catch (error) {
            if (error.code === 10008) {
                return message.reply(`I couldn't find the selection menu for ${interaction.customId || 'this interaction'}, please try again later.`);
            } else if (error.code === 10062) {
                return message.reply("My systematic networking is currently out of sync and timed out. Please try again later.");
            } else if (error.code === 40060) {
                return message.reply("I couldn't reuse this interaction as I've already acknowledged it. Please try again later.");
            } else if (error.status === 403 || error.status === 404 || error.status === 503 || error.status === 520) {
                return message.reply("An unexpected error occurred. Please try again later.");
            } else if (error.message.includes("Interaction was not replied")) {
                return message.reply("An interaction error occurred. Please try again later.");
            } else {
                console.error('Error executing dictionary command:', error);
                message.reply('An error occurred while executing the dictionary command. Please try again later.');
            }
        }
    },
};