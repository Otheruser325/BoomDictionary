import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { reportExecutionError } from '../../utils/errorHandling.js';
import { bannedWords, developerId, restrictedUsers } from '../../utils/submitManager.js';

function getRestrictionMessage(userId) {
    if (!restrictedUsers.has(userId)) {
        return null;
    }

    const userData = restrictedUsers.get(userId);
    const remainingTime = (
        (userData.expiration - Date.now()) /
        1000 /
        60
    ).toFixed(1);

    if (remainingTime > 0) {
        return `You are restricted from submitting reports for another ${remainingTime} minutes.`;
    }

    restrictedUsers.delete(userId);
    return null;
}

function applyLanguageRestriction(userId) {
    let offenses = 1;
    let restrictionDuration = 5 * 60 * 1000;

    if (restrictedUsers.has(userId)) {
        offenses = restrictedUsers.get(userId).offenses + 1;
        restrictionDuration = offenses * 5 * 60 * 1000;
    }

    restrictedUsers.set(userId, {
        expiration: Date.now() + restrictionDuration,
        offenses,
    });

    return offenses;
}

export async function executeSubmitCommand(interaction) {
    try {
        const userId = interaction.user.id;
        const commandDisplayName = interaction.commandDisplayName || '/submit';
        const restrictionMessage = getRestrictionMessage(userId);

        if (restrictionMessage) {
            return interaction.reply(restrictionMessage);
        }

        const embed = new EmbedBuilder()
            .setTitle('Submit a Report or Suggestion')
            .setDescription(
                'Click the button below to submit your report or suggestion.'
            )
            .setColor('#00AAFF');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('submit-report')
                .setLabel('Submit Report')
                .setStyle(ButtonStyle.Primary)
        );

        const sentMessage = await interaction.reply({
            embeds: [embed],
            components: [row],
            fetchReply: true,
        });

        const collector = sentMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            max: 1,
            time: 60000,
        });

        collector.on('collect', async (buttonInteraction) => {
            if (buttonInteraction.customId !== 'submit-report') {
                return;
            }

            if (buttonInteraction.user.id !== interaction.user.id) {
                return buttonInteraction.reply({
                    content: `Only **${interaction.user.username}** can submit reports. Please use **${commandDisplayName}** for your own report.`,
                    ephemeral: true,
                });
            }

            const updatedRestrictionMessage = getRestrictionMessage(userId);

            if (updatedRestrictionMessage) {
                return buttonInteraction.reply({
                    content: updatedRestrictionMessage,
                    ephemeral: true,
                });
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

            modal.addComponents(
                new ActionRowBuilder().addComponents(reasonInput),
                new ActionRowBuilder().addComponents(detailsInput)
            );

            await buttonInteraction.showModal(modal);

            try {
                const modalInteraction = await buttonInteraction.awaitModalSubmit({
                    filter: (candidate) =>
                        candidate.customId === 'report-form' &&
                        candidate.user.id === interaction.user.id,
                    time: 60000,
                });

                const reason = modalInteraction.fields.getTextInputValue('report-reason');
                const details = modalInteraction.fields.getTextInputValue('report-details');
                const normalizedReason = reason.toLowerCase();
                const normalizedDetails = details.toLowerCase();

                const containsBadWords = bannedWords.some(
                    (word) =>
                        normalizedReason.includes(word) ||
                        normalizedDetails.includes(word)
                );

                if (containsBadWords) {
                    const offenses = applyLanguageRestriction(userId);

                    await modalInteraction.reply({
                        content: `I couldn't send that report as you've used derogatory/pejorative language. You are now restricted from submitting reports for ${offenses * 5} minutes.`,
                        ephemeral: true,
                    });
                    return;
                }

                const developerUser = await buttonInteraction.client.users.fetch(developerId);
                await developerUser.send(
                    `New report submitted by ${modalInteraction.user.tag}:\n\n**Reason:** ${reason}\n**Details:** ${details}`
                );

                await modalInteraction.reply({
                    content: 'Thank you for your report! It has been submitted.',
                    ephemeral: true,
                });
            } catch (error) {
                if (error.code !== 'InteractionCollectorError') {
                    throw error;
                }
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason !== 'time' || collected.size > 0) {
                return;
            }

            try {
                await sentMessage.edit({
                    components: [],
                });
            } catch (error) {
                await reportExecutionError({
                    error,
                    fallbackMessage: 'I could not clean up the submit prompt.',
                    interaction,
                    scope: 'submit-cleanup-failed',
                });
            }
        });
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'An error occurred while executing the submit command. Please try again later.',
            interaction,
            scope: 'slash-submit-execution-failed',
        });
    }
}
