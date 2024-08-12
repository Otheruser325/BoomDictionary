const { path } = require('path');
const fs = require('fs');

module.exports = {
    customId: 'play_pronunciation',
    async execute(interaction) {
        if (interaction.isButton()) {
            const term = interaction.message.embeds[0].title.split('Pronunciation for ')[1];
            const formattedFileName = term
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
                + '.mp3';

            const mp3FilePath = path.join(__dirname, '../../pronunciations', formattedFileName);

            if (fs.existsSync(mp3FilePath)) {
                await interaction.reply({ content: 'Playing pronunciation...', files: [mp3FilePath] });
            } else {
                await interaction.reply({ content: `Pronunciation file not found for \`${term}\`.`, ephemeral: true });
            }
        }
    }
};
