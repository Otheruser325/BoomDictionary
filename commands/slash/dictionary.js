const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');
const dictionary = require('../../data/dictionary.json'); // Load the dictionary file

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dictionary')
        .setDescription('Look up definitions related to Boom Beach.')
        .addSubcommand(subcommand =>
            subcommand
            .setName('define')
            .setDescription('Get the definition of a word or phrase')
            .addStringOption(option =>
                option.setName('term')
                .setDescription('The word or phrase to define')
                .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
            .setName('categories')
            .setDescription('View categories and their descriptions')
        )
        .addSubcommand(subcommand =>
            subcommand
            .setName('random')
            .setDescription('Get a random term from any category')
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'define') {
                const term = interaction.options.getString('term').toLowerCase();
                let definitionFound = false;

                // Check each category for the term
                for (const [category, terms] of Object.entries(dictionary)) {
                    const normalizedTerms = Object.fromEntries(
                        Object.entries(terms).map(([key, value]) => [key.toLowerCase(), value])
                    );

                    if (normalizedTerms[term]) {
                        const termData = normalizedTerms[term];
                        const {
                            terminology,
                            definition,
                            class: termClass,
                            origin,
                            pronunciation
                        } = termData;

                        const embed = new EmbedBuilder()
                            .setTitle(`Boom Dictionary: ${terminology || term}`)
                            .setDescription(definition)
                            .addFields({
                                name: 'Category',
                                value: category
                            }, {
                                name: 'Class',
                                value: termClass || 'Not provided'
                            }, {
                                name: 'Origin',
                                value: origin || 'Not provided'
                            }, {
                                name: 'Pronunciation',
                                value: pronunciation || 'Not provided'
                            })
                            .setColor('#0099ff');

                        await interaction.reply({
                            embeds: [embed]
                        });
                        definitionFound = true;
                        break;
                    }
                }

                if (!definitionFound) {
                    await interaction.reply({
                        content: `No definition found for \`${term}\`.`,
                        ephemeral: true
                    });
                }
            } else if (subcommand === 'categories') {
                // Show categories with their descriptions
                const categories = Object.keys(dictionary);

                const embed = new EmbedBuilder()
                    .setTitle('Boom Dictionary Categories')
                    .setDescription('Select a category to view its terms.')
                    .setColor('#0099ff');

                // Add fields for each category and its description
                categories.forEach(category => {
                    const description = dictionary[category].description;
                    embed.addFields({
                        name: category,
                        value: description || 'No description available',
                        inline: false
                    });
                });

                await interaction.reply({
                    embeds: [embed]
                });
            } else if (subcommand === 'random') {
                // Get a random term from any category
                const allTerms = [];
                for (const terms of Object.values(dictionary)) {
                    allTerms.push(...Object.entries(terms).filter(([key, value]) => typeof value === 'object'));
                }

                if (allTerms.length === 0) {
                    await interaction.reply({
                        content: 'No terms available.',
                        ephemeral: true
                    });
                    return;
                }

                const randomTerm = allTerms[Math.floor(Math.random() * allTerms.length)];
                const [term, termData] = randomTerm;

                const {
                    terminology,
                    definition,
                    class: termClass,
                    origin,
                    pronunciation
                } = termData;

                const embed = new EmbedBuilder()
                    .setTitle(`Boom Dictionary: ${terminology || term}`)
                    .setDescription(definition)
                    .addFields({
                        name: 'Category',
                        value: 'Random'
                    }, {
                        name: 'Class',
                        value: termClass || 'Not provided'
                    }, {
                        name: 'Origin',
                        value: origin || 'Not provided'
                    }, {
                        name: 'Pronunciation',
                        value: pronunciation || 'Not provided'
                    })
                    .setColor('#0099ff');

                await interaction.reply({
                    embeds: [embed]
                });
            }
        } catch (error) {
            if (error.code === 10008) {
                return interaction.followUp(`The dictionary embed was deleted and couldn't be recovered, please try again later.`);
            } else if (error.code === 10062) {
                return interaction.followUp("My systematic networking is currently out of sync and timed out. Please try again later.");
            } else if (error.code === 40060) {
                return interaction.followUp("I couldn't reuse this interaction as I've already acknowledged it. Please try again later.");
            } else if (error.status === 403 || error.status === 404 || error.status === 503 || error.status === 520) {
                return interaction.followUp("An unexpected error occurred. Please try again later.");
            } else if (error.message.includes("Interaction was not replied")) {
                return interaction.followUp("An interaction error occurred. Please try again later.");
            } else {
                console.error('Error executing dictionary command:', error);
                interaction.reply('An error occurred while executing the dictionary command. Please try again later.');
            }
        }
    },
};