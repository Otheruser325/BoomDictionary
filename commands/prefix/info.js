import { execute as executeSlash } from '../slash/info.js';
import { runPrefixCommandWithSlashAdapter } from '../shared/prefixMenuBridge.js';

export const name = 'info';
export const description = 'Get information about Boom Dictionary.';
export const permissions = ['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks'];
export const aliases = ['information', 'version', 'about'];
export const usage = '[page]';
export const exampleUsage = 'bd!info 2';
export const note = 'Provides information about the bot version and its developer.';

export function execute(message, args) {
    const page = Number.parseInt(args[0], 10);

    return runPrefixCommandWithSlashAdapter(
        message,
        {
            integers: {
                page: Number.isNaN(page) ? null : page,
            },
        },
        executeSlash
    );
}
