import { PermissionsBitField } from 'discord.js';
import { setVoiceChannel } from '../../utils/voiceChannelConfig.js';

export async function executeConfigCommand(interaction) {
    if (!interaction.guild || !interaction.member) {
        return interaction.reply({
            content: 'This command can only be used inside a server.',
            ephemeral: true,
        });
    }

    const channel = interaction.options.getChannel('channel');
    const member = interaction.member;

    if (!member.permissions.has(PermissionsBitField.Flags.Administrator) &&
        !member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return interaction.reply({
            content: 'You do not have permission to use this command.',
            ephemeral: true,
        });
    }

    if (!channel || channel.type !== 2) {
        return interaction.reply({
            content: 'Please select a valid voice channel.',
            ephemeral: true,
        });
    }

    setVoiceChannel(interaction.guild.id, channel.id);

    return interaction.reply({
        content: `Configured the bot to join ${channel.name} for pronunciation playback.`,
        ephemeral: true,
    });
}
