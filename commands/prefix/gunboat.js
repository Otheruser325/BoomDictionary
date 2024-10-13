const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    PermissionsBitField,
    ComponentType
} = require('discord.js');
const gunboatAbilities = require('../../data/gunboatAbilities.json');
const {
    formatNumber
} = require('../../utils/formatNumber');

const validAbilityTypes = {
    'artillery': 'artillery',
    'flare': 'flare',
    'medkit': 'medkit',
    'shock bomb': 'shock_bomb',
    'barrage': 'barrage',
    'smoke screen': 'smokescreen',
    'critters': 'critters'
};

module.exports = {
    name: 'gunboat',
    description: 'Get statistics for a gunboat ability.',
    permissions: ['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks'],
    aliases: ['gb'],
    args: false,
    usage: '<ability_type> <level>',

    async execute(message, args) {
        // Check bot permissions
        const botPermissions = message.channel.permissionsFor(message.guild.members.me);
        const requiredPermissions = new PermissionsBitField(['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'EmbedLinks']);

        if (!botPermissions.has(requiredPermissions)) {
            return message.reply("I don't have the necessary permissions to execute this command. Please make sure I have `SEND_MESSAGES`, `VIEW_CHANNEL`, `READ_MESSAGE_HISTORY`, and `EMBED_LINKS` permissions.");
        }

        try {
            if (args.length === 0) {
                const abilityOptions = Object.keys(validAbilityTypes).map(abilityKey => {
                    const ability = gunboatAbilities[validAbilityTypes[abilityKey]];
                    const description = (ability && ability.description) ? ability.description.substring(0, 100) : 'No description available.';
                    return new StringSelectMenuOptionBuilder()
                        .setLabel(abilityKey.charAt(0).toUpperCase() + abilityKey.slice(1))
                        .setValue(validAbilityTypes[abilityKey])
                        .setDescription(description);
                });

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('select-gunboat-ability-type')
                    .setPlaceholder('Select a gunboat ability')
                    .addOptions(abilityOptions);

                const row = new ActionRowBuilder().addComponents(selectMenu);

                const embed = new EmbedBuilder()
                    .setTitle('Select a Gunboat Ability')
                    .setDescription('Please choose a gunboat ability to view its details.')
                    .setColor('#0099ff');

                const reply = await message.reply({
                    embeds: [embed],
                    components: [row]
                });

                const filter = interaction => interaction.user.id === message.author.id;
                const abilityCollector = reply.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    time: 30000
                });

                abilityCollector.on('collect', async (interaction) => {
                    if (interaction.customId !== 'select-gunboat-ability-type') return;

                    if (interaction.user.id !== message.author.id) {
                        return interaction.reply({
                            content: `Only ${message.author.username} can use this selection menu!`,
                            ephemeral: true
                        });
                    }

                    const selectedAbilityType = interaction.values[0];
                    const abilityData = gunboatAbilities[selectedAbilityType];

                    if (!abilityData) {
                        return interaction.reply({
                            content: 'No data found for the selected gunboat ability.',
                            ephemeral: true
                        });
                    }

                    const maxOptions = 25;
                    const levels = Array.from({
                        length: abilityData.maxLevel
                    }, (_, i) => i + 1);
                    const levelOptions = levels.slice(0, maxOptions).map(level => {
                        return new StringSelectMenuOptionBuilder()
                            .setLabel(`Level ${level}`)
                            .setValue(`${selectedAbilityType}-${level}`)
                            .setDescription(abilityData.levels[level]?.armoryRequired ? `Armory Level ${abilityData.levels[level].armoryRequired}` : 'No details available.');
                    });

                    const abilityLevelSelectMenu = new StringSelectMenuBuilder()
                        .setCustomId('select-gunboat-ability-level')
                        .setPlaceholder('Select a level')
                        .addOptions(levelOptions);

                    const levelRow = new ActionRowBuilder().addComponents(abilityLevelSelectMenu);
                    const levelEmbed = new EmbedBuilder()
                        .setTitle(`Select a Level for ${abilityData.name}`)
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
                        if (interaction.customId !== 'select-gunboat-ability-level') return;

                        if (interaction.user.id !== message.author.id) {
                            return interaction.reply({
                                content: `Only ${message.author.username} can use this selection menu!`,
                                ephemeral: true
                            });
                        }

                        const [selectedAbilityType, level] = interaction.values[0].split('-');
                        const levelNum = parseInt(level, 10);

                        if (isNaN(levelNum) || levelNum < 1 || levelNum > abilityData.maxLevel) {
                            return interaction.reply({
                                content: `Invalid level! Please provide a level between 1 and ${abilityData.maxLevel}.`,
                                ephemeral: true
                            });
                        }

                        const levelData = abilityData.levels[level];

                        if (!levelData) {
                            return interaction.reply({
                                content: 'No data available for this level!',
                                ephemeral: true
                            });
                        }

                        const stats = levelData.stats;
                        const researchCost = levelData.researchCost || {
                            gold: 0
                        };
                        const armoryRequired = levelData.armoryRequired || 'N/A';
                        const critterDPS = abilityData.critterAttackSpeed ? (abilityData.critterDamage / (abilityData.critterAttackSpeed / 1000)).toFixed(2) : 'Unknown';

                        const embedAbility = new EmbedBuilder()
                            .setTitle(`${abilityData.name} - Level ${level}`)
                            .setDescription(abilityData.description || 'No description available.')
                            .setColor('#0099ff');

                        if (abilityData.image) {
                            embedAbility.setThumbnail(abilityData.image);
                        }

                        // Handle unique stats for gunboat abilities
                        if (selectedAbilityType === 'artillery') {
                            embedAbility.addFields({
                                name: 'Damage',
                                value: formatNumber(stats.damage),
                                inline: true
                            }, {
                                name: 'Energy Cost',
                                value: formatNumber(abilityData.energyCost),
                                inline: true
                            }, {
                                name: `Energy Cost Increase per ${abilityData.name}`,
                                value: formatNumber(abilityData.energyCostIncreasePerUse),
                                inline: true
                            }, {
                                name: 'Explosion Radius',
                                value: `${formatNumber(abilityData.explosionRadius)} Tiles`,
                                inline: true
                            }, {
                                name: 'Research Cost',
                                value: `Gold: ${formatNumber(researchCost.gold)}`,
                                inline: true
                            }, {
                                name: 'Research Time',
                                value: `${levelData.upgradeTime || 'N/A'}`,
                                inline: true
                            }, {
                                name: 'Armory Level Required',
                                value: armoryRequired.toString(),
                                inline: true
                            });
                        } else if (selectedAbilityType === 'flare' || selectedAbilityType === 'shock_bomb' || selectedAbilityType === 'smokescreen') {
                            embedAbility.addFields({
                                name: 'Duration',
                                value: `${formatNumber(stats.duration)}s`,
                                inline: true
                            }, {
                                name: 'Energy Cost',
                                value: formatNumber(abilityData.energyCost),
                                inline: true
                            }, {
                                name: `Energy Cost Increase per ${abilityData.name}`,
                                value: formatNumber(abilityData.energyCostIncreasePerUse),
                                inline: true
                            }, {
                                name: 'Research Cost',
                                value: `Gold: ${formatNumber(researchCost.gold) || 'N/A'}`,
                                inline: true
                            }, {
                                name: 'Research Time',
                                value: `${levelData.upgradeTime || 'N/A'}`,
                                inline: true
                            }, {
                                name: 'Armory Level Required',
                                value: armoryRequired.toString(),
                                inline: true
                            });
                        } else if (selectedAbilityType === 'medkit') {
                            embedAbility.addFields({
                                name: 'Healing per Pulse',
                                value: formatNumber(stats.healingPerPulse),
                                inline: true
                            }, {
                                name: 'Total Heal',
                                value: formatNumber(stats.totalHeal),
                                inline: true
                            }, {
                                name: 'Energy Cost',
                                value: formatNumber(abilityData.energyCost),
                                inline: true
                            }, {
                                name: `Energy Cost Increase per ${abilityData.name}`,
                                value: formatNumber(abilityData.energyCostIncreasePerUse),
                                inline: true
                            }, {
                                name: 'Healing Radius',
                                value: `${formatNumber(abilityData.healingRadius)} Tiles`,
                                inline: true
                            }, {
                                name: 'Duration',
                                value: `${formatNumber(abilityData.duration)}s`,
                                inline: true
                            }, {
                                name: 'Research Cost',
                                value: `Gold: ${formatNumber(researchCost.gold)}`,
                                inline: true
                            }, {
                                name: 'Research Time',
                                value: `${levelData.upgradeTime || 'N/A'}`,
                                inline: true
                            }, {
                                name: 'Armory Level Required',
                                value: armoryRequired.toString(),
                                inline: true
                            });
                        } else if (selectedAbilityType === 'barrage') {
                            embedAbility.addFields({
                                name: 'Number of Projectiles',
                                value: formatNumber(abilityData.numProjectiles),
                                inline: true
                            }, {
                                name: 'Missile Damage',
                                value: formatNumber(stats.missileDamage),
                                inline: true
                            }, {
                                name: 'Total Damage',
                                value: formatNumber(stats.totalDamage),
                                inline: true
                            }, {
                                name: 'Energy Cost',
                                value: formatNumber(abilityData.energyCost),
                                inline: true
                            }, {
                                name: `Energy Cost Increase per ${abilityData.name}`,
                                value: formatNumber(abilityData.energyCostIncreasePerUse),
                                inline: true
                            }, {
                                name: 'Impact Radius',
                                value: `${formatNumber(abilityData.impactRadius)} Tiles`,
                                inline: true
                            }, {
                                name: 'Missile Explosion Radius',
                                value: `${formatNumber(abilityData.missileExplosionRadius)} Tiles`,
                                inline: true
                            }, {
                                name: 'Research Cost',
                                value: `Gold: ${formatNumber(researchCost.gold)}`,
                                inline: true
                            }, {
                                name: 'Research Time',
                                value: `${levelData.upgradeTime || 'N/A'}`,
                                inline: true
                            }, {
                                name: 'Armory Level Required',
                                value: armoryRequired.toString(),
                                inline: true
                            });
                        } else if (selectedAbilityType === 'critters') {
                            embedAbility.addFields({
                                name: 'Amount of Critters',
                                value: `${formatNumber(stats.amountOfCritters)}`,
                                inline: true
                            }, {
                                name: 'Critter Health',
                                value: `${formatNumber(abilityData.critterHealth)}`,
                                inline: true
                            }, {
                                name: 'Critter Damage',
                                value: `${formatNumber(abilityData.critterDamage)}`,
                                inline: true
                            }, {
                                name: 'Critter Range',
                                value: `${formatNumber(abilityData.critterAttackRange)} Tiles`,
                                inline: true
                            }, {
                                name: 'Critter DPS',
                                value: `${formatNumber(critterDPS)}`,
                                inline: true
                            }, {
                                name: 'Energy Cost',
                                value: formatNumber(abilityData.energyCost),
                                inline: true
                            }, {
                                name: `Energy Cost Increase per ${abilityData.name}`,
                                value: formatNumber(abilityData.energyCostIncreasePerUse),
                                inline: true
                            }, {
                                name: 'Research Cost',
                                value: `Gold: ${formatNumber(researchCost.gold) || 'N/A'}`,
                                inline: true
                            }, {
                                name: 'Research Time',
                                value: `${levelData.upgradeTime || 'N/A'}`,
                                inline: true
                            }, {
                                name: 'Armory Level Required',
                                value: armoryRequired.toString(),
                                inline: true
                            });
                        } else {
                            return message.reply(`Stat data for the gunboat ability ${abilityData.name} is currently unavailable.`);
                        }

                        await interaction.update({
                            embeds: [embedAbility],
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

                abilityCollector.on('end', async (collected, reason) => {
                    if (reason === 'time' && collected.size === 0) {
                        await reply.edit({
                            content: 'You did not select a gunboat ability in time. Please try again.',
                            embeds: [],
                            components: []
                        });
                    }
                });
            } else {
                const userFriendlyAbilityType = args.slice(0, -1).join(' ').toLowerCase().trim();
                const level = parseInt(args[args.length - 1], 10);

                const abilityType = validAbilityTypes[userFriendlyAbilityType];

                if (!abilityType) {
                    return message.reply(`Invalid ability type! Available types are: ${Object.keys(validAbilityTypes).join(', ')}.`);
                }

                const abilityData = gunboatAbilities[abilityType];

                if (!abilityData) {
                    return message.reply('No data found for the provided gunboat ability.');
                }

                if (isNaN(level) || level < 1 || level > abilityData.maxLevel) {
                    return message.reply(`Invalid level! Please provide a level between 1 and ${abilityData.maxLevel}.`);
                }

                const levelData = abilityData.levels[level];
                if (!levelData) {
                    return message.reply(`No data available for level ${level}.`);
                }

                const stats = levelData.stats || {};
                const researchCost = levelData.researchCost || {
                    gold: 0
                };
                const armoryRequired = levelData.armoryRequired || 'N/A';
                const critterDPS = abilityData.critterAttackSpeed ? (abilityData.critterDamage / (abilityData.critterAttackSpeed / 1000)).toFixed(2) : 'Unknown';

                const embedAbility = new EmbedBuilder()
                    .setTitle(`${abilityData.name} - Level ${level}`)
                    .setDescription(abilityData.description || 'No description available.')
                    .setColor('#0099ff');

                if (abilityData.image) {
                    embedAbility.setThumbnail(abilityData.image);
                }

                // Handle unique stats for gunboat abilities
                if (abilityType === 'artillery') {
                    embedAbility.addFields({
                        name: 'Damage',
                        value: formatNumber(stats.damage),
                        inline: true
                    }, {
                        name: 'Energy Cost',
                        value: formatNumber(abilityData.energyCost),
                        inline: true
                    }, {
                        name: `Energy Cost Increase per ${abilityData.name}`,
                        value: formatNumber(abilityData.energyCostIncreasePerUse),
                        inline: true
                    }, {
                        name: 'Explosion Radius',
                        value: `${formatNumber(abilityData.explosionRadius)} Tiles`,
                        inline: true
                    }, {
                        name: 'Research Cost',
                        value: `Gold: ${formatNumber(researchCost.gold)}`,
                        inline: true
                    }, {
                        name: 'Research Time',
                        value: `${levelData.upgradeTime || 'N/A'}`,
                        inline: true
                    }, {
                        name: 'Armory Level Required',
                        value: armoryRequired.toString(),
                        inline: true
                    });
                } else if (abilityType === 'flare' || abilityType === 'shock_bomb' || abilityType === 'smokescreen') {
                    embedAbility.addFields({
                        name: 'Duration',
                        value: `${formatNumber(stats.duration)}s`,
                        inline: true
                    }, {
                        name: 'Energy Cost',
                        value: formatNumber(abilityData.energyCost),
                        inline: true
                    }, {
                        name: `Energy Cost Increase per ${abilityData.name}`,
                        value: formatNumber(abilityData.energyCostIncreasePerUse),
                        inline: true
                    }, {
                        name: 'Research Cost',
                        value: `Gold: ${formatNumber(researchCost.gold) || 'N/A'}`,
                        inline: true
                    }, {
                        name: 'Research Time',
                        value: `${levelData.upgradeTime || 'N/A'}`,
                        inline: true
                    }, {
                        name: 'Armory Level Required',
                        value: armoryRequired.toString(),
                        inline: true
                    });
                } else if (abilityType === 'medkit') {
                    embedAbility.addFields({
                        name: 'Healing per Pulse',
                        value: formatNumber(stats.healingPerPulse),
                        inline: true
                    }, {
                        name: 'Total Heal',
                        value: formatNumber(stats.totalHeal),
                        inline: true
                    }, {
                        name: 'Energy Cost',
                        value: formatNumber(abilityData.energyCost),
                        inline: true
                    }, {
                        name: `Energy Cost Increase per ${abilityData.name}`,
                        value: formatNumber(abilityData.energyCostIncreasePerUse),
                        inline: true
                    }, {
                        name: 'Healing Radius',
                        value: `${formatNumber(abilityData.healingRadius)} Tiles`,
                        inline: true
                    }, {
                        name: 'Duration',
                        value: `${formatNumber(abilityData.duration)}s`,
                        inline: true
                    }, {
                        name: 'Research Cost',
                        value: `Gold: ${formatNumber(researchCost.gold)}`,
                        inline: true
                    }, {
                        name: 'Research Time',
                        value: `${levelData.upgradeTime || 'N/A'}`,
                        inline: true
                    }, {
                        name: 'Armory Level Required',
                        value: armoryRequired.toString(),
                        inline: true
                    });
                } else if (abilityType === 'barrage') {
                    embedAbility.addFields({
                        name: 'Number of Projectiles',
                        value: formatNumber(abilityData.numProjectiles),
                        inline: true
                    }, {
                        name: 'Missile Damage',
                        value: formatNumber(stats.missileDamage),
                        inline: true
                    }, {
                        name: 'Total Damage',
                        value: formatNumber(stats.totalDamage),
                        inline: true
                    }, {
                        name: 'Energy Cost',
                        value: formatNumber(abilityData.energyCost),
                        inline: true
                    }, {
                        name: `Energy Cost Increase per ${abilityData.name}`,
                        value: formatNumber(abilityData.energyCostIncreasePerUse),
                        inline: true
                    }, {
                        name: 'Impact Radius',
                        value: `${formatNumber(abilityData.impactRadius)} Tiles`,
                        inline: true
                    }, {
                        name: 'Missile Explosion Radius',
                        value: `${formatNumber(abilityData.missileExplosionRadius)} Tiles`,
                        inline: true
                    }, {
                        name: 'Research Cost',
                        value: `Gold: ${formatNumber(researchCost.gold)}`,
                        inline: true
                    }, {
                        name: 'Research Time',
                        value: `${levelData.upgradeTime || 'N/A'}`,
                        inline: true
                    }, {
                        name: 'Armory Level Required',
                        value: armoryRequired.toString(),
                        inline: true
                    });
                } else if (abilityType === 'critters') {
                    embedAbility.addFields({
                        name: 'Amount of Critters',
                        value: `${formatNumber(stats.amountOfCritters)}`,
                        inline: true
                    }, {
                        name: 'Critter Health',
                        value: `${formatNumber(abilityData.critterHealth)}`,
                        inline: true
                    }, {
                        name: 'Critter Damage',
                        value: `${formatNumber(abilityData.critterDamage)}`,
                        inline: true
                    }, {
                        name: 'Critter Range',
                        value: `${formatNumber(abilityData.critterAttackRange)} Tiles`,
                        inline: true
                    }, {
                        name: 'Critter DPS',
                        value: `${formatNumber(critterDPS)}`,
                        inline: true
                    }, {
                        name: 'Energy Cost',
                        value: formatNumber(abilityData.energyCost),
                        inline: true
                    }, {
                        name: `Energy Cost Increase per ${abilityData.name}`,
                        value: formatNumber(abilityData.energyCostIncreasePerUse),
                        inline: true
                    }, {
                        name: 'Research Cost',
                        value: `Gold: ${formatNumber(researchCost.gold) || 'N/A'}`,
                        inline: true
                    }, {
                        name: 'Research Time',
                        value: `${levelData.upgradeTime || 'N/A'}`,
                        inline: true
                    }, {
                        name: 'Armory Level Required',
                        value: armoryRequired.toString(),
                        inline: true
                    });
                } else {
                    return message.reply(`Stat data for the gunboat ability ${abilityData.name} is currently unavailable.`);
                }

                await message.reply({
                    embeds: [embedAbility]
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
                console.error('Error executing gunboat command:', error);
                message.reply('An error occurred while executing the gunboat command. Please try again later.');
            }
        }
    }
};