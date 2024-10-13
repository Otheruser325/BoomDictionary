const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');
const prototypeDefences = require('../../data/prototypeDefences.json');
const prototypeTroops = require('../../data/prototypeTroops.json');
const {
    formatNumber
} = require('../../utils/formatNumber');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prototype')
        .setDescription('Get statistics for a prototype defence or troop.')
        .addSubcommand(subcommand =>
            subcommand
            .setName('defence')
            .setDescription('Get statistics for a prototype defence.')
            .addStringOption(option =>
                option.setName('protodefence_type')
                .setDescription('Type of prototype defence')
                .setRequired(true)
                .addChoices({
                    name: 'Shock Blaster',
                    value: 'shock_blaster'
                }, {
                    name: 'Lazor Beam',
                    value: 'lazor_beam'
                }, {
                    name: 'Doom Cannon',
                    value: 'doom_cannon'
                }, {
                    name: 'Damage Amplifier',
                    value: 'damage_amplifier'
                }, {
                    name: 'Shield Generator',
                    value: 'shield_generator'
                }, {
                    name: 'Hot Pot',
                    value: 'hot_pot'
                }, {
                    name: 'Grappler',
                    value: 'grappler'
                }, {
                    name: 'S.I.M.O.',
                    value: 'simo'
                }, {
                    name: 'Sky Shield',
                    value: 'sky_shield'
                }, {
                    name: "Microwav'r",
                    value: 'microwavr'
                }, {
                    name: 'Boom Surprise',
                    value: 'boom_surprise'
                }, {
                    name: 'Flotsam Cannon',
                    value: 'flotsam_cannon'
                })
            )
            .addIntegerOption(option =>
                option.setName('level')
                .setDescription('Level of the prototype defence')
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand =>
            subcommand
            .setName('troop')
            .setDescription('Get statistics for a prototype troop.')
            .addStringOption(option =>
                option.setName('prototroop_type')
                .setDescription('Type of prototype troop')
                .setRequired(true)
                .addChoices({
                    name: 'Rain Maker',
                    value: 'rain_maker'
                }, {
                    name: 'Lazortron',
                    value: 'lazortron'
                }, {
                    name: 'Critter Cannon',
                    value: 'critter_cannon'
                }, {
                    name: 'Rocket Choppa',
                    value: 'rocket_choppa'
                }, {
                    name: 'Heavy Choppa',
                    value: 'heavy_choppa'
                }, {
                    name: 'Turret Engineer',
                    value: 'turret_engineer'
                }, {
                    name: 'Critter Engineer',
                    value: 'critter_engineer'
                }, {
                    name: 'Cryobombardier',
                    value: 'cryobombardier'
                })
            )
            .addIntegerOption(option =>
                option.setName('level')
                .setDescription('Level of the prototype troop')
                .setRequired(true)
            )
        ),
    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'defence') {
                const prototypeDefenceType = interaction.options.getString('protodefence_type');
                const level = interaction.options.getInteger('level');

                const prototypeDefenceData = prototypeDefences[prototypeDefenceType];

                if (!prototypeDefenceData) {
                    return interaction.reply({
                        content: 'Invalid prototype defence!',
                        ephemeral: true
                    });
                }

                if (level < 1 || level > (prototypeDefenceData.maxLevel || 3)) {
                    return interaction.reply({
                        content: `Invalid level! Please provide a level between 1 and ${prototypeDefenceData.maxLevel || 3}.`,
                        ephemeral: true
                    });
                }

                const levelData = prototypeDefenceData.levels[level];
                if (!levelData) {
                    return interaction.reply({
                        content: `No data available for level ${level}.`,
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

                await interaction.reply({
                    embeds: [embedPrototypeDefence]
                });

            } else if (subcommand === 'troop') {
                const prototroopType = interaction.options.getString('prototroop_type');
                const level = interaction.options.getInteger('level');

                const prototroopData = prototypeTroops[prototroopType];

                if (!prototroopData) {
                    return interaction.reply({
                        content: 'Invalid prototype troop type!',
                        ephemeral: true
                    });
                }

                if (level < 12 || level > (prototroopData.maxLevel || 26)) {
                    return interaction.reply({
                        content: `Invalid level! Please provide a level between 12 and ${prototroopData.maxLevel || 26}.`,
                        ephemeral: true
                    });
                }

                const levelData = prototroopData.levels[level];
                if (!levelData) {
                    return interaction.reply({
                        content: `No data available for level ${level}.`,
                        ephemeral: true
                    });
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

                await interaction.reply({
                    embeds: [embedPrototroop]
                });
            }
        } catch (error) {
            if (error.code === 10008) {
                return interaction.followUp(`The prototype embed was deleted and couldn't be recovered, please try again later.`);
            } else if (error.code === 10062) {
                return interaction.followUp("My systematic networking is currently out of sync and timed out. Please try again later.");
            } else if (error.code === 40060) {
                return interaction.followUp("I couldn't reuse this interaction as I've already acknowledged it. Please try again later.");
            } else if (error.status === 403 || error.status === 404 || error.status === 503 || error.status === 520) {
                return interaction.followUp("An unexpected error occurred. Please try again later.");
            } else if (error.message.includes("Interaction was not replied")) {
                return interaction.followUp("An interaction error occurred. Please try again later.");
            } else {
                console.error('Error executing prototype command:', error);
                interaction.reply('An error occurred while executing the prototype command. Please try again later.');
            }
        }
    }
}