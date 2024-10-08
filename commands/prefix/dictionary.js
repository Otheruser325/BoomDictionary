const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionsBitField } = require('discord.js');
const dictionary = require('../../data/dictionary.json');

module.exports = {
    name: 'dictionary',
    description: 'Get definitions for terms or view categories.',
    permissions: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY', 'EMBED_LINKS'],
    async execute(message, args) {
        // Check bot permissions
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
                    // Normalize term keys to lowercase for case-insensitive search
                    const normalizedTerms = Object.fromEntries(
                        Object.entries(terms).filter(([key, value]) => typeof value === 'object')
                        .map(([key, value]) => [key.toLowerCase(), value])
                    );

                    if (normalizedTerms[term]) {
                        const { terminology, definition, class: wordClass, origin, pronunciation } = normalizedTerms[term];
                        const embed = new EmbedBuilder()
                            .setTitle(`Boom Dictionary: ${terminology || term}`)
                            .setDescription(definition)
                            .addFields(
                                { name: 'Category', value: category },
                                { name: 'Word Class', value: wordClass || 'Unknown' },
                                { name: 'Origin', value: origin || 'Unknown' },
                                { name: 'Pronunciation', value: pronunciation || 'Not available' }
                            )
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
        } catch (error) {
            console.error('Error executing dictionary command:', error);
            message.reply('An error occurred while executing the dictionary command. Please try again later.');
        }
    },
};