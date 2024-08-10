const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const dictionary = require('../../data/dictionary.json');
const { selectCategory } = require('../../commands/interactions/select_category.js');
const { selectTerm } = require('../../commands/interactions/select_term.js');

module.exports = {
    name: 'dictionary',
    description: 'Get definitions for terms related to Boom Beach or view categories.',
    async execute(message, args) {
        if (args.length === 0) {
            // No argument provided; show categories
            const categories = Object.keys(dictionary);

            const categoryOptions = categories.map(category =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(category)
                    .setValue(category)
            );

            const categorySelectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_category')
                .setPlaceholder('Select a category')
                .addOptions(categoryOptions);

            const row = new ActionRowBuilder().addComponents(categorySelectMenu);

            const embed = new EmbedBuilder()
                .setTitle('Boom Dictionary Categories')
                .setDescription('Select a category to view terms.')
                .setColor('#0099ff');

            await message.channel.send({ embeds: [embed], components: [row] });
        } else {
            // Argument provided; fetch the definition
            const term = args.join(' ').toLowerCase();
            let definitionFound = false;

            // Check each category for the term
            for (const [category, terms] of Object.entries(dictionary)) {
                if (terms[term]) {
                    const embed = new EmbedBuilder()
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
