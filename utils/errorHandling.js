function buildErrorMetadata(error) {
    return {
        code: error?.code ?? null,
        message: error?.message ?? String(error),
        name: error?.name ?? typeof error,
        status: error?.status ?? null,
    };
}

export function logError(scope, error, metadata = {}) {
    const timestamp = new Date().toISOString();
    const payload = {
        ...metadata,
        error: buildErrorMetadata(error),
    };

    console.error(`[${timestamp}] ${scope}`, payload);

    if (error instanceof Error && error.stack) {
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
        if (interaction.deferred || interaction.replied) {
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
        process.on('uncaughtException', (error) => {
            logError('uncaught-exception', error);
        });

        process.on('unhandledRejection', (reason) => {
            logError('unhandled-rejection', reason);
        });

        process.on('warning', (warning) => {
            logError('process-warning', warning);
        });

        globalThis[flag] = true;
    }

    if (client && !client.__boomDictionaryErrorHandlersAttached) {
        client.on('error', (error) => {
            logError('discord-client-error', error);
        });

        client.on('shardError', (error, shardId) => {
            logError('discord-shard-error', error, {
                shardId,
            });
        });

        client.__boomDictionaryErrorHandlersAttached = true;
    }
}
