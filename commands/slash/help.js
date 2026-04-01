import {
    executeSlashHelp,
    slashData as data,
} from '../shared/helpCommand.js';

export { data };

export function execute(interaction) {
    return executeSlashHelp(interaction);
}
