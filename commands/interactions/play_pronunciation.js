const { Client, GatewayIntentBits } = require('discord.js');
const path = require('path');

module.exports = {
    customId: /^play_pronunciation_.+/,
    async execute(interaction) {
        if (interaction.isButton()) {
            const term = interaction.customId.split('_')[2]; // Extract the term from the custom ID
            const responseMessage = `Now playing pronunciation for: **${term}**`;
            
            // Reply with TTS enabled
            await interaction.reply({ content: responseMessage, tts: true, ephemeral: false });
        }
    }
};
