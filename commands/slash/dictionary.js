const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const dictionary = require('../../data/dictionary.json'); // Assuming you have a dictionary file

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
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const term = interaction.options.getString('term');

        if (subcommand === 'define') {
            const definition = dictionary[term.toLowerCase()];

            if (definition) {
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`Definition of ${term}`)
                    .setDescription(definition)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({ content: `No definition found for "${term}".`, ephemeral: true });
            }
        }
    },
};
