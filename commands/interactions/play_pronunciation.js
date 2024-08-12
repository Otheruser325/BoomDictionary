module.exports = {
    customId: /^play_pronunciation_.+/,
    async execute(interaction) {
        if (interaction.isButton()) {
            const term = interaction.customId.split('_')[2];

            const message = `The pronunciation for the word "${term}" is now being played.`;

            await interaction.reply({ content: message, tts: true, ephemeral: false });
        }
    }
};
