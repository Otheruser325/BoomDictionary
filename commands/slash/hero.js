import { SlashCommandBuilder } from 'discord.js';
import { reportExecutionError } from '../../utils/errorHandling.js';
import { heroChoices } from '../shared/choices.js';
import {
    buildHeroEmbed,
    validateHeroRequest,
} from '../shared/heroCommand.js';

export const data = new SlashCommandBuilder()
    .setName('hero')
    .setDescription('Get statistics for a specific Boom Beach hero.')
    .addStringOption((option) => option
        .setName('hero_type')
        .setDescription('Type of hero')
        .setRequired(true)
        .addChoices(...heroChoices)
    )
    .addIntegerOption((option) => option
        .setName('level')
        .setDescription('Level of the hero')
        .setRequired(true)
    );

export async function execute(interaction) {
    try {
        const heroType = interaction.options.getString('hero_type');
        const level = interaction.options.getInteger('level');
        const validationError = validateHeroRequest(heroType, level);

        if (validationError) {
            return interaction.reply({
                content: validationError,
                ephemeral: true,
            });
        }

        await interaction.reply({
            embeds: [buildHeroEmbed(heroType, level)],
        });
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'An error occurred while executing the hero command. Please try again later.',
            interaction,
            scope: 'slash-hero-execution-failed',
        });
    }
}
