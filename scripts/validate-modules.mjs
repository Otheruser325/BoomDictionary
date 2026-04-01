import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
    loadDirectoryModules,
    resolveInteractionHandler,
    resolvePrefixCommand,
    resolveSlashCommand,
} from '../utils/moduleRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function main() {
    const prefixCommands = await loadDirectoryModules(
        join(projectRoot, 'commands/prefix'),
        resolvePrefixCommand
    );
    const slashCommands = await loadDirectoryModules(
        join(projectRoot, 'commands/slash'),
        resolveSlashCommand
    );
    const interactionHandlers = await loadDirectoryModules(
        join(projectRoot, 'commands/interactions'),
        resolveInteractionHandler
    );

    assertUnique(
        prefixCommands.flatMap((command) => [
            command.name,
            ...command.aliases,
        ]),
        'prefix command name or alias'
    );
    assertUnique(
        slashCommands.map((command) => command.name),
        'slash command name'
    );
    assertUnique(
        interactionHandlers
            .filter((handler) => handler.global && handler.customId)
            .map((handler) => handler.customId),
        'global interaction customId'
    );
    assertUnique(
        interactionHandlers
            .filter((handler) => handler.global && handler.customIdPrefix)
            .map((handler) => handler.customIdPrefix),
        'global interaction customIdPrefix'
    );

    console.log(
        `Validated ${prefixCommands.length} prefix commands, ${slashCommands.length} slash commands, and ${interactionHandlers.length} interaction handlers.`
    );
}

function assertUnique(values, label) {
    const duplicates = values.filter(
        (value, index) => values.indexOf(value) !== index
    );

    if (duplicates.length > 0) {
        throw new Error(
            `Duplicate ${label}s found: ${[...new Set(duplicates)].join(', ')}`
        );
    }
}

main().catch((error) => {
    console.error('Module validation failed.');
    console.error(error instanceof Error ? error.stack : error);
    process.exit(1);
});
