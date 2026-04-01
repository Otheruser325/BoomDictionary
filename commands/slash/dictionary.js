import { SlashCommandBuilder } from 'discord.js';
import { reportExecutionError } from '../../utils/errorHandling.js';
import {
    buildDictionaryCategoriesEmbed,
    buildDictionaryEntryEmbed,
    findDictionaryEntry,
    getRandomDictionaryEntry,
} from '../shared/dictionaryCommand.js';

export const data = new SlashCommandBuilder()
    .setName('dictionary')
    .setDescription('Look up definitions related to Boom Beach.')
    .addSubcommand(subcommand => subcommand
        .setName('define')
        .setDescription('Get the definition of a word or phrase')
        .addStringOption(option => option.setName('term')
            .setDescription('The word or phrase to define')
            .setRequired(true))
    )
    .addSubcommand(subcommand => subcommand
        .setName('categories')
        .setDescription('View categories and their descriptions')
    )
    .addSubcommand(subcommand => subcommand
        .setName('random')
        .setDescription('Get a random term from any category')
    );
export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
        if (subcommand === 'define') {
            const term = interaction.options.getString('term');
            const entry = findDictionaryEntry(term);

            if (!entry) {
                await interaction.reply({
                    content: `No definition found for \`${term.toLowerCase()}\`.`,
                    ephemeral: true
                });
                return;
            }

            await interaction.reply({
                embeds: [buildDictionaryEntryEmbed(entry)]
            });
        } else if (subcommand === 'categories') {
            await interaction.reply({
                embeds: [buildDictionaryCategoriesEmbed()]
            });
        } else if (subcommand === 'random') {
            const entry = getRandomDictionaryEntry();

            if (!entry) {
                await interaction.reply({
                    content: 'No terms available.',
                    ephemeral: true
                });
                return;
            }

            await interaction.reply({
                embeds: [buildDictionaryEntryEmbed(entry, {
                    categoryLabel: 'Random',
                })]
            });
        }
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'An error occurred while executing the dictionary command. Please try again later.',
            interaction,
            scope: 'slash-dictionary-execution-failed',
        });
    }
}
