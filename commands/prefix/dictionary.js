const { EmbedBuilder } = require('discord.js'); // Updated import
const dictionary = require('../../data/dictionary.json');

module.exports = {
    name: 'dictionary',
    description: 'Get definitions for terms related to Boom Beach or view categories.',
    async execute(message, args) {
        if (args.length === 0) {
            // No argument provided; show categories
            const categories = Object.keys(dictionary);
            const embed = new EmbedBuilder() // Updated to use EmbedBuilder
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

            await message.channel.send({ embeds: [embed] });
        } else {
            // Argument provided; fetch the definition
            const term = args.join(' ').toLowerCase();
            let definitionFound = false;

            // Check each category for the term
            for (const [category, terms] of Object.entries(dictionary)) {
                if (terms[term]) {
                    const embed = new EmbedBuilder() // Updated to use EmbedBuilder
                        .setTitle(`Boom Dictionary: ${term}`)
                        .setDescription(terms[term])
                        .addFields({ name: 'Category', value: category })
                        .setColor('#0099ff');

                    await message.channel.send({ embeds: [embed] });
                    definitionFound = true;
                    break;
                }
            }

            if (!definitionFound) {
                await message.channel.send(`No definition found for \`${term}\`. Please check the term and try again.`);
            }
        }
    },
};
