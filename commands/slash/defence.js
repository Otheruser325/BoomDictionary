import { SlashCommandBuilder } from 'discord.js';
import { reportExecutionError } from '../../utils/errorHandling.js';
import { defenceChoices } from '../shared/choices.js';
import {
    buildDefenceEmbed,
    validateDefenceRequest,
} from '../shared/defenceCommand.js';

export const data = new SlashCommandBuilder()
    .setName('defence')
    .setDescription('Get statistics for a specific type of defence.')
    .addStringOption(option => option.setName('defence_type')
        .setDescription('Type of defence')
        .setRequired(true)
        .addChoices(...defenceChoices)
    )
    .addIntegerOption(option => option.setName('level')
        .setDescription('Level of the defence')
        .setRequired(true)
    );
export async function execute(interaction) {
    try {
        const defenceType = interaction.options.getString('defence_type');
        const level = interaction.options.getInteger('level');
        const validationError = validateDefenceRequest(defenceType, level);

        if (validationError) {
            return interaction.reply({
                content: validationError,
                ephemeral: true
            });
        }

        await interaction.reply({
            embeds: [buildDefenceEmbed(defenceType, level)]
        });
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'An error occurred while executing the defence command. Please try again later.',
            interaction,
            scope: 'slash-defence-execution-failed',
        });
    }
}
