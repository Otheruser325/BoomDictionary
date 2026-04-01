import {
    executePrefixHelp,
    prefixMeta,
} from '../shared/helpCommand.js';

export const name = prefixMeta.name;
export const description = prefixMeta.description;
export const permissions = prefixMeta.permissions;

export function execute(message) {
    return executePrefixHelp(message);
}
