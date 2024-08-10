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
                    const embed = new EmbedBuilder()
                        .setTitle(`Boom Dictionary: ${term}`)
                        .setDescription(normalizedTerms[term])
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
                    .map(([term, definition]) => `**${term}**: ${definition}`)
                    .join('\n');

                embed.addFields({
                    name: category,
                    value: termList || 'No terms available',
                    inline: false
                });
            });

            await interaction.reply({ embeds: [embed] });
        }
    },
};
