import { SlashCommandBuilder } from 'discord.js';
import { reportExecutionError } from '../../utils/errorHandling.js';
import {
    buildGunboatEmbed,
    validateGunboatRequest,
} from '../shared/gunboatCommand.js';
import { gunboatChoices } from '../shared/choices.js';

export const data = new SlashCommandBuilder()
    .setName('gunboat')
    .setDescription('Get statistics for a specific type of gunboat ability.')
    .addStringOption(option => option.setName('ability_type')
        .setDescription('Type of gunboat ability')
        .setRequired(true)
        .addChoices(...gunboatChoices)
    )
    .addIntegerOption(option => option.setName('level')
        .setDescription('Level of the gunboat ability')
        .setRequired(true)
    );
export async function execute(interaction) {
    try {
        const abilityType = interaction.options.getString('ability_type');
        const level = interaction.options.getInteger('level');
        const validationError = validateGunboatRequest(abilityType, level);

        if (validationError) {
            return interaction.reply({
                content: validationError,
                ephemeral: true,
            });
        }

        await interaction.reply({
            embeds: [buildGunboatEmbed(abilityType, level)]
        });
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'An error occurred while executing the gunboat command. Please try again later.',
            interaction,
            scope: 'slash-gunboat-execution-failed',
        });
    }
}
