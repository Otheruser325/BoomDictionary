import { SlashCommandBuilder } from '@discordjs/builders';
import { executePingCommand } from '../shared/pingCommand.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!');
export async function execute(interaction) {
    return executePingCommand(interaction);
}
