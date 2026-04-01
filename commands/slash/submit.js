import { SlashCommandBuilder } from 'discord.js';
import { executeSubmitCommand } from '../shared/submitCommand.js';

export const data = new SlashCommandBuilder()
    .setName('submit')
    .setDescription('Submit a report or suggestion.');

export async function execute(interaction) {
    return executeSubmitCommand(interaction);
}
