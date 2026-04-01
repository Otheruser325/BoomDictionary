import { execute as executeSlash } from '../slash/submit.js';
import { runPrefixCommandWithSlashAdapter } from '../shared/prefixMenuBridge.js';

export const name = 'submit';
export const description = 'Submit a report or suggestion.';
export const permissions = ['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks'];

export function execute(message) {
    return runPrefixCommandWithSlashAdapter(
        message,
        {},
        executeSlash,
        {
            commandDisplayName: 'bd!submit',
        }
    );
}
