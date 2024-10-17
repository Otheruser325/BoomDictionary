const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    PermissionsBitField,
    ComponentType
} = require('discord.js');
const defences = require('../../data/defences.json');
const {
    formatNumber
} = require('../../utils/formatNumber');

const validDefenceTypes = {
    'sniper tower': 'sniper_tower',
    'mortar': 'mortar',
    'machine gun': 'machine_gun',
    'cannon': 'cannon',
    'flamethrower': 'flamethrower',
    'boom cannon': 'boom_cannon',
    'rocket launcher': 'rocket_launcher',
    'critter launcher': 'critter_launcher',
    'shock launcher': 'shock_launcher'
};

module.exports = {
    name: 'defence',
    description: 'Get statistics for a specific type of defence.',
    permissions: ['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks'],
    aliases: ['defense'],
    args: false,

    async execute(message, args) {
        // Check bot permissions
        const botPermissions = message.channel.permissionsFor(message.guild.members.me);
        const requiredPermissions = new PermissionsBitField(['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks']);

        if (!botPermissions.has(requiredPermissions)) {
            return message.reply("I don't have the necessary permissions to execute this command. Please make sure I have `SEND_MESSAGES`, `VIEW_CHANNEL`, `READ_MESSAGE_HISTORY`, and `EMBED_LINKS` permissions.");
        }

        try {
            if (args.length === 0) {
                // Show defence types selection menu
                const defenceOptions = Object.keys(validDefenceTypes).map(defenceKey => {
                    const defence = defences[validDefenceTypes[defenceKey]];
                    const description = (defence && defence.description) ? defence.description.substring(0, 100) : 'No description available.';
                    return new StringSelectMenuOptionBuilder()
                        .setLabel(defenceKey.charAt(0).toUpperCase() + defenceKey.slice(1))
                        .setValue(validDefenceTypes[defenceKey])
                        .setDescription(description);
                });

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('select-defence-type')
                    .setPlaceholder('Select a defence type')
                    .addOptions(defenceOptions);

                const row = new ActionRowBuilder().addComponents(selectMenu);

                const embed = new EmbedBuilder()
                    .setTitle('Select a Defence Type')
                    .setDescription('Please choose a defence type to view its details.')
                    .setColor('#0099ff');

                const reply = await message.reply({
                    embeds: [embed],
                    components: [row]
                });

                const filter = interaction => interaction.user.id === message.author.id;
                const defenceCollector = reply.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    time: 30000
                });

                defenceCollector.on('collect', async (interaction) => {
                    if (interaction.customId !== 'select-defence-type') return;

                    if (interaction.user.id !== message.author.id) {
                        return interaction.reply({
                            content: `Only ${message.author.username} can use this selection menu!`,
                            ephemeral: true
                        });
                    }

                    const selectedDefenceType = interaction.values[0];
                    const defenceData = defences[selectedDefenceType];

                    if (!defenceData) {
                        return interaction.reply({
                            content: 'Invalid defence type!',
                            ephemeral: true
                        });
                    }

                    const maxOptions = 25;
                    const levels = Array.from({
                        length: defenceData.maxLevel
                    }, (_, i) => i + 1);
                    const levelOptions = levels.slice(0, maxOptions).map(level => {
                        return new StringSelectMenuOptionBuilder()
                            .setLabel(`Level ${level}`)
                            .setValue(`${selectedDefenceType}-${level}`)
                            .setDescription(defenceData.levels[level]?.upgradeTime || 'No details available.');
                    });

                    const defenceLevelSelectMenu = new StringSelectMenuBuilder()
                        .setCustomId('select-defence-level')
                        .setPlaceholder('Select a level')
                        .addOptions(levelOptions);

                    const levelRow = new ActionRowBuilder().addComponents(defenceLevelSelectMenu);
                    const levelEmbed = new EmbedBuilder()
                        .setTitle(`Select a Level for ${defenceData.name}`)
                        .setDescription('Please choose a level to view its details.')
                        .setColor('#0099ff');

                    const levelFilter = response => response.author.id === message.author.id;
                    const levelCollector = interaction.channel.createMessageComponentCollector({
                        componentType: ComponentType.StringSelect,
                        time: 30000
                    });

                    await interaction.update({
                        embeds: [levelEmbed],
                        components: [levelRow]
                    });

                    levelCollector.on('collect', async (interaction) => {
                        if (interaction.customId !== 'select-defence-level') return;

                        if (interaction.user.id !== message.author.id) {
                            return interaction.reply({
                                content: `Only ${message.author.username} can use this selection menu!`,
                                ephemeral: true
                            });
                        }

                        const [selectedDefenceType, level] = interaction.values[0].split('-');
                        const levelNum = parseInt(level, 10);

                        if (isNaN(levelNum) || levelNum < 1 || levelNum > defenceData.maxLevel) {
                            return interaction.reply({
                                content: `Invalid level! Please provide a level between 1 and ${defenceData.maxLevel}.`,
                                ephemeral: true
                            });
                        }

                        const levelData = defenceData.levels[level];

                        if (!levelData) {
                            return interaction.reply({
                                content: 'No data available for this level!',
                                ephemeral: true
                            });
                        }

                        const stats = levelData.stats || {};
                        const upgradeCost = levelData.upgradeCost || {
                            wood: 0,
                            stone: 0,
                            iron: 0
                        };
                        const attackSpeed = defenceData.attackSpeed || 'Unknown';
                        const hqRequired = levelData.hqRequired || 'N/A';

                        // Calculate DPS if attackSpeed is known
                        const dps = attackSpeed !== 'Unknown' ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';

                        const embedDefence = new EmbedBuilder()
                            .setTitle(`${defenceData.name} - Level ${level}`)
                            .setDescription(defenceData.description || 'No description available.')
                            .setColor('#0099ff');

                        if (levelData.image) {
                            embedDefence.setThumbnail(levelData.image);
                        }

                        // Handle unique stats for certain defences
                        if (selectedDefenceType === 'critter_launcher') {
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
                                value: `${formatNumber(defenceData.range)} Tiles`,
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
                        } else if (selectedDefenceType === 'shock_launcher') {
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
                                value: `${formatNumber(defenceData.range)} Tiles`,
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
                                value: `${formatNumber(defenceData.range)} Tiles`,
                                inline: true
                            }, {
                                name: 'Attack Speed',
                                value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown',
                                inline: true
                            }, {
                                name: 'Upgrade Cost',
                                value: `Wood: ${formatNumber(levelData.upgradeCost.wood)}\nStone: ${formatNumber(levelData.upgradeCost.stone)}\nIron: ${formatNumber(levelData.upgradeCost.iron)}`,
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

                        await interaction.update({
                            embeds: [embedDefence],
                            components: []
                        });
                        levelCollector.stop();
                    });

                    levelCollector.on('end', async (collected, reason) => {
                        if (reason === 'time' && collected.size === 0) {
                            await reply.edit({
                                content: 'You did not select a level in time. Please try again.',
                                embeds: [],
                                components: []
                            });
                        }
                    });
                });

                defenceCollector.on('end', async (collected, reason) => {
                    if (reason === 'time' && collected.size === 0) {
                        await reply.edit({
                            content: 'You did not select a defence type in time. Please try again.',
                            embeds: [],
                            components: []
                        });
                    }
                });
            } else {
                // Argument provided; directly fetch defence statistics
                const userFriendlyDefenceType = args.slice(0, -1).join(' ').toLowerCase().trim();
                const level = parseInt(args[args.length - 1], 10);

                const defenceType = validDefenceTypes[userFriendlyDefenceType];

                if (!defenceType) {
                    return message.reply(`Invalid defence type! Available types are: ${Object.keys(validDefenceTypes).join(', ')}.`);
                }

                const defenceData = defences[defenceType];

                if (!defenceData) {
                    return message.reply('No data found for the provided defence type.');
                }

                if (isNaN(level) || level < 1 || level > defenceData.maxLevel) {
                    return message.reply(`Invalid level! Please provide a level between 1 and ${defenceData.maxLevel}.`);
                }

                const levelData = defenceData.levels[level];
                if (!levelData) {
                    return message.reply(`No data available for level ${level}.`);
                }

                const stats = levelData.stats || {};
                const upgradeCost = levelData.upgradeCost || {
                    wood: 0,
                    stone: 0,
                    iron: 0
                };
                const attackSpeed = defenceData.attackSpeed || 'Unknown';
                const dps = attackSpeed !== 'Unknown' ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';
                const hqRequired = levelData.hqRequired || 'N/A';

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
                        value: `${formatNumber(defenceData.range)} Tiles`,
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
                        value: `${formatNumber(defenceData.range)} Tiles`,
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
                        value: `${formatNumber(defenceData.range)} Tiles`,
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

                await message.reply({
                    embeds: [embedDefence]
                });
            }
        } catch (error) {
            if (error.code === 10008) {
                return message.reply(`I couldn't find the selection menu for ${interaction.customId || 'this interaction'}, please try again later.`);
            } else if (error.code === 10062) {
                return message.reply("My systematic networking is currently out of sync and timed out. Please try again later.");
            } else if (error.code === 40060) {
                return message.reply("I couldn't reuse this interaction as I've already acknowledged it. Please try again later.");
            } else if (error.status === 403 || error.status === 404 || error.status === 503 || error.status === 520) {
                return message.reply("An unexpected error occurred. Please try again later.");
            } else if (error.message.includes("Interaction was not replied")) {
                return message.reply("An interaction error occurred. Please try again later.");
            } else {
                console.error('Error executing defence command:', error);
                message.reply('An error occurred while executing the defence command. Please try again later.');
            }
        }
    }
}