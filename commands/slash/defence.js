const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');
const defences = require('../../data/defences.json');
const {
    formatNumber
} = require('../../utils/formatNumber');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('defence')
        .setDescription('Get statistics for a specific type of defence.')
        .addStringOption(option =>
            option.setName('defence_type')
            .setDescription('Type of defence')
            .setRequired(true)
            .addChoices({
                name: 'Sniper Tower',
                value: 'sniper_tower'
            }, {
                name: 'Machine Gun',
                value: 'machine_gun'
            }, {
                name: 'Mortar',
                value: 'mortar'
            }, {
                name: 'Cannon',
                value: 'cannon'
            }, {
                name: 'Flamethrower',
                value: 'flamethrower'
            }, {
                name: 'Boom Cannon',
                value: 'boom_cannon'
            }, {
                name: 'Rocket Launcher',
                value: 'rocket_launcher'
            }, {
                name: 'Critter Launcher',
                value: 'critter_launcher'
            }, {
                name: 'Shock Launcher',
                value: 'shock_launcher'
            })
        )
        .addIntegerOption(option =>
            option.setName('level')
            .setDescription('Level of the defence')
            .setRequired(true)
        ),
    async execute(interaction) {
        try {
            const defenceType = interaction.options.getString('defence_type');
            const level = interaction.options.getInteger('level');

            const defenceData = defences[defenceType];

            if (!defenceData) {
                return interaction.reply({
                    content: 'Invalid defence type!',
                    ephemeral: true
                });
            }

            if (level < 1 || level > (defenceData.maxLevel || 1)) {
                return interaction.reply({
                    content: `Invalid level! Please provide a level between 1 and ${defenceData.maxLevel}.`,
                    ephemeral: true
                });
            }

            const levelData = defenceData.levels[level];
            if (!levelData) {
                return interaction.reply({
                    content: `No data available for level ${level}.`,
                    ephemeral: true
                });
            }

            const stats = levelData.stats;
            const upgradeCost = levelData.upgradeCost || {
                wood: 0,
                stone: 0,
                iron: 0
            };
            const attackSpeed = defenceData.attackSpeed || 'Unknown';
            const range = defenceData.range || 'Unknown';
            const hqRequired = levelData.hqRequired || 'N/A';

            // Calculate DPS
            const dps = (stats.damage / (attackSpeed / 1000)).toFixed(2);

            const embedDefence = new EmbedBuilder()
                .setTitle(`${defenceData.name} - Level ${level}`)
                .setDescription(defenceData.description || 'No description available.')
                .setColor('#0099ff');

            if (levelData.image) {
                embedDefence.setThumbnail(levelData.image);
            }

            // Handle unique stats for certain defences
            if (defenceType === 'critter_launcher') {
                const crittersPerShot = 1;
                const crittersPerSecond = (crittersPerShot / (attackSpeed / 1000)).toFixed(2);

                embedDefence.addFields({
                    name: 'Health',
                    value: formatNumber(stats.health),
                    inline: true
                }, {
                    name: 'DPS',
                    value: formatNumber(dps),
                    inline: true
                }, {
                    name: 'Damage Per Shot',
                    value: formatNumber(stats.damage),
                    inline: true
                }, {
                    name: 'Range',
                    value: `${formatNumber(range)} Tiles`,
                    inline: true
                }, {
                    name: 'Attack Speed',
                    value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown',
                    inline: true
                }, {
                    name: 'Critters Per Shot',
                    value: formatNumber(crittersPerShot),
                    inline: true
                }, {
                    name: 'Critters Per Second',
                    value: formatNumber(crittersPerSecond),
                    inline: true
                }, {
                    name: 'Upgrade Cost',
                    value: `Wood: ${formatNumber(upgradeCost.wood)}\nStone: ${formatNumber(upgradeCost.stone)}\nIron: ${formatNumber(upgradeCost.iron)}`,
                    inline: true
                }, {
                    name: 'Upgrade Time',
                    value: `${levelData.upgradeTime.toString() || 'N/A'}`,
                    inline: true
                }, {
                    name: 'HQ Required',
                    value: hqRequired.toString(),
                    inline: true
                });
            } else if (defenceType === 'shock_launcher') {
                embedDefence.addFields({
                    name: 'Health',
                    value: formatNumber(stats.health),
                    inline: true
                }, {
                    name: 'DPS',
                    value: formatNumber(dps),
                    inline: true
                }, {
                    name: 'Damage Per Shot',
                    value: formatNumber(stats.damage),
                    inline: true
                }, {
                    name: 'Range',
                    value: `${formatNumber(range)} Tiles`,
                    inline: true
                }, {
                    name: 'Attack Speed',
                    value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown',
                    inline: true
                }, {
                    name: 'Shock Duration',
                    value: `${formatNumber(stats.stunDuration)} seconds`,
                    inline: true
                }, {
                    name: 'Upgrade Cost',
                    value: `Wood: ${formatNumber(upgradeCost.wood)}\nStone: ${formatNumber(upgradeCost.stone)}\nIron: ${formatNumber(upgradeCost.iron)}`,
                    inline: true
                }, {
                    name: 'Upgrade Time',
                    value: `${levelData.upgradeTime.toString() || 'N/A'}`,
                    inline: true
                }, {
                    name: 'HQ Required',
                    value: hqRequired.toString(),
                    inline: true
                });
            } else {
                // Handle general defence stats
                embedDefence.addFields({
                    name: 'Health',
                    value: formatNumber(stats.health),
                    inline: true
                }, {
                    name: 'DPS',
                    value: formatNumber(dps),
                    inline: true
                }, {
                    name: 'Damage Per Shot',
                    value: formatNumber(stats.damage),
                    inline: true
                }, {
                    name: 'Range',
                    value: `${formatNumber(range)} Tiles`,
                    inline: true
                }, {
                    name: 'Attack Speed',
                    value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown',
                    inline: true
                }, {
                    name: 'Upgrade Cost',
                    value: `Wood: ${formatNumber(upgradeCost.wood)}\nStone: ${formatNumber(upgradeCost.stone)}\nIron: ${formatNumber(upgradeCost.iron)}`,
                    inline: true
                }, {
                    name: 'Upgrade Time',
                    value: `${levelData.upgradeTime.toString() || 'N/A'}`,
                    inline: true
                }, {
                    name: 'HQ Required',
                    value: hqRequired.toString(),
                    inline: true
                });
            }

            await interaction.reply({
                embeds: [embedDefence]
            });
        } catch (error) {
            if (error.code === 10008) {
                return interaction.followUp(`The defence embed was deleted and couldn't be recovered, please try again later.`);
            } else if (error.code === 10062) {
                return interaction.followUp("My systematic networking is currently out of sync and timed out. Please try again later.");
            } else if (error.code === 40060) {
                return interaction.followUp("I couldn't reuse this interaction as I've already acknowledged it. Please try again later.");
            } else if (error.status === 403 || error.status === 404 || error.status === 503 || error.status === 520) {
                return interaction.followUp("An unexpected error occurred. Please try again later.");
            } else if (error.message.includes("Interaction was not replied")) {
                return interaction.followUp("An interaction error occurred. Please try again later.");
            } else {
                console.error('Error executing defence command:', error);
                interaction.reply('An error occurred while executing the defence command. Please try again later.');
            }
        }
    },
}