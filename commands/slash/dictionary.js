const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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
                .setDescription('View categories and terms')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('random')
                .setDescription('Get a random term from any category')
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'define') {
            const term = interaction.options.getString('term').toLowerCase();
            let definitionFound = false;

            // Check each category for the term
            for (const [category, terms] of Object.entries(dictionary)) {
                // Normalize terms keys to lowercase for case-insensitive search
                const normalizedTerms = Object.fromEntries(
                    Object.entries(terms).map(([key, value]) => [key.toLowerCase(), value])
                );

                if (normalizedTerms[term]) {
                    const termData = normalizedTerms[term];
                    const embed = new EmbedBuilder()
                        .setTitle(`Boom Dictionary: ${term}`)
                        .setDescription(termData.definition)
                        .addFields({ name: 'Category', value: category })
                        .setColor('#0099ff');

                    await interaction.reply({ embeds: [embed] });
                    definitionFound = true;
                    break;
                }
            }

            if (!definitionFound) {
                await interaction.reply({ content: `No definition found for \`${term}\`.`, ephemeral: true });
            }
        } else if (subcommand === 'categories') {
            // Show categories with terms and descriptions
            const categories = Object.keys(dictionary);

            const embed = new EmbedBuilder()
                .setTitle('Boom Dictionary Categories')
                .setDescription('View categories and select terms.')
                .setColor('#0099ff');

            // Add fields for each category and its terms
            categories.forEach(category => {
                const terms = dictionary[category];
                const termList = Object.entries(terms)
                    .map(([term, termData]) => `**${term}**: ${termData.definition}`)
                    .join('\n');

                embed.addFields({
                    name: category,
                    value: termList || 'No terms available',
                    inline: false
                });
            });

            await interaction.reply({ embeds: [embed] });
        } else if (subcommand === 'random') {
            // Get a random term from any category
            const allTerms = [];
            for (const terms of Object.values(dictionary)) {
                allTerms.push(...Object.entries(terms));
            }

            if (allTerms.length === 0) {
                await interaction.reply({ content: 'No terms available.', ephemeral: true });
                return;
            }

            const randomTerm = allTerms[Math.floor(Math.random() * allTerms.length)];
            const [term, termData] = randomTerm;

            const embed = new EmbedBuilder()
                .setTitle(`Boom Dictionary: ${term}`)
                .setDescription(termData.definition)
                .addFields({ name: 'Category', value: 'Random' })
                .setColor('#0099ff');

            await interaction.reply({ embeds: [embed] });
        }
    },
};
