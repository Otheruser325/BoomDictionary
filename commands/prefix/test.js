module.exports = {
    name: 'test',
    description: 'A test command',
    aliases: [], // Optional
    async execute(message, args) {
        await message.reply('Test command executed!');
    }
};
