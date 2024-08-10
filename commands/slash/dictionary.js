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
                if (terms[term]) {
                    const embed = new EmbedBuilder()
                        .setTitle(`Boom Dictionary: ${term}`)
                        .setDescription(terms[term])
                        .addField('Category', category)
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
            // No argument provided; show categories
            const categories = Object.keys(dictionary);
            const embed = new EmbedBuilder()
                .setTitle('Boom Dictionary Categories')
                .setDescription('Select a category to view terms.')
                .addFields(
                    categories.map(category => ({
                        name: category,
                        value: dictionary[category] ? Object.keys(dictionary[category]).join(', ') : 'No terms available',
                        inline: true
                    }))
                )
                .setColor('#0099ff');

            await interaction.reply({ embeds: [embed] });
        }
    },
};
