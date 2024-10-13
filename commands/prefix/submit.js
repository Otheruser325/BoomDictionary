const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const developerId = '822964244697710612'; // Otheruser325 (developer)
const restrictedUsers = new Map(); // Track restricted users with offenses

// List of banned words to filter
const bannedWords = [
    'fuck',
    'fucking',
    'fucker',
    'fck',
    'fuk',
    'motherfucker',
    'cunt',
    'shit',
    'sh1t',
    'bullshit',
    'bullsh1t',
    'dogshit',
    'dogsh1t',
    'piss',
    'p1ss',
    'slag',
    'fag',
    'faggy',
    'fagger',
    'faggot',
    'kill yourself',
    'kys',
    'nsfw',
    'not safe for work',
    'not-safe-for-work',
    'nigga',
    'n1gga',
    'nigger',
    'n1gger'
];

module.exports = {
    name: 'submit',
    description: 'Submit a report or suggestion.',
    permissions: ['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks'],
    async execute(message, args) {
        try {
            const userId = message.author.id;

            // Check if the user is restricted from submitting
            if (restrictedUsers.has(userId)) {
                const userData = restrictedUsers.get(userId);
                const remainingTime = ((userData.expiration - Date.now()) / 1000 / 60).toFixed(1);
                if (remainingTime > 0) {
                    return message.reply(`You are restricted from submitting reports for another ${remainingTime} minutes.`);
                } else {
                    // Remove restriction after it has expired
                    restrictedUsers.delete(userId);
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('Submit a Report or Suggestion')
                .setDescription('Click the button below to submit your report or suggestion.')
                .setColor('#00AAFF');

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('submit-report')
                        .setLabel('Submit Report')
                        .setStyle(ButtonStyle.Primary)
                );

            const sentMessage = await message.reply({ embeds: [embed], components: [row] });

            const filter = interaction => interaction.customId === 'submit-report' && interaction.user.id === userId;
            const collector = sentMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

            collector.on('collect', async (interaction) => {
                if (interaction.customId !== 'submit-report') return;

                if (interaction.user.id !== userId) {
                    return interaction.reply({
                        content: `Only **${message.author.username}** can submit reports! Please use the ***bd!submit*** command to submit reports related to ideas and issues!`,
                        ephemeral: true
                    });
                }

                // Check again if the user is restricted before showing the modal
                if (restrictedUsers.has(userId)) {
                    const userData = restrictedUsers.get(userId);
                    const remainingTime = ((userData.expiration - Date.now()) / 1000 / 60).toFixed(1);
                    if (remainingTime > 0) {
                        return interaction.reply({
                            content: `You are restricted from submitting reports for another ${remainingTime} minutes.`,
                            ephemeral: true
                        });
                    } else {
                        // Remove restriction after it has expired
                        restrictedUsers.delete(userId);
                    }
                }

                const modal = new ModalBuilder()
                    .setCustomId('report-form')
                    .setTitle('Submit a Report');

                const reasonInput = new TextInputBuilder()
                    .setCustomId('report-reason')
                    .setLabel('Reason for Report')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const detailsInput = new TextInputBuilder()
                    .setCustomId('report-details')
                    .setLabel('Report Details')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                const actionRow1 = new ActionRowBuilder().addComponents(reasonInput);
                const actionRow2 = new ActionRowBuilder().addComponents(detailsInput);

                modal.addComponents(actionRow1, actionRow2);

                await interaction.showModal(modal);

                const modalFilter = (modalInteraction) => modalInteraction.customId === 'report-form' && modalInteraction.user.id === userId;
                interaction.client.once('interactionCreate', async (modalInteraction) => {
                    if (!modalFilter(modalInteraction)) return;

                    const reason = modalInteraction.fields.getTextInputValue('report-reason').toLowerCase();
                    const details = modalInteraction.fields.getTextInputValue('report-details').toLowerCase();

                    // Check for banned words in the report
                    const containsBadWords = bannedWords.some(word => reason.includes(word) || details.includes(word));

                    if (containsBadWords) {
                        // Track offenses and increment restriction duration
                        let offenses = 1;
                        let restrictionDuration = 5 * 60 * 1000; // Start with 5 minutes

                        if (restrictedUsers.has(userId)) {
                            offenses = restrictedUsers.get(userId).offenses + 1; // Increment offense count
                            restrictionDuration = offenses * 5 * 60 * 1000; // Add 5 minutes per offense
                        }

                        // Set the restriction for the user
                        restrictedUsers.set(userId, {
                            expiration: Date.now() + restrictionDuration,
                            offenses: offenses
                        });

                        // Inform the user about the restriction
                        return modalInteraction.reply({
                            content: `I couldn't send that report as you've used derogatory/pejorative language. You are now restricted from submitting reports for ${offenses * 5} minutes.`,
                            ephemeral: true
                        });
                    }

                    // Send report to the developer if no bad words are found
                    const developerUser = await interaction.client.users.fetch(developerId);
                    await developerUser.send(`New report submitted by ${modalInteraction.user.tag}:\n\n**Reason:** ${reason}\n**Details:** ${details}`);

                    await modalInteraction.reply({ content: 'Thank you for your report! It has been submitted.', ephemeral: true });
                });
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time' && collected.size === 0) {
                    try { 
                        await sentMessage.edit({ components: [] });
                    } catch (error) {
                        if (error.code === 10008) {
                            return message.channel.send(`The submit embed was deleted and couldn't be recovered, please try again later.`);
                        } else if (error.code === 10062) {
                            return message.channel.send(`My systematic networking is currently out of sync and timed out. Please try again later.`);
                        } else if (error.code === 40060) {
                            return message.channel.send("I couldn't reuse this interaction as I've already acknowledged it. Please try again later.");
                        } else if (error.status === 403 || error.status === 404 || error.status === 503 || error.status === 520) {
                            return message.channel.send(`An unexpected error occurred. Please try again later.`);
                        } else if (error.message.includes("Interaction was not replied")) {
                            return message.channel.send(`An interaction error occurred. Please try again later.`);
                        } else {
                            console.error('Error removing components:', error);
                        }
                    }
                }
            });
        } catch (error) {
            if (error.code === 10008) {
                return message.reply(`I couldn't fetch the data for the interaction ${interaction.customId || 'this interaction'}, please try again later.`);
            } else if (error.code === 10062) {
                return message.reply("My systematic networking is currently out of sync and timed out. Please try again later.");
            } else if (error.code === 40060) {
                return message.reply("I couldn't reuse this interaction as I've already acknowledged it. Please try again later.");
            } else if (error.status === 403 || error.status === 404 || error.status === 503 || error.status === 520) {
                return message.reply("An unexpected error occurred. Please try again later.");
            } else if (error.message.includes("Interaction was not replied")) {
                return message.reply("An interaction error occurred. Please try again later.");
            } else {
                console.error('Error executing submit command:', error);
                message.reply('An error occurred while executing the submit command. Please try again later.');
            }
        }
    }
};