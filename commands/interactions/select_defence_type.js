import { EmbedBuilder } from 'discord.js';
import { reportExecutionError } from '../../utils/errorHandling.js';
import {
    buildDefenceLevelComponents,
    getDefence,
} from '../shared/defenceCommand.js';

export const customId = 'select_defence_type';
export async function execute(interaction) {
    const selectedDefenceType = interaction.values[0];
    const defenceData = getDefence(selectedDefenceType);

    if (!defenceData) {
        return interaction.reply({ content: 'Invalid defence type selected!', ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle(`Select a Level for ${defenceData.name}`)
        .setDescription('Please choose a level to view its details.')
        .setColor('#0099ff');

    try {
        await interaction.update({
            embeds: [embed],
            components: buildDefenceLevelComponents(selectedDefenceType),
        });
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'There was an issue processing your request. Please try again.',
            interaction,
            scope: 'interaction-defence-type-failed',
        });
    }
}
