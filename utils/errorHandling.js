function buildErrorMetadata(error) {
    return {
        code: error?.code ?? null,
        message: error?.message ?? String(error),
        name: error?.name ?? typeof error,
        status: error?.status ?? null,
    };
}

function isTransientDiscordNetworkError(error) {
    const message = typeof error?.message === 'string' ? error.message : '';

    return ['ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT'].includes(error?.code) &&
        /discord\.(gg|media)|gateway/i.test(message);
}

function isIdentifyThrottleWarning(error) {
    const message = typeof error?.message === 'string' ? error.message : '';
    const stack = typeof error?.stack === 'string' ? error.stack : '';

    return error?.name === 'TimeoutNegativeWarning' &&
        message.includes('negative number') &&
        stack.includes('SimpleIdentifyThrottler');
}

function shouldPrintStack(scope, error) {
    if (scope === 'process-warning' && isIdentifyThrottleWarning(error)) {
        return false;
    }

    if (scope === 'discord-shard-error' && isTransientDiscordNetworkError(error)) {
        return false;
    }

    return true;
}

export function logError(scope, error, metadata = {}) {
    const timestamp = new Date().toISOString();
    const payload = {
        ...metadata,
        error: buildErrorMetadata(error),
    };

    console.error(`[${timestamp}] ${scope}`, payload);

    if (error instanceof Error && error.stack && shouldPrintStack(scope, error)) {
        console.error(error.stack);
    } else if (!(error instanceof Error)) {
        console.error(error);
    }
}

export function getFriendlyErrorMessage(
    error,
    fallbackMessage = 'An unexpected error occurred. Please try again later.'
) {
    if (error?.code === 10008) {
        return 'The original bot response could not be found. Please try again.';
    }

    if (error?.code === 10062) {
        return 'The interaction timed out before I could finish processing it. Please try again.';
    }

    if (error?.code === 40060) {
        return 'That interaction was already acknowledged. Please try again.';
    }

    if ([403, 404, 503, 520].includes(error?.status)) {
        return 'Discord could not complete that request right now. Please try again later.';
    }

    if (typeof error?.message === 'string' &&
        error.message.includes('Interaction was not replied')) {
        return 'The interaction expired before I could answer. Please try again.';
    }

    return fallbackMessage;
}

export async function safelyReplyToMessage(message, payload) {
    const replyPayload = typeof payload === 'string' ? {
        content: payload,
    } : payload;

    try {
        return await message.reply(replyPayload);
    } catch (replyError) {
        logError('message-reply-failed', replyError, {
            channelId: message.channelId,
            messageId: message.id,
        });
        return null;
    }
}

export async function safelyReplyToInteraction(interaction, payload) {
    const replyPayload = typeof payload === 'string' ? {
        content: payload,
        ephemeral: true,
    } : {
        ephemeral: true,
        ...payload,
    };

    try {
        if (interaction.deferred && !interaction.replied) {
            return await interaction.editReply(replyPayload);
        }

        if (interaction.replied) {
            return await interaction.followUp(replyPayload);
        }

        return await interaction.reply(replyPayload);
    } catch (replyError) {
        logError('interaction-reply-failed', replyError, {
            customId: interaction.customId ?? null,
            interactionType: interaction.type,
        });
        return null;
    }
}

export async function reportExecutionError({
    error,
    fallbackMessage,
    interaction,
    message,
    metadata = {},
    scope,
}) {
    logError(scope, error, metadata);

    const userMessage = getFriendlyErrorMessage(error, fallbackMessage);

    if (interaction) {
        return safelyReplyToInteraction(interaction, {
            content: userMessage,
            ephemeral: true,
        });
    }

    if (message) {
        return safelyReplyToMessage(message, userMessage);
    }

    return null;
}

export function attachProcessErrorHandlers(client) {
    const flag = Symbol.for('boomdictionary.process-error-handlers');

    if (!globalThis[flag]) {
        const originalEmitWarning = process.emitWarning.bind(process);

        process.emitWarning = function patchedEmitWarning(warning, ...args) {
            if (warning instanceof Error && isIdentifyThrottleWarning(warning)) {
                process.emit('warning', warning);
                return;
            }

            return originalEmitWarning(warning, ...args);
        };

        process.on('uncaughtException', (error) => {
            logError('uncaught-exception', error);
        });

        process.on('unhandledRejection', (reason) => {
            logError('unhandled-rejection', reason);
        });

        process.on('warning', (warning) => {
            if (isIdentifyThrottleWarning(warning)) {
                logError('process-warning', warning, {
                    note: 'Discord identify throttling produced a transient negative timeout. This usually happens after clock drift, sleep/hibernate, or a flaky network, and the gateway should retry automatically.',
                });
                return;
            }

            logError('process-warning', warning);
        });

        globalThis[flag] = true;
    }

    if (client && !client.__boomDictionaryErrorHandlersAttached) {
        client.on('error', (error) => {
            logError('discord-client-error', error);
        });

        client.on('shardError', (error, shardId) => {
            if (isTransientDiscordNetworkError(error)) {
                logError('discord-shard-error', error, {
                    note: 'Discord gateway DNS/connectivity failed temporarily. The client should reconnect automatically once the network recovers.',
                    shardId,
                });
                return;
            }

            logError('discord-shard-error', error, {
                shardId,
            });
        });

        client.__boomDictionaryErrorHandlersAttached = true;
    }
}
