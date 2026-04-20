import { execute as executeSlash } from '../slash/config.js';
import { runPrefixCommandWithSlashAdapter } from '../shared/prefixMenuBridge.js';

export const name = 'config';
export const description = 'Configure the voice channel for pronunciation playback.';
export const permissions = ['SEND_MESSAGES', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'];
export const usage = '[#voice-channel]';

export async function execute(message, args) {
    const channelId = args[0]?.replace(/[<#>]/g, '') ?? null;
    const channel = channelId ?
        message.guild?.channels.cache.get(channelId) :
        message.member?.voice?.channel ?? null;

    return runPrefixCommandWithSlashAdapter(
        message,
        {
            channels: {
                channel,
            },
        },
        executeSlash
    );
}
