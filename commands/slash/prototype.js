import { SlashCommandBuilder } from 'discord.js';
import {
    prototypeDefenceChoices,
    prototypeTroopChoices,
} from '../shared/choices.js';
import { executePrototypeCommand } from '../shared/prototypeCommand.js';
import { reportExecutionError } from '../../utils/errorHandling.js';

export const data = new SlashCommandBuilder()
    .setName('prototype')
    .setDescription('Get statistics for a prototype defence or troop.')
    .addSubcommand(subcommand => subcommand
        .setName('defence')
        .setDescription('Get statistics for a prototype defence.')
        .addStringOption(option => option.setName('protodefence_type')
            .setDescription('Type of prototype defence')
            .setRequired(true)
            .addChoices(...prototypeDefenceChoices)
        )
        .addIntegerOption(option => option.setName('level')
            .setDescription('Level of the prototype defence')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand => subcommand
        .setName('troop')
        .setDescription('Get statistics for a prototype troop.')
        .addStringOption(option => option.setName('prototroop_type')
            .setDescription('Type of prototype troop')
            .setRequired(true)
            .addChoices(...prototypeTroopChoices)
        )
        .addIntegerOption(option => option.setName('level')
            .setDescription('Level of the prototype troop')
            .setRequired(true)
        )
    );

export async function execute(interaction) {
    try {
        return await executePrototypeCommand(interaction);
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'An error occurred while executing the prototype command. Please try again later.',
            interaction,
            scope: 'slash-prototype-execution-failed',
        });
    }
}
