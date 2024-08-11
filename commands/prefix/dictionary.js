const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const dictionary = require('../../data/dictionary.json');

module.exports = {
    name: 'dictionary',
    description: 'Get definitions for terms or view categories.',
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
            const term = args.join(' ').toLowerCase(); // Convert input to lowercase
            let definitionFound = false;

            // Check each category for the term
            for (const [category, terms] of Object.entries(dictionary)) {
                // Normalize terms keys to lowercase for case-insensitive search
                const normalizedTerms = Object.fromEntries(
                    Object.entries(terms).filter(([key, value]) => typeof value === 'object')
                        .map(([key, value]) => [key.toLowerCase(), value])
                );

                if (normalizedTerms[term]) {
                    const { terminology, definition } = normalizedTerms[term];
                    const embed = new EmbedBuilder()
                        .setTitle(`Boom Dictionary: ${terminology || term}`)
                        .setDescription(definition)
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
