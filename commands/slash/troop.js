import { SlashCommandBuilder } from 'discord.js';
import { reportExecutionError } from '../../utils/errorHandling.js';
import { troopChoices } from '../shared/choices.js';
import {
    buildTroopEmbed,
    validateTroopRequest,
} from '../shared/troopCommand.js';

export const data = new SlashCommandBuilder()
    .setName('troop')
    .setDescription('Get statistics for a specific type of troop.')
    .addStringOption((option) => option
        .setName('troop_type')
        .setDescription('Type of troop')
        .setRequired(true)
        .addChoices(...troopChoices)
    )
    .addIntegerOption((option) => option
        .setName('level')
        .setDescription('Level of the troop')
        .setRequired(true)
    );
export async function execute(interaction) {
    try {
        const troopType = interaction.options.getString('troop_type');
        const level = interaction.options.getInteger('level');
        const validationError = validateTroopRequest(troopType, level);

        if (validationError) {
            return interaction.reply({
                content: validationError,
                ephemeral: true,
            });
        }

        await interaction.reply({
            embeds: [buildTroopEmbed(troopType, level)],
        });
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'An error occurred while executing the troop command. Please try again later.',
            interaction,
            scope: 'slash-troop-execution-failed',
        });
    }
}
