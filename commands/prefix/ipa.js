import { execute as executeSlash } from '../slash/ipa.js';
import { runPrefixCommandWithSlashAdapter } from '../shared/prefixMenuBridge.js';

export const name = 'ipa';
export const description = 'Get the pronunciation of a word.';
export const permissions = ['SEND_MESSAGES', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'];

export async function execute(message, args) {
    if (args.length === 0) {
        await message.reply('Please provide a word to get the pronunciation.');
        return;
    }

    return runPrefixCommandWithSlashAdapter(
        message,
        {
            strings: {
                word: args.join(' '),
            },
        },
        executeSlash
    );
}
