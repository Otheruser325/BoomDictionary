const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

// Patch notes for Boom Dictionary
const patchNotes = [
    { version: '1.1.2', features: 'Usability fixes and improvements', date: '2024-10-12' },
    { version: '1.1.1', features: 'Bug fixes', date: '2024-10-08' },
    { version: '1.1.0', features: 'Added the submit command, to submit new suggestions and report bugs in the Boom Dictionary. Added the gunboat ability stat checker (temporary gunboat abilities coming soon!). Also added patch notes!', date: '2024-10-06' },
	{ version: '1.0.3', features: 'Added and fixed missing troop data.', date: '2024-09-29' },
	{ version: '1.0.2', features: 'Bug fixes and minor improvements', date: '2024-08-26' },
    { version: '1.0.1', features: 'Added more troops and defences data.', date: '2024-08-19' },
    { version: '1.0.0', features: 'Bot release!', date: '2024-08-10' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Get information about Boom Dictionary.')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('The page of the patch notes to view.')
                .setRequired(false)
        ),
    async execute(interaction) {
        // Get page number, default to 1 if not provided or invalid
        let page = interaction.options.getInteger('page') || 1;

        // Handle invalid page inputs (0, negative numbers, etc.)
        if (page < 1 || page > patchNotes.length) {
            page = 1; // Default to latest (first) page if invalid
        }

        const note = patchNotes[page - 1]; // Pages are 1-indexed for users

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('Boom Dictionary Information')
            .setDescription('Here is some information about the bot:')
            .addFields(
                { name: 'Version', value: note.version },
				{ name: 'Date', value: new Date(note.date).toLocaleDateString() },
                { name: 'Developer', value: '<@822964244697710612>' },
                { name: 'New Features', value: note.features },
				{ name: 'Description', value: 'A bot that provides detailed information about Boom Beach terminology, stats, and prototype troops.' },
                { name: 'Open Source', value: 'https://github.com/Otheruser325/BoomDictionary' }
            )
            .setTimestamp()
            .setFooter({
                text: `Page ${page} of ${patchNotes.length} | Thank you for using our bot!`,
                iconURL: interaction.user.displayAvatarURL()
            });

        await interaction.reply({ embeds: [embed] });
    },
};