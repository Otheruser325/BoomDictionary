import {
    AudioPlayerStatus,
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
import { getVoiceChannel } from './voiceChannelConfig.js';

async function fetchStreamFromUrl(url) {
    return new Promise((resolve, reject) => {
        get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get file: ${response.statusCode}`));
                return;
            }

            resolve(response);
        }).on('error', reject);
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

    return interaction.guild.channels.cache.get(configuredChannelId) ??
        await interaction.guild.channels.fetch(configuredChannelId).catch(() => null);
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
        throw new Error('No usable voice channel is configured or joined.');
    }

    if (configuredChannel && memberVoiceChannel?.id !== configuredChannel.id) {
        throw new Error(`Join ${configuredChannel.name} to use pronunciation playback in this server.`);
    }

    if (!configuredChannel && !memberVoiceChannel) {
        throw new Error('Join a voice channel first or configure one with /config.');
    }

    const permissionError = validateTargetChannelPermissions(interaction, targetChannel);

    if (permissionError) {
        throw new Error(permissionError);
    }

    const existingConnection = getVoiceConnection(interaction.guild.id);

    if (existingConnection &&
        existingConnection.joinConfig.channelId !== targetChannel.id) {
        existingConnection.destroy();
    }

    const connection = joinVoiceChannel({
        adapterCreator: interaction.guild.voiceAdapterCreator,
        channelId: targetChannel.id,
        guildId: interaction.guild.id,
        selfDeaf: false,
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 15_000);

    const player = createAudioPlayer();
    const stream = await fetchStreamFromUrl(details.audioUrl);
    const resource = createAudioResource(stream);

    player.once(AudioPlayerStatus.Idle, () => {
        connection.destroy();
    });

    player.once('error', () => {
        connection.destroy();
    });

    connection.subscribe(player);
    player.play(resource);

    return {
        details,
        targetChannel,
    };
}
