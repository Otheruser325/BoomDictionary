import { EmbedBuilder } from 'discord.js';
import { reportExecutionError } from '../../utils/errorHandling.js';
import {
    buildTroopLevelComponents,
    getTroop,
} from '../shared/troopCommand.js';

export const customId = 'select_troop_type';
export async function execute(interaction) {
    const selectedTroopType = interaction.values[0];
    const troopData = getTroop(selectedTroopType);

    if (!troopData) {
        return interaction.reply({ content: 'No data found for the selected troop type.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle(`Select a Level for ${troopData.name}`)
        .setDescription('Please choose a level to view its details.')
        .setColor('#0099ff');

    try {
        await interaction.update({
            embeds: [embed],
            components: buildTroopLevelComponents(selectedTroopType),
        });
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'There was an issue processing your request. Please try again.',
            interaction,
            scope: 'interaction-troop-type-failed',
        });
    }
}
