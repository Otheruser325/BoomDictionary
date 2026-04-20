import { PermissionsBitField } from 'discord.js';
import { setVoiceChannel } from '../../utils/voiceChannelConfig.js';

export async function executeConfigCommand(interaction) {
    if (!interaction.guild || !interaction.member) {
        return interaction.reply({
            content: 'This command can only be used inside a server.',
            ephemeral: true,
        });
    }

    const selectedChannel = interaction.options.getChannel('channel');
    const member = interaction.member;
    const memberVoiceChannel = interaction.member.voice?.channel ?? null;
    const channel = selectedChannel ?? memberVoiceChannel ?? null;

    if (!member.permissions.has(PermissionsBitField.Flags.Administrator) &&
        !member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return interaction.reply({
            content: 'You do not have permission to use this command.',
            ephemeral: true,
        });
    }

    if (!channel?.isVoiceBased()) {
        return interaction.reply({
            content: 'Join the voice channel you want me to use, or choose one explicitly with /config channel:<voice channel>.',
            ephemeral: true,
        });
    }

    setVoiceChannel(interaction.guild.id, channel.id);

    return interaction.reply({
        content: `Configured pronunciation playback for **${channel.name}**. I will use that channel for IPA playback in this server.`,
        ephemeral: true,
    });
}
