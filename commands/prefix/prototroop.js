const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    PermissionsBitField,
    ComponentType
} = require('discord.js');
const prototroops = require('../../data/prototypeTroops.json');
const {
    formatNumber
} = require('../../utils/formatNumber');

const validPrototroopTypes = {
    'rain maker': 'rain_maker',
    'lazortron': 'lazortron',
    'critter cannon': 'critter_cannon',
    'rocket choppa': 'rocket_choppa',
    'heavy choppa': 'heavy_choppa',
    'turret engineer': 'turret_engineer',
    'critter engineer': 'critter_engineer',
    'cryobombardier': 'cryobombardier'
};

module.exports = {
    name: 'prototroop',
    description: 'Get statistics for a prototype troop.',
    permissions: ['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks'],
    aliases: ['prototypeTroop'],
    usage: '<prototroop_type> <level>',

    async execute(message, args) {
        // Check bot permissions
        const botPermissions = message.channel.permissionsFor(message.guild.members.me);
        const requiredPermissions = new PermissionsBitField(['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks']);

        if (!botPermissions.has(requiredPermissions)) {
            return message.reply("I don't have the necessary permissions to execute this command. Please make sure I have `SEND_MESSAGES`, `VIEW_CHANNEL`, `READ_MESSAGE_HISTORY`, and `EMBED_LINKS` permissions.");
        }

        try {
            if (args.length === 0) {
                // Display list of troop types
                const prototroopOptions = Object.keys(validPrototroopTypes).map(prototroopKey => {
                    const prototroop = prototroops[validPrototroopTypes[prototroopKey]];
                    const description = (prototroop && prototroop.description) ? prototroop.description.substring(0, 100) : 'No description available.';
                    return new StringSelectMenuOptionBuilder()
                        .setLabel(prototroopKey.charAt(0).toUpperCase() + prototroopKey.slice(1))
                        .setValue(validPrototroopTypes[prototroopKey])
                        .setDescription(description);
                });

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('select-prototype-troop-type')
                    .setPlaceholder('Select a prototroop type')
                    .addOptions(prototroopOptions);

                const row = new ActionRowBuilder().addComponents(selectMenu);

                const embed = new EmbedBuilder()
                    .setTitle('Select a Prototroop Type')
                    .setDescription('Please choose a prototroop type to view its details.')
                    .setColor('#0099ff');

                const reply = await message.reply({
                    embeds: [embed],
                    components: [row]
                });

                const filter = interaction => interaction.user.id === message.author.id;
                const prototroopCollector = reply.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    time: 30000
                });

                prototroopCollector.on('collect', async (interaction) => {
                    if (interaction.customId !== 'select-prototype-troop-type') return;

                    if (interaction.user.id !== message.author.id) {
                        return interaction.reply({
                            content: `Only ${message.author.username} can use this selection menu!`,
                            ephemeral: true
                        });
                    }

                    const selectedPrototroopType = interaction.values[0];
                    const prototroopData = prototroops[selectedPrototroopType];

                    if (!prototroopData) {
                        return interaction.reply({
                            content: 'Invalid prototroop type!',
                            ephemeral: true
                        });
                    }

                    const maxOptions = 25;
                    const levels = Array.from({
                        length: prototroopData.maxLevel - 11
                    }, (_, i) => i + 12); // Levels start from 12
                    const levelOptions = levels.slice(0, maxOptions).map(level => {
                        return new StringSelectMenuOptionBuilder()
                            .setLabel(`Level ${level}`)
                            .setValue(`${selectedPrototroopType}-${level}`)
                            .setDescription(prototroopData.levels[level]?.armoryRequired ? `Armory Level ${prototroopData.levels[level].armoryRequired}` : 'No details available.');
                    });

                    const prototroopLevelSelectMenu = new StringSelectMenuBuilder()
                        .setCustomId('select-prototype-troop-level')
                        .setPlaceholder('Select a level')
                        .addOptions(levelOptions);

                    const levelRow = new ActionRowBuilder().addComponents(prototroopLevelSelectMenu);
                    const levelEmbed = new EmbedBuilder()
                        .setTitle(`Select a Level for ${prototroopData.name}`)
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
                        if (interaction.customId !== 'select-prototype-troop-level') return;

                        if (interaction.user.id !== message.author.id) {
                            return interaction.reply({
                                content: `Only ${message.author.username} can use this selection menu!`,
                                ephemeral: true
                            });
                        }

                        const [selectedPrototroopType, level] = interaction.values[0].split('-');
                        const levelNum = parseInt(level, 10);

                        if (isNaN(levelNum) || levelNum < 1 || levelNum > prototroopData.maxLevel) {
                            return interaction.reply({
                                content: `Invalid level! Please provide a level between 1 and ${prototroopData.maxLevel}.`,
                                ephemeral: true
                            });
                        }

                        const levelData = prototroopData.levels[level];

                        if (!levelData) {
                            return interaction.reply({
                                content: 'No data available for this level!',
                                ephemeral: true
                            });
                        }

                        const stats = levelData.stats;
                        const trainingCost = levelData.trainingCost || {
                            gold: 0
                        };
                        const protoTokenCost = levelNum < 26 ? 250 + (levelNum - 12) * 100 : 2500;
                        const range = prototroopData.attackRange || 0;
                        const attackSpeed = prototroopData.attackSpeed || 0;
                        const dps = attackSpeed ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';

                        const embedPrototroop = new EmbedBuilder()
                            .setTitle(`${prototroopData.name} - Level ${level}`)
                            .setDescription(prototroopData.description || 'No description available.')
                            .setColor('#0099ff');

                        if (prototroopData.image) {
                            embedPrototroop.setThumbnail(prototroopData.image);
                        }

                        // Handle unique stats for certain prototroops
                        if (selectedPrototroopType === 'critter_cannon') {
                            const crittersPerSalvo = stats.crittersPerSalvo || 0;
                            const crittersPerSecond = (crittersPerSalvo / (attackSpeed / 1000)).toFixed(2); // crittersPerSalvo divided by attackSpeed in seconds

                            embedPrototroop.addFields({
                                name: 'Health',
                                value: formatNumber(stats.health),
                                inline: true
                            }, {
                                name: 'Critters Per Salvo',
                                value: formatNumber(crittersPerSalvo),
                                inline: true
                            }, {
                                name: 'Critters Per Second',
                                value: formatNumber(crittersPerSecond),
                                inline: true
                            }, {
                                name: 'Training Cost',
                                value: `Gold: ${formatNumber(trainingCost.gold)}`,
                                inline: true
                            }, {
                                name: 'Upgrade Cost',
                                value: `Proto Tokens: ${formatNumber(protoTokenCost)}`,
                                inline: true
                            }, {
                                name: 'Unit Size',
                                value: formatNumber(prototroopData.unitSize),
                                inline: true
                            }, {
                                name: 'Training Time',
                                value: prototroopData.trainingTime || 'Unknown',
                                inline: true
                            }, {
                                name: 'Movement Speed',
                                value: prototroopData.movementSpeed || 'Unknown',
                                inline: true
                            }, {
                                name: 'Attack Range',
                                value: `${formatNumber(range)} Tiles`,
                                inline: true
                            }, {
                                name: 'Attack Speed',
                                value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown',
                                inline: true
                            });
                        } else if (selectedPrototroopType === 'turret_engineer') {
                            const spawnSpeed = level < 26 ? 7000 - (level - 12) * 100 : 5600;
                            const turretHealth = stats.turretHealth || 0;
                            const turretDamage = stats.turretDamage || 0;
                            const turretDPS = (turretDamage / (prototroopData.turretAttackSpeed / 1000)).toFixed(2);

                            embedPrototroop.addFields({
                                name: 'Health',
                                value: formatNumber(stats.health),
                                inline: true
                            }, {
                                name: 'Turret Hitpoints',
                                value: formatNumber(turretHealth),
                                inline: true
                            }, {
                                name: 'Turret Damage',
                                value: formatNumber(turretDamage),
                                inline: true
                            }, {
                                name: 'Turret DPS',
                                value: turretDPS,
                                inline: true
                            }, {
                                name: 'Training Cost',
                                value: `Gold: ${formatNumber(trainingCost.gold)}`,
                                inline: true
                            }, {
                                name: 'Upgrade Cost',
                                value: `Proto Tokens: ${formatNumber(protoTokenCost)}`,
                                inline: true
                            }, {
                                name: 'Unit Size',
                                value: formatNumber(prototroopData.unitSize),
                                inline: true
                            }, {
                                name: 'Training Time',
                                value: prototroopData.trainingTime || 'Unknown',
                                inline: true
                            }, {
                                name: 'Movement Speed',
                                value: prototroopData.movementSpeed || 'Unknown',
                                inline: true
                            }, {
                                name: 'Attack Range',
                                value: `${formatNumber(range)} Tiles`,
                                inline: true
                            }, {
                                name: 'Spawn Speed',
                                value: spawnSpeed !== 'Unknown' ? `${formatNumber(spawnSpeed)}ms` : 'Unknown',
                                inline: true
                            });
                        } else {
                            embedPrototroop.addFields({
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
                                name: 'Training Cost',
                                value: `Gold: ${formatNumber(trainingCost.gold)}`,
                                inline: true
                            }, {
                                name: 'Upgrade Cost',
                                value: `Proto Tokens: ${formatNumber(protoTokenCost)}`,
                                inline: true
                            }, {
                                name: 'Unit Size',
                                value: formatNumber(prototroopData.unitSize),
                                inline: true
                            }, {
                                name: 'Training Time',
                                value: prototroopData.trainingTime || 'Unknown',
                                inline: true
                            }, {
                                name: 'Movement Speed',
                                value: prototroopData.movementSpeed || 'Unknown',
                                inline: true
                            }, {
                                name: 'Attack Range',
                                value: `${formatNumber(range)} Tiles`,
                                inline: true
                            }, {
                                name: 'Attack Speed',
                                value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown',
                                inline: true
                            });
                        }

                        await interaction.update({
                            embeds: [embedPrototroop],
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

                prototroopCollector.on('end', async (collected, reason) => {
                    if (reason === 'time' && collected.size === 0) {
                        await reply.edit({
                            content: 'You did not select a prototroop type in time. Please try again.',
                            embeds: [],
                            components: []
                        });
                    }
                });
            } else {
                const userFriendlyPrototroopType = args.slice(0, -1).join(' ').toLowerCase().trim();
                const level = parseInt(args[args.length - 1], 10);

                const prototroopType = validPrototroopTypes[userFriendlyPrototroopType];

                if (!prototroopType) {
                    return message.reply(`Invalid prototroop type! Available types are: ${Object.keys(validPrototroopTypes).join(', ')}.`);
                }

                const prototroopData = prototroops[prototroopType];

                if (!prototroopData) {
                    return message.reply('No data found for the provided troop type.');
                }

                if (isNaN(level) || level < 1 || level > prototroopData.maxLevel) {
                    return message.reply(`Invalid level! Please provide a level between 1 and ${prototroopData.maxLevel}.`);
                }

                const levelData = prototroopData.levels[level];
                if (!levelData) {
                    return message.reply(`No data available for level ${level}.`);
                }

                const stats = levelData.stats;
                const trainingCost = levelData.trainingCost || {
                    gold: 0
                };
                const protoTokenCost = level < 26 ? 250 + (level - 12) * 100 : 2500;
                const range = prototroopData.attackRange || 0;
                const attackSpeed = prototroopData.attackSpeed || 0;
                const dps = attackSpeed ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';

                const embedPrototroop = new EmbedBuilder()
                    .setTitle(`${prototroopData.name} - Level ${level}`)
                    .setDescription(prototroopData.description || 'No description available.')
                    .setColor('#0099ff');

                if (prototroopData.image) {
                    embedPrototroop.setThumbnail(prototroopData.image);
                }

                // Handle unique stats for certain troops
                if (prototroopType === 'critter_cannon') {
                    const crittersPerSalvo = stats.crittersPerSalvo || 0;
                    const crittersPerSecond = (crittersPerSalvo / (attackSpeed / 1000)).toFixed(2); // crittersPerSalvo divided by attackSpeed in seconds

                    embedPrototroop.addFields({
                        name: 'Health',
                        value: formatNumber(stats.health),
                        inline: true
                    }, {
                        name: 'Critters Per Salvo',
                        value: formatNumber(crittersPerSalvo),
                        inline: true
                    }, {
                        name: 'Critters Per Second',
                        value: formatNumber(crittersPerSecond),
                        inline: true
                    }, {
                        name: 'Training Cost',
                        value: `Gold: ${formatNumber(trainingCost.gold)}`,
                        inline: true
                    }, {
                        name: 'Upgrade Cost',
                        value: `Proto Tokens: ${formatNumber(protoTokenCost)}`,
                        inline: true
                    }, {
                        name: 'Unit Size',
                        value: formatNumber(prototroopData.unitSize),
                        inline: true
                    }, {
                        name: 'Training Time',
                        value: prototroopData.trainingTime || 'Unknown',
                        inline: true
                    }, {
                        name: 'Movement Speed',
                        value: prototroopData.movementSpeed || 'Unknown',
                        inline: true
                    }, {
                        name: 'Attack Range',
                        value: `${formatNumber(range)} Tiles`,
                        inline: true
                    }, {
                        name: 'Attack Speed',
                        value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown',
                        inline: true
                    });
                } else if (prototroopType === 'turret_engineer') {
                    const spawnSpeed = level < 26 ? 7000 - (level - 12) * 100 : 5600;
                    const turretHealth = stats.turretHealth || 0;
                    const turretDamage = stats.turretDamage || 0;
                    const turretDPS = (turretDamage / (prototroopData.turretAttackSpeed / 1000)).toFixed(2);

                    embedPrototroop.addFields({
                        name: 'Health',
                        value: formatNumber(stats.health),
                        inline: true
                    }, {
                        name: 'Turret Hitpoints',
                        value: formatNumber(turretHealth),
                        inline: true
                    }, {
                        name: 'Turret Damage',
                        value: formatNumber(turretDamage),
                        inline: true
                    }, {
                        name: 'Turret DPS',
                        value: turretDPS,
                        inline: true
                    }, {
                        name: 'Training Cost',
                        value: `Gold: ${formatNumber(trainingCost.gold)}`,
                        inline: true
                    }, {
                        name: 'Upgrade Cost',
                        value: `Proto Tokens: ${formatNumber(protoTokenCost)}`,
                        inline: true
                    }, {
                        name: 'Unit Size',
                        value: formatNumber(prototroopData.unitSize),
                        inline: true
                    }, {
                        name: 'Training Time',
                        value: prototroopData.trainingTime || 'Unknown',
                        inline: true
                    }, {
                        name: 'Movement Speed',
                        value: prototroopData.movementSpeed || 'Unknown',
                        inline: true
                    }, {
                        name: 'Attack Range',
                        value: `${formatNumber(range)} Tiles`,
                        inline: true
                    }, {
                        name: 'Spawn Speed',
                        value: spawnSpeed !== 'Unknown' ? `${formatNumber(spawnSpeed)}ms` : 'Unknown',
                        inline: true
                    });
                } else {
                    embedPrototroop.addFields({
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
                        name: 'Training Cost',
                        value: `Gold: ${formatNumber(trainingCost.gold)}`,
                        inline: true
                    }, {
                        name: 'Upgrade Cost',
                        value: `Proto Tokens: ${formatNumber(protoTokenCost)}`,
                        inline: true
                    }, {
                        name: 'Unit Size',
                        value: formatNumber(prototroopData.unitSize),
                        inline: true
                    }, {
                        name: 'Training Time',
                        value: prototroopData.trainingTime || 'Unknown',
                        inline: true
                    }, {
                        name: 'Movement Speed',
                        value: prototroopData.movementSpeed || 'Unknown',
                        inline: true
                    }, {
                        name: 'Attack Range',
                        value: `${formatNumber(range)} Tiles`,
                        inline: true
                    }, {
                        name: 'Attack Speed',
                        value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown',
                        inline: true
                    });
                }

                await message.reply({
                    embeds: [embedPrototroop]
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
                console.error('Error executing prototroop command:', error);
                message.reply('An error occurred while executing the prototroop command. Please try again later.');
            }
        }
    }
};