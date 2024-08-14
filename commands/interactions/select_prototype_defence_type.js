const { EmbedBuilder } = require('discord.js');
const prototypeDefences = require('../../data/prototypeDefences.json');
const { formatNumber } = require('../../utils/formatNumber');

module.exports = {
    customId: 'select_prototype_defence_type',
    async execute(interaction) {
        if (!interaction.isStringSelectMenu()) return;

        const { customId, values } = interaction;

        if (customId === 'select_prototype_defence_type') {
            const selectedDefenceType = values[0];
            const defenceTypeKey = selectedDefenceType.toLowerCase();
            const mappedDefenceType = {
                'doom cannon': 'doom_cannon',
                'shock blaster': 'shock_blaster',
                'lazor beam': 'lazor_beam',
                'hot pot': 'hot_pot',
                'shield generator': 'shield_generator',
                'damage amplifier': 'damage_amplifier'
            }[defenceTypeKey];

            const defenceData = prototypeDefences[mappedDefenceType];

            if (!defenceData) {
                return interaction.reply({ content: 'No data found for the selected prototype defence type.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle(`${defenceData.name}`)
                .setDescription(defenceData.description || 'No description available.')
                .addFields(
                    { name: 'Max Level', value: defenceData.maxLevel.toString(), inline: true },
                    { name: 'Attack Speed', value: defenceData.attackSpeed.toString(), inline: true },
                    { name: 'Range', value: defenceData.range.toString(), inline: true }
                )
                .setColor('#0099ff');

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
