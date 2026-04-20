import { SlashCommandBuilder } from 'discord.js';
import { reportExecutionError } from '../../utils/errorHandling.js';
import {
    buildIpaActionRow,
    buildIpaEmbed,
    getPronunciationDetails,
} from '../shared/dictionaryCommand.js';

export const data = new SlashCommandBuilder()
    .setName('ipa')
    .setDescription('Show the IPA pronunciation and play it in your server voice channel.')
    .addStringOption(option => option.setName('word')
        .setDescription('The word to get the pronunciation for')
        .setRequired(true));
export async function execute(interaction) {
    try {
        const rawTerm = interaction.options.getString('word');

        if (!rawTerm) {
            await interaction.reply({
                content: 'Please provide a word to get the pronunciation.',
                ephemeral: true
            });
            return;
        }

        const details = getPronunciationDetails(rawTerm);

        if (!details) {
            await interaction.reply({ content: `No pronunciation found for \`${rawTerm.toLowerCase()}\`.`, ephemeral: true });
            return;
        }

        await interaction.reply({
            embeds: [buildIpaEmbed(details)],
            components: [
                buildIpaActionRow(details, {
                    includePlaybackButton: Boolean(interaction.guildId),
                }),
            ],
        });
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'An error occurred while executing the IPA command. Please try again later.',
            interaction,
            scope: 'slash-ipa-execution-failed',
        });
    }
}
