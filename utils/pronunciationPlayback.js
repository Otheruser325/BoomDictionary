import {
    AudioPlayerStatus,
    NoSubscriberBehavior,
    StreamType,
    VoiceConnectionStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    getVoiceConnection,
    joinVoiceChannel,
} from '@discordjs/voice';
import { PermissionsBitField } from 'discord.js';
import { get } from 'https';
import { getPronunciationDetails } from '../commands/shared/dictionaryCommand.js';
import {
    clearVoiceChannel,
    getVoiceChannel,
} from './voiceChannelConfig.js';

const IDLE_DISCONNECT_MS = 5 * 60 * 1000;
const pronunciationSessions = new Map();

function destroySession(guildId) {
    const session = pronunciationSessions.get(guildId);

    if (!session) {
        return;
    }

    pronunciationSessions.delete(guildId);

    if (session.idleTimeout) {
        clearTimeout(session.idleTimeout);
    }

    try {
        session.player.stop(true);
    } catch {
        // Best-effort cleanup.
    }

    try {
        session.connection.destroy();
    } catch {
        // Best-effort cleanup.
    }

}

function scheduleIdleDisconnect(guildId) {
    const session = pronunciationSessions.get(guildId);

    if (!session) {
        return;
    }

    if (session.idleTimeout) {
        clearTimeout(session.idleTimeout);
    }

    session.idleTimeout = setTimeout(() => {
        destroySession(guildId);
    }, IDLE_DISCONNECT_MS);
}

async function fetchStreamFromUrl(url) {
    return new Promise((resolve, reject) => {
        const request = get(url, (response) => {
            if (response.statusCode !== 200) {
                response.resume();
                reject(new Error(`Failed to get file: ${response.statusCode}`));
                return;
            }

            resolve(response);
        });

        request.setTimeout(15_000, () => {
            request.destroy(new Error('Timed out while downloading pronunciation audio.'));
        });

        request.on('error', reject);
    });
}

async function resolveConfiguredChannel(interaction) {
    if (!interaction.guild) {
        return null;
    }

    const configuredChannelId = getVoiceChannel(interaction.guild.id);

    if (!configuredChannelId) {
        return null;
    }

    const configuredChannel = interaction.guild.channels.cache.get(configuredChannelId) ??
        await interaction.guild.channels.fetch(configuredChannelId).catch(() => null);

    if (!configuredChannel?.isVoiceBased()) {
        clearVoiceChannel(interaction.guild.id);
        return null;
    }

    return configuredChannel;
}

function validateTargetChannelPermissions(interaction, channel) {
    if (!interaction.guild) {
        return 'Pronunciation playback is only available inside servers.';
    }

    const botMember = interaction.guild.members.me;
    const permissions = botMember ? channel.permissionsFor(botMember) : null;

    if (!permissions?.has(PermissionsBitField.Flags.ViewChannel) ||
        !permissions.has(PermissionsBitField.Flags.Connect) ||
        !permissions.has(PermissionsBitField.Flags.Speak)) {
        return `I need permission to view, connect to, and speak in ${channel.name}.`;
    }

    return null;
}

function getOrCreateSession(guild, targetChannel) {
    const existingSession = pronunciationSessions.get(guild.id);
    const existingConnection = getVoiceConnection(guild.id);

    if (existingSession &&
        existingSession.connection.joinConfig.channelId === targetChannel.id) {
        if (existingSession.idleTimeout) {
            clearTimeout(existingSession.idleTimeout);
            existingSession.idleTimeout = null;
        }

        return existingSession;
    }

    if (existingSession) {
        destroySession(guild.id);
    } else if (existingConnection &&
        existingConnection.joinConfig.channelId !== targetChannel.id) {
        existingConnection.destroy();
    }

    const connection = joinVoiceChannel({
        adapterCreator: guild.voiceAdapterCreator,
        channelId: targetChannel.id,
        guildId: guild.id,
        selfDeaf: false,
    });

    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause,
        },
    });

    const session = {
        connection,
        idleTimeout: null,
        player,
    };

    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
        scheduleIdleDisconnect(guild.id);
    });

    player.on('error', () => {
        destroySession(guild.id);
    });

    connection.on('error', () => {
        destroySession(guild.id);
    });

    connection.on(VoiceConnectionStatus.Disconnected, () => {
        destroySession(guild.id);
    });

    pronunciationSessions.set(guild.id, session);
    return session;
}

function createPronunciationResource(stream) {
    return createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
    });
}

function normalizePlaybackError(error) {
    if (error?.code === 'ABORT_ERR' || error?.name === 'AbortError') {
        return new Error(
            'Pronunciation playback timed out while preparing the audio stream. Please try again.'
        );
    }

    return error;
}

export async function playPronunciation(interaction, term) {
    const details = getPronunciationDetails(term);

    if (!details) {
        throw new Error(`No pronunciation data found for ${term}.`);
    }

    if (!interaction.guild) {
        throw new Error('Pronunciation playback is only available in servers because I need a voice channel.');
    }

    const memberVoiceChannel = interaction.member?.voice?.channel ?? null;
    const configuredChannel = await resolveConfiguredChannel(interaction);
    const targetChannel = configuredChannel ?? memberVoiceChannel;

    if (!targetChannel?.isVoiceBased()) {
        throw new Error(
            'No usable voice channel is configured. Use /config while connected to the server voice channel you want me to use, or join one before pressing play.'
        );
    }

    if (!configuredChannel && !memberVoiceChannel) {
        throw new Error(
            'Join a voice channel first, then use /config once to save it for this server.'
        );
    }

    const permissionError = validateTargetChannelPermissions(interaction, targetChannel);

    if (permissionError) {
        throw new Error(permissionError);
    }

    try {
        const session = getOrCreateSession(interaction.guild, targetChannel);

        await entersState(session.connection, VoiceConnectionStatus.Ready, 15_000);

        const stream = await fetchStreamFromUrl(details.audioUrl);
        const resource = createPronunciationResource(stream);

        if (session.idleTimeout) {
            clearTimeout(session.idleTimeout);
            session.idleTimeout = null;
        }

        session.player.play(resource);

        return {
            details,
            targetChannel,
        };
    } catch (error) {
        throw normalizePlaybackError(error);
    }
}
