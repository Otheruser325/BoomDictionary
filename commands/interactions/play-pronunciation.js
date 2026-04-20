import { reportExecutionError } from '../../utils/errorHandling.js';
import { playPronunciation } from '../../utils/pronunciationPlayback.js';

export const customIdPrefix = 'play-pronunciation-';
export const global = true;

export async function execute(interaction) {
    if (!interaction.isButton()) return;

    const { customId } = interaction;
    if (!customId.startsWith(customIdPrefix)) return;

    try {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({
                ephemeral: true,
            });
        }

        const term = decodeURIComponent(customId.slice(customIdPrefix.length));
        const { details, targetChannel } = await playPronunciation(interaction, term);

        await interaction.editReply({
            content: `Now playing **${details.displayName}** in **${targetChannel.name}**.`,
        });
    } catch (error) {
        return reportExecutionError({
            error,
            fallbackMessage: error instanceof Error ?
                error.message :
                'Failed to play pronunciation. Please try again later.',
            interaction,
            scope: 'interaction-play-pronunciation-failed',
        });
    }
}
