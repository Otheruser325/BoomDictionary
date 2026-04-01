import { execute as executeSlash } from '../slash/ping.js';
import { runPrefixCommandWithSlashAdapter } from '../shared/prefixMenuBridge.js';

export const name = 'ping';
export const description = 'Ping!';

export function execute(message) {
    return runPrefixCommandWithSlashAdapter(message, {}, executeSlash);
}
