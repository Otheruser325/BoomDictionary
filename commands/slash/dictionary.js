const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const dictionary = require('../../data/dictionary.json'); // Adjust path as necessary

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
                .setDescription('Get a list of all categories and terms')
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'define') {
            const term = interaction.options.getString('term').toLowerCase();
            let definitionFound = false;

            for (const [category, terms] of Object.entries(dictionary)) {
                if (terms[term]) {
                    const embed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle(`Definition of ${term}`)
                        .setDescription(terms[term])
                        .addFields({ name: 'Category', value: category })
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                    definitionFound = true;
                    break;
                }
            }

            if (!definitionFound) {
                await interaction.reply({ content: `No definition found for "${term}".`, ephemeral: true });
            }
        } else if (subcommand === 'categories') {
            const categories = Object.keys(dictionary);
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Boom Dictionary Categories')
                .setDescription('Here are the categories and some terms available:')
                .addFields(
                    categories.map(category => ({
                        name: category,
                        value: Object.keys(dictionary[category]).join(', '),
                        inline: true
                    }))
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    },
};
