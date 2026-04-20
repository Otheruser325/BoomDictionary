import { SlashCommandBuilder } from 'discord.js';
import { reportExecutionError } from '../../utils/errorHandling.js';
import {
    executeGunboatCommand,
} from '../shared/gunboatCommand.js';
import {
    gunboatChoices,
    temporaryGunboatChoices,
} from '../shared/choices.js';

export const data = new SlashCommandBuilder()
    .setName('gunboat')
    .setDescription('Get statistics for a standard or temporary gunboat ability.')
    .addSubcommand(subcommand => subcommand
        .setName('normal')
        .setDescription('Get statistics for a standard gunboat ability.')
        .addStringOption(option => option.setName('ability_type')
            .setDescription('Type of standard gunboat ability')
            .setRequired(true)
            .addChoices(...gunboatChoices)
        )
        .addIntegerOption(option => option.setName('level')
            .setDescription('Level of the gunboat ability')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand => subcommand
        .setName('temporary')
        .setDescription('Get statistics for a temporary gunboat ability.')
        .addStringOption(option => option.setName('ability_type')
            .setDescription('Type of temporary gunboat ability')
            .setRequired(true)
            .addChoices(...temporaryGunboatChoices)
        )
        .addIntegerOption(option => option.setName('level')
            .setDescription('Armory-scaled level of the temporary ability when applicable')
            .setRequired(false)
        )
    );

export async function execute(interaction) {
    try {
        return await executeGunboatCommand(interaction);
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'An error occurred while executing the gunboat command. Please try again later.',
            interaction,
            scope: 'slash-gunboat-execution-failed',
        });
    }
}
