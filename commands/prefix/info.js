const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'info',
    description: 'Get information about Boom Dictionary.',
    async execute(message, args) {
        const embed = new EmbedBuilder()
            .setTitle('Boom Dictionary')
            .setDescription('Welcome to the Boom Dictionary Bot! Here you can find various information about Boom Beach terminology, statistics, and more.')
            .addFields(
                { name: 'Bot Name', value: 'Boom Dictionary Bot' },
                { name: 'Description', value: 'A bot that provides detailed information about Boom Beach terminology, stats, and prototype troops.' },
                { name: 'Support', value: 'For support and updates, please visit our [support server](https://discord.gg/example).' },
                { name: 'Created by:', value: 'Otheruser325.' }
            )
            .setColor('#0099ff')
            .setFooter({ text: 'Boom Dictionary' });

        await message.channel.send({ embeds: [embed] });
    },
};
