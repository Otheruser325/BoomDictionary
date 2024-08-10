const { MessageEmbed } = require('discord.js');
const dictionary = require('../../data/dictionary.json'); // Load the dictionary data

module.exports = {
    name: 'dictionary',
    description: 'Look up definitions related to Boom Beach.',
    async execute(message, args) {
        const prefix = process.env.PREFIX;

        if (args.length === 0) {
            // Show categories
            const categories = Object.keys(dictionary).join('\n');
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Boom Dictionary Categories')
                .setDescription(`Available categories:\n${categories}`)
                .setTimestamp();

            return message.channel.send({ embeds: [embed] });
        }

        // Handle category and term lookups
        const category = args.shift();
        const term = args.join(' ').toLowerCase();

        if (Object.keys(dictionary).includes(category)) {
            const definitions = dictionary[category];
            const definition = definitions[term];

            if (definition) {
                const embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(`Definition of ${term} (${category})`)
                    .setDescription(definition)
                    .setTimestamp();

                return message.channel.send({ embeds: [embed] });
            } else {
                return message.channel.send(`No definition found for "${term}" in category "${category}".`);
            }
        } else {
            return message.channel.send(`Category "${category}" not found. Use \`${prefix}dictionary\` to see available categories.`);
        }
    },
};
