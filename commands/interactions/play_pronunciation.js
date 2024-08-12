const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require('discord.js');

module.exports = {
    customId: 'play_pronunciation',
    async execute(interaction) {
        // Check if the interaction is coming from a button
        if (interaction.isButton()) {
            const mp3FilePath = path.join(__dirname, '../../pronunciations', `${word}.mp3`);
            
            // Ensure the file exists
            if (fs.existsSync(mp3FilePath)) {
                // Send an audio file to the channel (in a real scenario, you would use a voice connection to play the audio)
                await interaction.reply({ content: 'Playing pronunciation...', files: [mp3FilePath] });
            } else {
                await interaction.reply({ content: `Pronunciation file not found for \`${word}\`.`, ephemeral: true });
            }
        }
    }
};
