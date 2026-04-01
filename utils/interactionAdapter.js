function normalizePayload(payload, fallback = {}) {
    if (typeof payload === 'string') {
        return {
            ...fallback,
            content: payload,
        };
    }

    return {
        ...fallback,
        ...payload,
    };
}

function buildOptionsAccessor({
    channels = {},
    integers = {},
    strings = {},
    subcommand = null,
}) {
    return {
        getChannel(name) {
            return channels[name] ?? null;
        },
        getInteger(name) {
            return integers[name] ?? null;
        },
        getString(name) {
            return strings[name] ?? null;
        },
        getSubcommand() {
            return subcommand;
        },
    };
}

export function createMessageInteractionAdapter(
    message,
    optionValues = {},
    extra = {}
) {
    const adapter = {
        channel: message.channel,
        client: message.client,
        commandDisplayName: extra.commandDisplayName ?? null,
        customId: extra.customId ?? null,
        deferred: false,
        guild: message.guild,
        member: message.member,
        options: buildOptionsAccessor(optionValues),
        replied: false,
        type: extra.type ?? 'message-adapter',
        user: message.author,
        async followUp(payload) {
            return message.reply(normalizePayload(payload));
        },
        async reply(payload) {
            const response = await message.reply(normalizePayload(payload));
            adapter.replied = true;
            return response;
        },
    };

    return adapter;
}

export function createComponentExecutionAdapter(
    interaction,
    optionValues = {},
    extra = {}
) {
    const adapter = {
        channel: interaction.channel,
        client: interaction.client,
        commandDisplayName: extra.commandDisplayName ?? null,
        customId: interaction.customId,
        deferred: interaction.deferred,
        guild: interaction.guild,
        member: interaction.member,
        options: buildOptionsAccessor(optionValues),
        replied: interaction.replied,
        type: extra.type ?? interaction.type,
        user: interaction.user,
        async followUp(payload) {
            return interaction.followUp(
                normalizePayload(payload, {
                    ephemeral: true,
                })
            );
        },
        async reply(payload) {
            const normalizedPayload = normalizePayload(payload, {
                components: [],
            });

            const response = await interaction.update(normalizedPayload);
            adapter.replied = true;
            return response;
        },
    };

    return adapter;
}
