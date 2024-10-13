const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    PermissionsBitField,
    ComponentType
} = require('discord.js');
const prototypeDefences = require('../../data/prototypeDefences.json');
const {
    formatNumber
} = require('../../utils/formatNumber');

const validPrototypeDefenceTypes = {
    'shock blaster': 'shock_blaster',
    'lazor beam': 'lazor_beam',
    'doom cannon': 'doom_cannon',
    'damage amplifier': 'damage_amplifier',
    'shield generator': 'shield_generator',
    'hot pot': 'hot_pot',
    'grappler': 'grappler',
    's.i.m.o.': 'simo',
    'sky shield': 'sky_shield',
    "microwav'r": 'microwavr',
    'boom surprise': 'boom_surprise',
    'flotsam cannon': 'flotsam_cannon'
};

module.exports = {
    name: 'protodefence',
    description: 'Get statistics for a prototype defence.',
    permissions: ['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks'],
    aliases: ['protodefense', 'prototypedefence', 'prototypedefense'],
    args: false,
    usage: '<protodefence_type> <level>',

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
                const prototypeDefenceOptions = Object.keys(validPrototypeDefenceTypes).map(prototypeDefenceKey => {
                    const prototypeDefence = prototypeDefences[validPrototypeDefenceTypes[prototypeDefenceKey]];
                    const description = (prototypeDefence && prototypeDefence.description) ? prototypeDefence.description.substring(0, 100) : 'No description available.';
                    return new StringSelectMenuOptionBuilder()
                        .setLabel(prototypeDefenceKey.charAt(0).toUpperCase() + prototypeDefenceKey.slice(1))
                        .setValue(validPrototypeDefenceTypes[prototypeDefenceKey])
                        .setDescription(description);
                });

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('select-prototype-defence-type')
                    .setPlaceholder('Select a prototype defence type')
                    .addOptions(prototypeDefenceOptions);

                const row = new ActionRowBuilder().addComponents(selectMenu);

                const embed = new EmbedBuilder()
                    .setTitle('Select a Prototype Defence Type')
                    .setDescription('Please choose a prototype defence type to view its details.')
                    .setColor('#0099ff');

                const reply = await message.reply({
                    embeds: [embed],
                    components: [row]
                });

                const filter = interaction => interaction.user.id === message.author.id;
                const prototypeDefenceCollector = reply.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    time: 30000
                });

                prototypeDefenceCollector.on('collect', async (interaction) => {
                    if (interaction.customId !== 'select-prototype-defence-type') return;

                    if (interaction.user.id !== message.author.id) {
                        return interaction.reply({
                            content: `Only ${message.author.username} can use this selection menu!`,
                            ephemeral: true
                        });
                    }

                    const selectedPrototypeDefenceType = interaction.values[0];
                    const prototypeDefenceData = prototypeDefences[selectedPrototypeDefenceType];

                    if (!prototypeDefenceData) {
                        return interaction.reply({
                            content: 'Invalid prototype defence option!',
                            ephemeral: true
                        });
                    }

                    const maxOptions = 5;
                    const levels = Array.from({
                        length: prototypeDefenceData.maxLevel
                    }, (_, i) => i + 1);
                    const levelOptions = levels.slice(0, maxOptions).map(level => {
                        return new StringSelectMenuOptionBuilder()
                            .setLabel(`Mark ${level}`)
                            .setValue(`${selectedPrototypeDefenceType}-${level}`)
                            .setDescription(prototypeDefenceData.levels[level]?.upgradeTime || 'No details available.');
                    });

                    const protodefenceLevelSelectMenu = new StringSelectMenuBuilder()
                        .setCustomId('select-prototype-defence-level')
                        .setPlaceholder('Select a mark (tier)')
                        .addOptions(levelOptions);

                    const levelRow = new ActionRowBuilder().addComponents(protodefenceLevelSelectMenu);
                    const levelEmbed = new EmbedBuilder()
                        .setTitle(`Select a Mark for ${prototypeDefenceData.name}`)
                        .setDescription('Please choose a level to view its details.')
                        .setColor('#0099ff');

                    const levelFilter = response => response.author.id === message.author.id;
                    const markCollector = interaction.channel.createMessageComponentCollector({
                        componentType: ComponentType.StringSelect,
                        time: 30000
                    });

                    await interaction.update({
                        embeds: [levelEmbed],
                        components: [levelRow]
                    });

                    markCollector.on('collect', async (interaction) => {
                        if (interaction.customId !== 'select-prototype-defence-level') return;

                        if (interaction.user.id !== message.author.id) {
                            return interaction.reply({
                                content: `Only ${message.author.username} can use this selection menu!`,
                                ephemeral: true
                            });
                        }

                        const [selectedPrototypeDefenceType, level] = interaction.values[0].split('-');
                        let levelNum = parseInt(level, 10);

                        if (isNaN(levelNum) || levelNum < 1 || levelNum > prototypeDefenceData.maxLevel) {
                            return interaction.reply({
                                content: `Invalid level! Please provide a level between 1 and ${prototypeDefenceData.maxLevel}.`,
                                ephemeral: true
                            });
                        }

                        const levelData = prototypeDefenceData.levels[level];

                        if (!levelData) {
                            return interaction.reply({
                                content: 'No data available for this level!',
                                ephemeral: true
                            });
                        }

                        const stats = levelData.stats || {};
                        const buildCost = levelData.buildCost || {
                            fuses: 0,
                            gears: 0,
                            rods: 0,
                            capacitors: 0
                        };
                        let attackSpeed = prototypeDefenceData.attackSpeed || 'Unknown';

                        // Calculate DPS if attackSpeed is known
                        let dps = attackSpeed !== 'Unknown' ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';

                        const embedPrototypeDefence = new EmbedBuilder()
                            .setTitle(`${prototypeDefenceData.name} - Level ${level}`)
                            .setDescription(prototypeDefenceData.description || 'No description available.')
                            .setColor('#0099ff');

                        if (levelData.image) {
                            embedPrototypeDefence.setThumbnail(levelData.image);
                        }

                        // Handle unique stats for certain prototype defences
                        if (selectedPrototypeDefenceType === 'shock_blaster') {
                            embedPrototypeDefence.addFields({
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
                                value: `${formatNumber(prototypeDefenceData.range)} Tiles`,
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
                                name: 'Can Detect Smoke',
                                value: `${prototypeDefenceData.canDetectSmoke.toString() || 'No'}`,
                                inline: true
                            }, {
                                name: 'Can Target Air',
                                value: `${prototypeDefenceData.canTargetAir.toString() || 'No'}`,
                                inline: true
                            }, {
                                name: 'Build Cost',
                                value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`,
                                inline: true
                            }, {
                                name: 'Build Time',
                                value: `${levelData.buildTime || 'N/A'}`,
                                inline: true
                            }, {
                                name: 'Weapon Lab Required',
                                value: `${levelData.weaponLabRequired || 'Not available'}`,
                                inline: true
                            }, {
                                name: 'Mark',
                                value: `${levelData.marks.toString() || 'N/A'}`,
                                inline: true
                            });
                        } else if (selectedPrototypeDefenceType === 'damage_amplifier') {
                            embedPrototypeDefence.addFields({
                                name: 'Health',
                                value: formatNumber(stats.health),
                                inline: true
                            }, {
                                name: 'Buffing Radius',
                                value: `${formatNumber(prototypeDefenceData.range)} Tiles`,
                                inline: true
                            }, {
                                name: 'Damage Increase',
                                value: `${formatNumber(stats.damageIncrease)}%`,
                                inline: true
                            }, {
                                name: 'Build Cost',
                                value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`,
                                inline: true
                            }, {
                                name: 'Build Time',
                                value: `${levelData.buildTime || 'N/A'}`,
                                inline: true
                            }, {
                                name: 'Weapon Lab Required',
                                value: `${levelData.weaponLabRequired || 'Not available'}`,
                                inline: true
                            }, {
                                name: 'Mark',
                                value: `${levelData.marks.toString() || 'N/A'}`,
                                inline: true
                            });
                        } else if (selectedPrototypeDefenceType === 'shield_generator') {
                            embedPrototypeDefence.addFields({
                                name: 'Health',
                                value: formatNumber(stats.health),
                                inline: true
                            }, {
                                name: 'Headquarters Shield Strength',
                                value: `${formatNumber(stats.shieldStrength)}%`,
                                inline: true
                            }, {
                                name: 'Build Cost',
                                value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`,
                                inline: true
                            }, {
                                name: 'Build Time',
                                value: `${levelData.buildTime || 'N/A'}`,
                                inline: true
                            }, {
                                name: 'Weapon Lab Required',
                                value: `${levelData.weaponLabRequired || 'Not available'}`,
                                inline: true
                            }, {
                                name: 'Mark',
                                value: `${levelData.marks.toString() || 'N/A'}`,
                                inline: true
                            });
                        } else if (selectedPrototypeDefenceType === 'simo') {
                            if (levelNum >= 2) {
                                attackSpeed = 2000 - (level - 1) * 500;
                                dps = attackSpeed !== 'Unknown' ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';
                            }

                            embedPrototypeDefence.addFields({
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
                                value: `${formatNumber(prototypeDefenceData.range)} Tiles`,
                                inline: true
                            }, {
                                name: 'Attack Speed',
                                value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown',
                                inline: true
                            }, {
                                name: 'Can Detect Smoke',
                                value: `${prototypeDefenceData.canDetectSmoke.toString() || 'No'}`,
                                inline: true
                            }, {
                                name: 'Can Target Air',
                                value: `${prototypeDefenceData.canTargetAir.toString() || 'No'}`,
                                inline: true
                            }, {
                                name: 'Build Cost',
                                value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`,
                                inline: true
                            }, {
                                name: 'Build Time',
                                value: `${levelData.buildTime || 'N/A'}`,
                                inline: true
                            }, {
                                name: 'Weapon Lab Required',
                                value: `${levelData.weaponLabRequired || 'Not available'}`,
                                inline: true
                            }, {
                                name: 'Mark',
                                value: `${levelData.marks.toString() || 'N/A'}`,
                                inline: true
                            });
                        } else if (selectedPrototypeDefenceType === 'sky_shield') {
                            embedPrototypeDefence.addFields({
                                name: 'Health',
                                value: formatNumber(stats.health),
                                inline: true
                            }, {
                                name: 'Shield Health',
                                value: `${formatNumber(stats.shieldHealth)} Tiles`,
                                inline: true
                            }, {
                                name: 'Shield Radius',
                                value: `${formatNumber(prototypeDefenceData.range)} Tiles`,
                                inline: true
                            }, {
                                name: 'Build Cost',
                                value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`,
                                inline: true
                            }, {
                                name: 'Build Time',
                                value: `${levelData.buildTime || 'N/A'}`,
                                inline: true
                            }, {
                                name: 'Weapon Lab Required',
                                value: `${levelData.weaponLabRequired || 'Not available'}`,
                                inline: true
                            }, {
                                name: 'Mark',
                                value: `${levelData.marks.toString() || 'N/A'}`,
                                inline: true
                            });
                        } else if (selectedPrototypeDefenceType === 'flotsam_cannon') {
                            embedPrototypeDefence.addFields({
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
                                name: 'Death Damage',
                                value: formatNumber(stats.deathDamage),
                                inline: true
                            }, {
                                name: 'Death Explosion Radius',
                                value: `${formatNumber(prototypeDefenceData.deathExplosionRadius)} Tiles`,
                                inline: true
                            }, {
                                name: 'Death Delay',
                                value: `${formatNumber(prototypeDefenceData.deathExplosionDelay)}s`,
                                inline: true
                            }, {
                                name: 'Range',
                                value: `${formatNumber(prototypeDefenceData.range)} Tiles`,
                                inline: true
                            }, {
                                name: 'Attack Speed',
                                value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown',
                                inline: true
                            }, {
                                name: 'Can Detect Smoke',
                                value: `${prototypeDefenceData.canDetectSmoke.toString() || 'No'}`,
                                inline: true
                            }, {
                                name: 'Can Target Air',
                                value: `${prototypeDefenceData.canTargetAir.toString() || 'No'}`,
                                inline: true
                            }, {
                                name: 'Build Cost',
                                value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`,
                                inline: true
                            }, {
                                name: 'Build Time',
                                value: `${levelData.buildTime || 'N/A'}`,
                                inline: true
                            }, {
                                name: 'Weapon Lab Required',
                                value: `${levelData.weaponLabRequired || 'Not available'}`,
                                inline: true
                            }, {
                                name: 'Mark',
                                value: `${levelData.marks.toString() || 'N/A'}`,
                                inline: true
                            });
                        } else {
                            embedPrototypeDefence.addFields({
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
                                value: `${formatNumber(prototypeDefenceData.range)} Tiles`,
                                inline: true
                            }, {
                                name: 'Attack Speed',
                                value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown',
                                inline: true
                            }, {
                                name: 'Build Cost',
                                value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`,
                                inline: true
                            }, {
                                name: 'Build Time',
                                value: `${levelData.buildTime || 'N/A'}`,
                                inline: true
                            }, {
                                name: 'Weapon Lab Required',
                                value: `${levelData.weaponLabRequired || 'Not available'}`,
                                inline: true
                            }, {
                                name: 'Mark',
                                value: `${levelData.marks.toString() || 'N/A'}`,
                                inline: true
                            });
                        }

                        await interaction.update({
                            embeds: [embedPrototypeDefence],
                            components: []
                        });
                        markCollector.stop();
                    });

                    markCollector.on('end', async (collected, reason) => {
                        if (reason === 'time' && collected.size === 0) {
                            await reply.edit({
                                content: 'You did not select a mark in time. Please try again.',
                                embeds: [],
                                components: []
                            });
                        }
                    });
                });

                prototypeDefenceCollector.on('end', async (collected, reason) => {
                    if (reason === 'time' && collected.size === 0) {
                        await reply.edit({
                            content: 'You did not select a prototype defence type in time. Please try again.',
                            embeds: [],
                            components: []
                        });
                    }
                });
            } else {
                // Argument provided; directly fetch defence statistics
                const userFriendlyPrototypeDefenceType = args.slice(0, -1).join(' ').toLowerCase().trim();
                let level = parseInt(args[args.length - 1], 10);

                const prototypeDefenceType = validPrototypeDefenceTypes[userFriendlyPrototypeDefenceType];

                if (!prototypeDefenceType) {
                    return message.reply(`Invalid prototype defence type! Available types are: ${Object.keys(validPrototypeDefenceTypes).join(', ')}.`);
                }

                const prototypeDefenceData = prototypeDefences[prototypeDefenceType];

                if (!prototypeDefenceData) {
                    return message.reply('No data found for the provided defence type.');
                }

                if (isNaN(level) || level < 1 || level > prototypeDefenceData.maxLevel) {
                    return message.reply(`Invalid level! Please provide a level between 1 and ${prototypeDefenceData.maxLevel}.`);
                }

                const levelData = prototypeDefenceData.levels[level];
                if (!levelData) {
                    return message.reply(`No data available for level ${level}.`);
                }

                const stats = levelData.stats || {};
                const buildCost = levelData.buildCost || {
                    fuses: 0,
                    gears: 0,
                    rods: 0,
                    capacitors: 0
                };
                let attackSpeed = prototypeDefenceData.attackSpeed || 'Unknown';
                let dps = attackSpeed !== 'Unknown' ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';

                const embedPrototypeDefence = new EmbedBuilder()
                    .setTitle(`${prototypeDefenceData.name} - Level ${level}`)
                    .setDescription(prototypeDefenceData.description || 'No description available.')
                    .setColor('#0099ff');

                if (levelData.image) {
                    embedPrototypeDefence.setThumbnail(levelData.image);
                }

                // Handle unique stats for certain prototype defences
                if (prototypeDefenceType === 'shock_blaster') {
                    embedPrototypeDefence.addFields({
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
                        value: `${formatNumber(prototypeDefenceData.range)} Tiles`,
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
                        name: 'Can Detect Smoke',
                        value: `${prototypeDefenceData.canDetectSmoke.toString() || 'No'}`,
                        inline: true
                    }, {
                        name: 'Can Target Air',
                        value: `${prototypeDefenceData.canTargetAir.toString() || 'No'}`,
                        inline: true
                    }, {
                        name: 'Build Cost',
                        value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`,
                        inline: true
                    }, {
                        name: 'Build Time',
                        value: `${levelData.buildTime || 'N/A'}`,
                        inline: true
                    }, {
                        name: 'Weapon Lab Required',
                        value: `${levelData.weaponLabRequired || 'Not available'}`,
                        inline: true
                    }, {
                        name: 'Mark',
                        value: `${levelData.marks.toString() || 'N/A'}`,
                        inline: true
                    });
                } else if (prototypeDefenceType === 'damage_amplifier') {
                    embedPrototypeDefence.addFields({
                        name: 'Health',
                        value: formatNumber(stats.health),
                        inline: true
                    }, {
                        name: 'Buffing Radius',
                        value: `${formatNumber(prototypeDefenceData.range)} Tiles`,
                        inline: true
                    }, {
                        name: 'Damage Increase',
                        value: `${formatNumber(stats.damageIncrease)}%`,
                        inline: true
                    }, {
                        name: 'Build Cost',
                        value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`,
                        inline: true
                    }, {
                        name: 'Build Time',
                        value: `${levelData.buildTime || 'N/A'}`,
                        inline: true
                    }, {
                        name: 'Weapon Lab Required',
                        value: `${levelData.weaponLabRequired || 'Not available'}`,
                        inline: true
                    }, {
                        name: 'Mark',
                        value: `${levelData.marks.toString() || 'N/A'}`,
                        inline: true
                    });
                } else if (prototypeDefenceType === 'shield_generator') {
                    embedPrototypeDefence.addFields({
                        name: 'Health',
                        value: formatNumber(stats.health),
                        inline: true
                    }, {
                        name: 'Headquarters Shield Strength',
                        value: `${formatNumber(stats.shieldStrength)}%`,
                        inline: true
                    }, {
                        name: 'Build Cost',
                        value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`,
                        inline: true
                    }, {
                        name: 'Build Time',
                        value: `${levelData.buildTime || 'N/A'}`,
                        inline: true
                    }, {
                        name: 'Weapon Lab Required',
                        value: `${levelData.weaponLabRequired || 'Not available'}`,
                        inline: true
                    }, {
                        name: 'Mark',
                        value: `${levelData.marks.toString() || 'N/A'}`,
                        inline: true
                    });
                } else if (prototypeDefenceType === 'simo') {
                    if (level >= 2) {
                        attackSpeed = 2000 - (level - 1) * 500;
                        dps = attackSpeed !== 'Unknown' ? (stats.damage / (attackSpeed / 1000)).toFixed(2) : 'Unknown';
                    }

                    embedPrototypeDefence.addFields({
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
                        value: `${formatNumber(prototypeDefenceData.range)} Tiles`,
                        inline: true
                    }, {
                        name: 'Attack Speed',
                        value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown',
                        inline: true
                    }, {
                        name: 'Can Detect Smoke',
                        value: `${prototypeDefenceData.canDetectSmoke.toString() || 'No'}`,
                        inline: true
                    }, {
                        name: 'Can Target Air',
                        value: `${prototypeDefenceData.canTargetAir.toString() || 'No'}`,
                        inline: true
                    }, {
                        name: 'Build Cost',
                        value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`,
                        inline: true
                    }, {
                        name: 'Build Time',
                        value: `${levelData.buildTime || 'N/A'}`,
                        inline: true
                    }, {
                        name: 'Weapon Lab Required',
                        value: `${levelData.weaponLabRequired || 'Not available'}`,
                        inline: true
                    }, {
                        name: 'Mark',
                        value: `${levelData.marks.toString() || 'N/A'}`,
                        inline: true
                    });
                } else if (prototypeDefenceType === 'sky_shield') {
                    embedPrototypeDefence.addFields({
                        name: 'Health',
                        value: formatNumber(stats.health),
                        inline: true
                    }, {
                        name: 'Shield Health',
                        value: `${formatNumber(stats.shieldHealth)} Tiles`,
                        inline: true
                    }, {
                        name: 'Shield Radius',
                        value: `${formatNumber(prototypeDefenceData.range)} Tiles`,
                        inline: true
                    }, {
                        name: 'Build Cost',
                        value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`,
                        inline: true
                    }, {
                        name: 'Build Time',
                        value: `${levelData.buildTime || 'N/A'}`,
                        inline: true
                    }, {
                        name: 'Weapon Lab Required',
                        value: `${levelData.weaponLabRequired || 'Not available'}`,
                        inline: true
                    }, {
                        name: 'Mark',
                        value: `${levelData.marks.toString() || 'N/A'}`,
                        inline: true
                    });
                } else if (prototypeDefenceType === 'flotsam_cannon') {
                    embedPrototypeDefence.addFields({
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
                        name: 'Death Damage',
                        value: formatNumber(stats.deathDamage),
                        inline: true
                    }, {
                        name: 'Death Explosion Radius',
                        value: `${formatNumber(prototypeDefenceData.deathExplosionRadius)} Tiles`,
                        inline: true
                    }, {
                        name: 'Death Delay',
                        value: `${formatNumber(prototypeDefenceData.deathExplosionDelay)}s`,
                        inline: true
                    }, {
                        name: 'Range',
                        value: `${formatNumber(prototypeDefenceData.range)} Tiles`,
                        inline: true
                    }, {
                        name: 'Attack Speed',
                        value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown',
                        inline: true
                    }, {
                        name: 'Can Detect Smoke',
                        value: `${prototypeDefenceData.canDetectSmoke.toString() || 'No'}`,
                        inline: true
                    }, {
                        name: 'Can Target Air',
                        value: `${prototypeDefenceData.canTargetAir.toString() || 'No'}`,
                        inline: true
                    }, {
                        name: 'Build Cost',
                        value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`,
                        inline: true
                    }, {
                        name: 'Build Time',
                        value: `${levelData.buildTime || 'N/A'}`,
                        inline: true
                    }, {
                        name: 'Weapon Lab Required',
                        value: `${levelData.weaponLabRequired || 'Not available'}`,
                        inline: true
                    }, {
                        name: 'Mark',
                        value: `${levelData.marks.toString() || 'N/A'}`,
                        inline: true
                    });
                } else {
                    embedPrototypeDefence.addFields({
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
                        value: `${formatNumber(prototypeDefenceData.range)} Tiles`,
                        inline: true
                    }, {
                        name: 'Attack Speed',
                        value: attackSpeed !== 'Unknown' ? `${formatNumber(attackSpeed)}ms` : 'Unknown',
                        inline: true
                    }, {
                        name: 'Can Detect Smoke',
                        value: `${prototypeDefenceData.canDetectSmoke.toString() || 'No'}`,
                        inline: true
                    }, {
                        name: 'Can Target Air',
                        value: `${prototypeDefenceData.canTargetAir.toString() || 'No'}`,
                        inline: true
                    }, {
                        name: 'Build Cost',
                        value: `Fuses: ${formatNumber(buildCost.fuses)}\nGears: ${formatNumber(buildCost.gears)}\nRods: ${formatNumber(buildCost.rods)}\nCapacitors: ${formatNumber(buildCost.capacitors)}`,
                        inline: true
                    }, {
                        name: 'Build Time',
                        value: `${levelData.buildTime || 'N/A'}`,
                        inline: true
                    }, {
                        name: 'Weapon Lab Required',
                        value: `${levelData.weaponLabRequired || 'Not available'}`,
                        inline: true
                    }, {
                        name: 'Mark',
                        value: `${levelData.marks.toString() || 'N/A'}`,
                        inline: true
                    });
                }

                await message.reply({
                    embeds: [embedPrototypeDefence]
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
                console.error('Error executing protodefence command:', error);
                message.reply('An error occurred while executing the protodefence command. Please try again later.');
            }
        }
    }
};