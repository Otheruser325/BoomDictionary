import { readdirSync } from 'fs';
import { pathToFileURL } from 'url';
import { basename, join } from 'path';

function normalizeModuleExports(moduleNamespace) {
    if (!moduleNamespace || typeof moduleNamespace !== 'object') {
        return {};
    }

    if (
        moduleNamespace.default &&
        typeof moduleNamespace.default === 'object' &&
        !Array.isArray(moduleNamespace.default)
    ) {
        return {
            ...moduleNamespace.default,
            ...moduleNamespace,
        };
    }

    return moduleNamespace;
}

function requireFunction(value, exportName, filePath) {
    if (typeof value !== 'function') {
        throw new Error(
            `Expected ${exportName} to be a function in ${basename(filePath)}.`
        );
    }

    return value;
}

function requireString(value, exportName, filePath) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(
            `Expected ${exportName} to be a non-empty string in ${basename(filePath)}.`
        );
    }

    return value;
}

export function getJavaScriptFiles(directoryPath) {
    return readdirSync(directoryPath)
        .filter((fileName) => fileName.endsWith('.js'))
        .sort((left, right) => left.localeCompare(right))
        .map((fileName) => join(directoryPath, fileName));
}

export async function importProjectModule(filePath) {
    const moduleNamespace = await import(pathToFileURL(filePath).href);
    return normalizeModuleExports(moduleNamespace);
}

export async function loadDirectoryModules(directoryPath, resolver) {
    const modules = [];

    for (const filePath of getJavaScriptFiles(directoryPath)) {
        const moduleExports = await importProjectModule(filePath);
        modules.push(resolver(moduleExports, filePath));
    }

    return modules;
}

export function resolvePrefixCommand(moduleExports, filePath) {
    const name = requireString(moduleExports.name, 'name', filePath);
    const execute = requireFunction(moduleExports.execute, 'execute', filePath);
    const aliases = Array.isArray(moduleExports.aliases) ?
        moduleExports.aliases :
        [];

    return {
        aliases,
        execute,
        filePath,
        module: moduleExports,
        name,
    };
}

export function resolveSlashCommand(moduleExports, filePath) {
    const data = moduleExports.data;
    const execute = requireFunction(moduleExports.execute, 'execute', filePath);
    const name = requireString(data?.name, 'data.name', filePath);

    return {
        data,
        execute,
        filePath,
        module: moduleExports,
        name,
    };
}

export function resolveInteractionHandler(moduleExports, filePath) {
    const customId = moduleExports.customId;
    const customIdPrefix = moduleExports.customIdPrefix;

    if (!customId && !customIdPrefix) {
        throw new Error(
            `Expected customId or customIdPrefix in ${basename(filePath)}.`
        );
    }

    if (customId) {
        requireString(customId, 'customId', filePath);
    }

    if (customIdPrefix) {
        requireString(customIdPrefix, 'customIdPrefix', filePath);
    }

    return {
        customId,
        customIdPrefix,
        filePath,
        global: moduleExports.global === true,
        module: {
            ...moduleExports,
            execute: requireFunction(moduleExports.execute, 'execute', filePath),
        },
    };
}
