const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');
const gunboatAbilities = require('../../data/gunboatAbilities.json');
const {
    formatNumber
} = require('../../utils/formatNumber');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gunboat')
        .setDescription('Get statistics for a specific type of gunboat ability.')
        .addStringOption(option =>
            option.setName('ability_type')
            .setDescription('Type of gunboat ability')
            .setRequired(true)
            .addChoices({
                name: 'Artillery',
                value: 'artillery'
            }, {
                name: 'Flare',
                value: 'flare'
            }, {
                name: 'Medkit',
                value: 'medkit'
            }, {
                name: 'Shock Bomb',
                value: 'shock_bomb'
            }, {
                name: 'Barrage',
                value: 'barrage'
            }, {
                name: 'Smoke Screen',
                value: 'smokescreen'
            }, {
                name: 'Critters',
                value: 'critters'
            })
        )
        .addIntegerOption(option =>
            option.setName('level')
            .setDescription('Level of the gunboat ability')
            .setRequired(true)
        ),
    async execute(interaction) {
        try {
            const abilityType = interaction.options.getString('ability_type');
            const level = interaction.options.getInteger('level');
            const abilityData = gunboatAbilities[abilityType];

            if (!abilityData) {
                return interaction.reply({
                    content: 'Invalid gunboat ability!',
                    ephemeral: true
                });
            }

            if (level < 1 || level > (abilityData.maxLevel || 1)) {
                return interaction.reply({
                    content: `Invalid level! Please provide a level between 1 and ${abilityData.maxLevel}.`,
                    ephemeral: true
                });
            }

            const levelData = abilityData.levels[level];
            if (!levelData) {
                return interaction.reply({
                    content: `No data available for level ${level}.`,
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
                return interaction.reply(`Stat data for the gunboat ability ${abilityData.name} is currently unavailable.`);
            }

            await interaction.reply({
                embeds: [embedAbility]
            });
        } catch (error) {
            if (error.code === 10008) {
                return interaction.followUp(`The gunboat embed was deleted and couldn't be recovered, please try again later.`);
            } else if (error.code === 10062) {
                return interaction.followUp("My systematic networking is currently out of sync and timed out. Please try again later.");
            } else if (error.code === 40060) {
                return interaction.followUp("I couldn't reuse this interaction as I've already acknowledged it. Please try again later.");
            } else if (error.status === 403 || error.status === 404 || error.status === 503 || error.status === 520) {
                return interaction.followUp("An unexpected error occurred. Please try again later.");
            } else if (error.message.includes("Interaction was not replied")) {
                return interaction.followUp("An interaction error occurred. Please try again later.");
            } else {
                console.error('Error executing gunboat command:', error);
                interaction.reply('An error occurred while executing the gunboat command. Please try again later.');
            }
        }
    },
}