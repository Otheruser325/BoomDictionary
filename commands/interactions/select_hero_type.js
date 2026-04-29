import { EmbedBuilder } from 'discord.js';
import { reportExecutionError } from '../../utils/errorHandling.js';
import {
    buildHeroLevelComponents,
    getHero,
} from '../shared/heroCommand.js';

export const customId = 'select_hero_type';

export async function execute(interaction) {
    const selectedHeroType = interaction.values[0];
    const heroData = getHero(selectedHeroType);

    if (!heroData) {
        return interaction.reply({ content: 'No data found for the selected hero type.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle(`Select a Level for ${heroData.name}`)
        .setDescription('Please choose a level to view its details.')
        .setColor('#00b894');

    try {
        await interaction.update({
            embeds: [embed],
            components: buildHeroLevelComponents(selectedHeroType),
        });
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: 'There was an issue processing your request. Please try again.',
            interaction,
            scope: 'interaction-hero-type-failed',
        });
    }
}
