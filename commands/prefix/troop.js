const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    PermissionsBitField,
    ComponentType,
} = require("discord.js");
const troops = require("../../data/troops.json");
const { formatNumber } = require("../../utils/formatNumber");

const validTroopTypes = {
    rifleman: "rifleman",
    heavy: "heavy",
    zooka: "zooka",
    warrior: "warrior",
    tank: "tank",
    medic: "medic",
    grenadier: "grenadier",
    scorcher: "scorcher",
    "laser ranger": "laser_ranger",
    cryoneer: "cryoneer",
    bombardier: "bombardier",
    mech: "mech",
};

module.exports = {
    name: "troop",
    description: "Get statistics for a specific type of troop.",
    permissions: [
        "SendMessages",
        "ViewChannel",
        "ReadMessageHistory",
        "EmbedLinks",
    ],
    args: false,
    usage: "<troop_type> <level>",

    async execute(message, args) {
        // Check bot permissions
        const botPermissions = message.channel.permissionsFor(
            message.guild.members.me,
        );
        const requiredPermissions = new PermissionsBitField([
            "SendMessages",
            "ViewChannel",
            "ReadMessageHistory",
            "EmbedLinks",
        ]);

        if (!botPermissions.has(requiredPermissions)) {
            return message.reply(
                "I don't have the necessary permissions to execute this command. Please make sure I have `SEND_MESSAGES`, `VIEW_CHANNEL`, `READ_MESSAGE_HISTORY`, and `EMBED_LINKS` permissions.",
            );
        }

        try {
            if (args.length === 0) {
                // Display list of troop types
                const troopOptions = Object.keys(validTroopTypes).map(
                    (troopKey) => {
                        const troop = troops[validTroopTypes[troopKey]];
                        const description =
                            troop && troop.description
                                ? troop.description.substring(0, 100)
                                : "No description available.";
                        return new StringSelectMenuOptionBuilder()
                            .setLabel(
                                troopKey.charAt(0).toUpperCase() +
                                    troopKey.slice(1),
                            )
                            .setValue(troopKey)
                            .setDescription(description);
                    },
                );

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId("select-troop-type")
                    .setPlaceholder("Select a troop type")
                    .addOptions(troopOptions);

                const row = new ActionRowBuilder().addComponents(selectMenu);

                const embed = new EmbedBuilder()
                    .setTitle("Select a Troop Type")
                    .setDescription(
                        "Please choose a troop type to view its details.",
                    )
                    .setColor("#0099ff");

                const reply = await message.reply({
                    embeds: [embed],
                    components: [row],
                });

                const filter = (interaction) =>
                    interaction.user.id === message.author.id;
                const troopCollector = reply.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    time: 30000,
                });

                troopCollector.on("collect", async (interaction) => {
                    if (interaction.customId !== "select-troop-type") return;

                    if (interaction.user.id !== message.author.id) {
                        return interaction.reply({
                            content: `Only ${message.author.username} can use this selection menu!`,
                            ephemeral: true,
                        });
                    }

                    const selectedTroopType = interaction.values[0];
                    const troopData = troops[selectedTroopType];

                    if (!troopData) {
                        return interaction.reply({
                            content: "Invalid troop type!",
                            ephemeral: true,
                        });
                    }

                    const maxOptions = 25;
                    const levels = Array.from(
                        {
                            length: troopData.maxLevel,
                        },
                        (_, i) => i + 1,
                    );
                    const levelOptions = levels
                        .slice(0, maxOptions)
                        .map((level) => {
                            return new StringSelectMenuOptionBuilder()
                                .setLabel(`Level ${level}`)
                                .setValue(`${selectedTroopType}-${level}`)
                                .setDescription(
                                    troopData.levels[level]?.armoryRequired
                                        ? `Armory Level ${troopData.levels[level].armoryRequired}`
                                        : "No details available.",
                                );
                        });

                    const troopLevelSelectMenu = new StringSelectMenuBuilder()
                        .setCustomId("select-troop-level")
                        .setPlaceholder("Select a level")
                        .addOptions(levelOptions);

                    const levelRow = new ActionRowBuilder().addComponents(
                        troopLevelSelectMenu,
                    );
                    const levelEmbed = new EmbedBuilder()
                        .setTitle(`Select a Level for ${troopData.name}`)
                        .setDescription(
                            "Please choose a level to view its details.",
                        )
                        .setColor("#0099ff");

                    const levelFilter = (response) =>
                        response.author.id === message.author.id;
                    const levelCollector =
                        interaction.channel.createMessageComponentCollector({
                            componentType: ComponentType.StringSelect,
                            time: 30000,
                        });

                    await interaction.update({
                        embeds: [levelEmbed],
                        components: [levelRow],
                    });

                    levelCollector.on("collect", async (interaction) => {
                        if (interaction.customId !== "select-troop-level")
                            return;

                        if (interaction.user.id !== message.author.id) {
                            return interaction.reply({
                                content: `Only ${message.author.username} can use this selection menu!`,
                                ephemeral: true,
                            });
                        }

                        const [selectedTroopType, level] =
                            interaction.values[0].split("-");
                        const levelNum = parseInt(level, 10);

                        if (
                            isNaN(levelNum) ||
                            levelNum < 1 ||
                            levelNum > troopData.maxLevel
                        ) {
                            return interaction.reply({
                                content: `Invalid level! Please provide a level between 1 and ${troopData.maxLevel}.`,
                                ephemeral: true,
                            });
                        }

                        const levelData = troopData.levels[level];

                        if (!levelData) {
                            return interaction.reply({
                                content: "No data available for this level!",
                                ephemeral: true,
                            });
                        }

                        const stats = levelData.stats || {};
                        const trainingCost = levelData.trainingCost || {
                            gold: 0,
                        };
                        const researchCost = levelData.researchCost || {
                            gold: 0,
                        };
                        const range = troopData.attackRange || 0;
                        const attackSpeed = troopData.attackSpeed || 0;
                        const dps = attackSpeed
                            ? (stats.damage / (attackSpeed / 1000)).toFixed(2)
                            : "Unknown";
                        const hps = attackSpeed
                            ? (stats.healing / (attackSpeed / 1000)).toFixed(2)
                            : "Unknown";
                        const armoryRequired =
                            levelData.armoryRequired || "N/A";
                        const upgradeTime = levelData.upgradeTime || "N/A";

                        const embedTroop = new EmbedBuilder()
                            .setTitle(`${troopData.name} - Level ${level}`)
                            .setDescription(
                                troopData.description ||
                                    "No description available.",
                            )
                            .setColor("#0099ff");

                        if (troopData.image) {
                            embedTroop.setThumbnail(troopData.image);
                        }

                        // Handle unique stats for certain troops
                        if (selectedTroopType === "warrior") {
                            embedTroop.addFields(
                                {
                                    name: "Health",
                                    value: formatNumber(stats.health),
                                    inline: true,
                                },
                                {
                                    name: "DPS",
                                    value: formatNumber(dps),
                                    inline: true,
                                },
                                {
                                    name: "Damage Per Shot",
                                    value: formatNumber(stats.damage),
                                    inline: true,
                                },
                                {
                                    name: "Healing per Attack",
                                    value: formatNumber(stats.selfHeal),
                                    inline: true,
                                },
                                {
                                    name: "Training Cost",
                                    value: `Gold: ${formatNumber(trainingCost.gold)}`,
                                    inline: true,
                                },
                                {
                                    name: "Research Cost",
                                    value: `Gold: ${formatNumber(researchCost.gold)}`,
                                    inline: true,
                                },
                                {
                                    name: "Unit Size",
                                    value: formatNumber(troopData.unitSize),
                                    inline: true,
                                },
                                {
                                    name: "Training Time",
                                    value: troopData.trainingTime || "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Movement Speed",
                                    value: troopData.movementSpeed || "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Attack Range",
                                    value: `${formatNumber(range)} Tiles`,
                                    inline: true,
                                },
                                {
                                    name: "Attack Speed",
                                    value:
                                        attackSpeed !== "Unknown"
                                            ? `${formatNumber(attackSpeed)}ms`
                                            : "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Armory Level Required",
                                    value: armoryRequired.toString(),
                                    inline: true,
                                },
                            );
                        } else if (selectedTroopType === "medic") {
                            embedTroop.addFields(
                                {
                                    name: "Health",
                                    value: formatNumber(stats.health),
                                    inline: true,
                                },
                                {
                                    name: "Healing Per Second",
                                    value: formatNumber(hps),
                                    inline: true,
                                },
                                {
                                    name: "Healing Per Shot",
                                    value: formatNumber(stats.healing),
                                    inline: true,
                                },
                                {
                                    name: "Training Cost",
                                    value: `Gold: ${formatNumber(trainingCost.gold)}`,
                                    inline: true,
                                },
                                {
                                    name: "Research Cost",
                                    value: `Gold: ${formatNumber(researchCost.gold)}`,
                                    inline: true,
                                },
                                {
                                    name: "Unit Size",
                                    value: formatNumber(troopData.unitSize),
                                    inline: true,
                                },
                                {
                                    name: "Training Time",
                                    value: troopData.trainingTime || "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Movement Speed",
                                    value: troopData.movementSpeed || "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Heal Range",
                                    value: `${formatNumber(range)} Tiles`,
                                    inline: true,
                                },
                                {
                                    name: "Heal Speed",
                                    value:
                                        attackSpeed !== "Unknown"
                                            ? `${formatNumber(attackSpeed)}ms`
                                            : "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Heal Type",
                                    value: `Splash (${formatNumber(troopData.splashRadius)} Tiles)`,
                                    inline: true,
                                },
                                {
                                    name: "Armory Level Required",
                                    value: armoryRequired.toString(),
                                    inline: true,
                                },
                            );
                        } else if (selectedTroopType === "cryoneer") {
                            embedTroop.addFields(
                                {
                                    name: "Health",
                                    value: formatNumber(stats.health),
                                    inline: true,
                                },
                                {
                                    name: "DPS",
                                    value: formatNumber(dps),
                                    inline: true,
                                },
                                {
                                    name: "Damage Per Shot",
                                    value: formatNumber(stats.damage),
                                    inline: true,
                                },
                                {
                                    name: "Freeze Power",
                                    value: `${formatNumber(troopData.speedReduction)}%`,
                                    inline: true,
                                },
                                {
                                    name: "Freeze Duration",
                                    value: `${formatNumber(troopData.freezeDuration)} seconds`,
                                    inline: true,
                                },
                                {
                                    name: "Beam Extension",
                                    value: `${formatNumber(stats.beamExtension)}%`,
                                    inline: true,
                                },
                                {
                                    name: "Training Cost",
                                    value: `Gold: ${formatNumber(trainingCost.gold)}`,
                                    inline: true,
                                },
                                {
                                    name: "Research Cost",
                                    value: `Gold: ${formatNumber(researchCost.gold)}`,
                                    inline: true,
                                },
                                {
                                    name: "Unit Size",
                                    value: formatNumber(troopData.unitSize),
                                    inline: true,
                                },
                                {
                                    name: "Training Time",
                                    value: troopData.trainingTime || "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Movement Speed",
                                    value: troopData.movementSpeed || "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Attack Range",
                                    value: `${formatNumber(range)} Tiles`,
                                    inline: true,
                                },
                                {
                                    name: "Attack Speed",
                                    value:
                                        attackSpeed !== "Unknown"
                                            ? `${formatNumber(attackSpeed)}ms`
                                            : "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Armory Level Required",
                                    value: armoryRequired.toString(),
                                    inline: true,
                                },
                            );
                        } else if (
                            selectedTroopType === "grenadier" ||
                            selectedTroopType === "bombardier"
                        ) {
                            embedTroop.addFields(
                                {
                                    name: "Health",
                                    value: formatNumber(stats.health),
                                    inline: true,
                                },
                                {
                                    name: "DPS",
                                    value: formatNumber(dps),
                                    inline: true,
                                },
                                {
                                    name: "Damage Per Shot",
                                    value: formatNumber(stats.damage),
                                    inline: true,
                                },
                                {
                                    name: "Splash Radius",
                                    value: `${formatNumber(troopData.splashRadius)} Tiles`,
                                    inline: true,
                                },
                                {
                                    name: "Training Cost",
                                    value: `Gold: ${formatNumber(trainingCost.gold)}`,
                                    inline: true,
                                },
                                {
                                    name: "Research Cost",
                                    value: `Gold: ${formatNumber(researchCost.gold)}`,
                                    inline: true,
                                },
                                {
                                    name: "Unit Size",
                                    value: formatNumber(troopData.unitSize),
                                    inline: true,
                                },
                                {
                                    name: "Training Time",
                                    value: troopData.trainingTime || "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Movement Speed",
                                    value: troopData.movementSpeed || "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Attack Range",
                                    value: `${formatNumber(range)} Tiles`,
                                    inline: true,
                                },
                                {
                                    name: "Attack Speed",
                                    value:
                                        attackSpeed !== "Unknown"
                                            ? `${formatNumber(attackSpeed)}ms`
                                            : "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Armory Level Required",
                                    value: armoryRequired.toString(),
                                    inline: true,
                                },
                            );
                        } else if (selectedTroopType === "scorcher") {
                            embedTroop.addFields(
                                {
                                    name: "Health",
                                    value: formatNumber(stats.health),
                                    inline: true,
                                },
                                {
                                    name: "DPS",
                                    value: formatNumber(dps),
                                    inline: true,
                                },
                                {
                                    name: "Damage Per Shot",
                                    value: formatNumber(stats.damage),
                                    inline: true,
                                },
                                {
                                    name: "Death Damage",
                                    value: `${formatNumber(stats.deathDamage)}`,
                                    inline: true,
                                },
                                {
                                    name: "Death Radius",
                                    value: `${formatNumber(troopData.deathRadius)} Tiles`,
                                    inline: true,
                                },
                                {
                                    name: "Training Cost",
                                    value: `Gold: ${formatNumber(trainingCost.gold)}`,
                                    inline: true,
                                },
                                {
                                    name: "Research Cost",
                                    value: `Gold: ${formatNumber(researchCost.gold)}`,
                                    inline: true,
                                },
                                {
                                    name: "Unit Size",
                                    value: formatNumber(troopData.unitSize),
                                    inline: true,
                                },
                                {
                                    name: "Training Time",
                                    value: troopData.trainingTime || "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Movement Speed",
                                    value: troopData.movementSpeed || "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Attack Range",
                                    value: `${formatNumber(range)} Tiles`,
                                    inline: true,
                                },
                                {
                                    name: "Attack Speed",
                                    value:
                                        attackSpeed !== "Unknown"
                                            ? `${formatNumber(attackSpeed)}ms`
                                            : "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Armory Level Required",
                                    value: armoryRequired.toString(),
                                    inline: true,
                                },
                            );
                        } else if (selectedTroopType === "laser_ranger") {
                            embedTroop.addFields(
                                {
                                    name: "Health",
                                    value: formatNumber(stats.health),
                                    inline: true,
                                },
                                {
                                    name: "DPS",
                                    value: formatNumber(dps),
                                    inline: true,
                                },
                                {
                                    name: "Damage Per Shot",
                                    value: formatNumber(stats.damage),
                                    inline: true,
                                },
                                {
                                    name: "Beam Extension",
                                    value: `${formatNumber(stats.beamExtension)}%`,
                                    inline: true,
                                },
                                {
                                    name: "Training Cost",
                                    value: `Gold: ${formatNumber(trainingCost.gold)}`,
                                    inline: true,
                                },
                                {
                                    name: "Research Cost",
                                    value: `Gold: ${formatNumber(researchCost.gold)}`,
                                    inline: true,
                                },
                                {
                                    name: "Unit Size",
                                    value: formatNumber(troopData.unitSize),
                                    inline: true,
                                },
                                {
                                    name: "Training Time",
                                    value: troopData.trainingTime || "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Movement Speed",
                                    value: troopData.movementSpeed || "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Attack Range",
                                    value: `${formatNumber(range)} Tiles`,
                                    inline: true,
                                },
                                {
                                    name: "Attack Speed",
                                    value:
                                        attackSpeed !== "Unknown"
                                            ? `${formatNumber(attackSpeed)}ms`
                                            : "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Armory Level Required",
                                    value: armoryRequired.toString(),
                                    inline: true,
                                },
                            );
                        } else if (selectedTroopType === "mech") {
                            embedTroop.addFields(
                                {
                                    name: "Health",
                                    value: formatNumber(stats.health),
                                    inline: true,
                                },
                                {
                                    name: "DPS",
                                    value: formatNumber(dps),
                                    inline: true,
                                },
                                {
                                    name: "Damage Per Shot",
                                    value: formatNumber(stats.damage),
                                    inline: true,
                                },
                                {
                                    name: "Splash Radius",
                                    value: `${formatNumber(troopData.splashRadius)} Tiles`,
                                    inline: true,
                                },
                                {
                                    name: "Shock Duration",
                                    value: `${formatNumber(troopData.stunDuration)}s`,
                                    inline: true,
                                },
                                {
                                    name: "Training Cost",
                                    value: `Gold: ${formatNumber(trainingCost.gold)}`,
                                    inline: true,
                                },
                                {
                                    name: "Research Cost",
                                    value: `Gold: ${formatNumber(researchCost.gold)}`,
                                    inline: true,
                                },
                                {
                                    name: "Unit Size",
                                    value: formatNumber(troopData.unitSize),
                                    inline: true,
                                },
                                {
                                    name: "Training Time",
                                    value: troopData.trainingTime || "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Movement Speed",
                                    value: troopData.movementSpeed || "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Attack Range",
                                    value: `${formatNumber(range)} Tiles`,
                                    inline: true,
                                },
                                {
                                    name: "Attack Speed",
                                    value:
                                        attackSpeed !== "Unknown"
                                            ? `${formatNumber(attackSpeed)}ms`
                                            : "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Armory Level Required",
                                    value: armoryRequired.toString(),
                                    inline: true,
                                },
                            );
                        } else {
                            embedTroop.addFields(
                                {
                                    name: "Health",
                                    value: formatNumber(stats.health),
                                    inline: true,
                                },
                                {
                                    name: "DPS",
                                    value: formatNumber(dps),
                                    inline: true,
                                },
                                {
                                    name: "Damage Per Shot",
                                    value: formatNumber(stats.damage),
                                    inline: true,
                                },
                                {
                                    name: "Training Cost",
                                    value: `Gold: ${formatNumber(trainingCost.gold)}`,
                                    inline: true,
                                },
                                {
                                    name: "Research Cost",
                                    value: `Gold: ${formatNumber(researchCost.gold)}`,
                                    inline: true,
                                },
                                {
                                    name: "Unit Size",
                                    value: formatNumber(troopData.unitSize),
                                    inline: true,
                                },
                                {
                                    name: "Training Time",
                                    value: troopData.trainingTime || "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Movement Speed",
                                    value: troopData.movementSpeed || "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Attack Range",
                                    value: `${formatNumber(range)} Tiles`,
                                    inline: true,
                                },
                                {
                                    name: "Attack Speed",
                                    value:
                                        attackSpeed !== "Unknown"
                                            ? `${formatNumber(attackSpeed)}ms`
                                            : "Unknown",
                                    inline: true,
                                },
                                {
                                    name: "Armory Level Required",
                                    value: armoryRequired.toString(),
                                    inline: true,
                                },
                            );
                        }

                        await interaction.update({
                            embeds: [embedTroop],
                            components: [],
                        });
                        levelCollector.stop();
                    });

                    levelCollector.on("end", async (collected, reason) => {
                        if (reason === "time" && collected.size === 0) {
                            await reply.edit({
                                content:
                                    "You did not select a level in time. Please try again.",
                                embeds: [],
                                components: [],
                            });
                        }
                    });
                });

                troopCollector.on("end", async (collected, reason) => {
                    if (reason === "time" && collected.size === 0) {
                        await reply.edit({
                            content:
                                "You did not select a troop type in time. Please try again.",
                            embeds: [],
                            components: [],
                        });
                    }
                });
            } else {
                const userFriendlyTroopType = args
                    .slice(0, -1)
                    .join(" ")
                    .toLowerCase()
                    .trim();
                const level = parseInt(args[args.length - 1], 10);

                const troopType = validTroopTypes[userFriendlyTroopType];

                if (!troopType) {
                    return message.reply(
                        `Invalid troop type! Available types are: ${Object.keys(validTroopTypes).join(", ")}.`,
                    );
                }

                const troopData = troops[troopType];

                if (!troopData) {
                    return message.reply(
                        "No data found for the provided troop type.",
                    );
                }

                if (isNaN(level) || level < 1 || level > troopData.maxLevel) {
                    return message.reply(
                        `Invalid level! Please provide a level between 1 and ${troopData.maxLevel}.`,
                    );
                }

                const levelData = troopData.levels[level];
                if (!levelData) {
                    return message.reply(
                        `No data available for level ${level}.`,
                    );
                }

                const stats = levelData.stats || {};
                const trainingCost = levelData.trainingCost || {
                    gold: 0,
                };
                const researchCost = levelData.researchCost || {
                    gold: 0,
                };
                const range = troopData.attackRange || 0;
                const attackSpeed = troopData.attackSpeed || 0;
                const dps = attackSpeed
                    ? (stats.damage / (attackSpeed / 1000)).toFixed(2)
                    : "Unknown";
                const hps = attackSpeed
                    ? (stats.healing / (attackSpeed / 1000)).toFixed(2)
                    : "Unknown";
                const armoryRequired = levelData.armoryRequired || "N/A";
                const upgradeTime = levelData.upgradeTime || "N/A";

                const embedTroop = new EmbedBuilder()
                    .setTitle(`${troopData.name} - Level ${level}`)
                    .setDescription(
                        troopData.description || "No description available.",
                    )
                    .setColor("#0099ff");

                if (troopData.image) {
                    embedTroop.setThumbnail(troopData.image);
                }

                // Handle unique stats for certain troops
                if (troopType === "warrior") {
                    embedTroop.addFields(
                        {
                            name: "Health",
                            value: formatNumber(stats.health),
                            inline: true,
                        },
                        {
                            name: "DPS",
                            value: formatNumber(dps),
                            inline: true,
                        },
                        {
                            name: "Damage Per Shot",
                            value: formatNumber(stats.damage),
                            inline: true,
                        },
                        {
                            name: "Healing per Attack",
                            value: formatNumber(stats.selfHeal),
                            inline: true,
                        },
                        {
                            name: "Training Cost",
                            value: `Gold: ${formatNumber(trainingCost.gold)}`,
                            inline: true,
                        },
                        {
                            name: "Research Cost",
                            value: `Gold: ${formatNumber(researchCost.gold)}`,
                            inline: true,
                        },
                        {
                            name: "Unit Size",
                            value: formatNumber(troopData.unitSize),
                            inline: true,
                        },
                        {
                            name: "Training Time",
                            value: troopData.trainingTime || "Unknown",
                            inline: true,
                        },
                        {
                            name: "Movement Speed",
                            value: troopData.movementSpeed || "Unknown",
                            inline: true,
                        },
                        {
                            name: "Attack Range",
                            value: `${formatNumber(range)} Tiles`,
                            inline: true,
                        },
                        {
                            name: "Attack Speed",
                            value:
                                attackSpeed !== "Unknown"
                                    ? `${formatNumber(attackSpeed)}ms`
                                    : "Unknown",
                            inline: true,
                        },
                        {
                            name: "Armory Level Required",
                            value: armoryRequired.toString(),
                            inline: true,
                        },
                    );
                } else if (troopType === "medic") {
                    embedTroop.addFields(
                        {
                            name: "Health",
                            value: formatNumber(stats.health),
                            inline: true,
                        },
                        {
                            name: "Healing Per Second",
                            value: formatNumber(hps),
                            inline: true,
                        },
                        {
                            name: "Healing Per Shot",
                            value: formatNumber(stats.healing),
                            inline: true,
                        },
                        {
                            name: "Training Cost",
                            value: `Gold: ${formatNumber(trainingCost.gold)}`,
                            inline: true,
                        },
                        {
                            name: "Research Cost",
                            value: `Gold: ${formatNumber(researchCost.gold)}`,
                            inline: true,
                        },
                        {
                            name: "Unit Size",
                            value: formatNumber(troopData.unitSize),
                            inline: true,
                        },
                        {
                            name: "Training Time",
                            value: troopData.trainingTime || "Unknown",
                            inline: true,
                        },
                        {
                            name: "Movement Speed",
                            value: troopData.movementSpeed || "Unknown",
                            inline: true,
                        },
                        {
                            name: "Heal Range",
                            value: `${formatNumber(range)} Tiles`,
                            inline: true,
                        },
                        {
                            name: "Heal Speed",
                            value:
                                attackSpeed !== "Unknown"
                                    ? `${formatNumber(attackSpeed)}ms`
                                    : "Unknown",
                            inline: true,
                        },
                        {
                            name: "Heal Type",
                            value: `Splash (${formatNumber(troopData.splashRadius)} Tiles)`,
                            inline: true,
                        },
                        {
                            name: "Armory Level Required",
                            value: armoryRequired.toString(),
                            inline: true,
                        },
                    );
                } else if (troopType === "cryoneer") {
                    embedTroop.addFields(
                        {
                            name: "Health",
                            value: formatNumber(stats.health),
                            inline: true,
                        },
                        {
                            name: "DPS",
                            value: formatNumber(dps),
                            inline: true,
                        },
                        {
                            name: "Damage Per Shot",
                            value: formatNumber(stats.damage),
                            inline: true,
                        },
                        {
                            name: "Freeze Power",
                            value: `${formatNumber(troopData.speedReduction)}%`,
                            inline: true,
                        },
                        {
                            name: "Freeze Duration",
                            value: `${formatNumber(troopData.freezeDuration)} seconds`,
                            inline: true,
                        },
                        {
                            name: "Beam Extension",
                            value: `${formatNumber(stats.beamExtension)}%`,
                            inline: true,
                        },
                        {
                            name: "Training Cost",
                            value: `Gold: ${formatNumber(trainingCost.gold)}`,
                            inline: true,
                        },
                        {
                            name: "Research Cost",
                            value: `Gold: ${formatNumber(researchCost.gold)}`,
                            inline: true,
                        },
                        {
                            name: "Unit Size",
                            value: formatNumber(troopData.unitSize),
                            inline: true,
                        },
                        {
                            name: "Training Time",
                            value: troopData.trainingTime || "Unknown",
                            inline: true,
                        },
                        {
                            name: "Movement Speed",
                            value: troopData.movementSpeed || "Unknown",
                            inline: true,
                        },
                        {
                            name: "Attack Range",
                            value: `${formatNumber(range)} Tiles`,
                            inline: true,
                        },
                        {
                            name: "Attack Speed",
                            value:
                                attackSpeed !== "Unknown"
                                    ? `${formatNumber(attackSpeed)}ms`
                                    : "Unknown",
                            inline: true,
                        },
                        {
                            name: "Armory Level Required",
                            value: armoryRequired.toString(),
                            inline: true,
                        },
                    );
                } else if (
                    troopType === "grenadier" ||
                    troopType === "bombardier"
                ) {
                    embedTroop.addFields(
                        {
                            name: "Health",
                            value: formatNumber(stats.health),
                            inline: true,
                        },
                        {
                            name: "DPS",
                            value: formatNumber(dps),
                            inline: true,
                        },
                        {
                            name: "Damage Per Shot",
                            value: formatNumber(stats.damage),
                            inline: true,
                        },
                        {
                            name: "Splash Radius",
                            value: `${formatNumber(troopData.splashRadius)} Tiles`,
                            inline: true,
                        },
                        {
                            name: "Training Cost",
                            value: `Gold: ${formatNumber(trainingCost.gold)}`,
                            inline: true,
                        },
                        {
                            name: "Research Cost",
                            value: `Gold: ${formatNumber(researchCost.gold)}`,
                            inline: true,
                        },
                        {
                            name: "Unit Size",
                            value: formatNumber(troopData.unitSize),
                            inline: true,
                        },
                        {
                            name: "Training Time",
                            value: troopData.trainingTime || "Unknown",
                            inline: true,
                        },
                        {
                            name: "Movement Speed",
                            value: troopData.movementSpeed || "Unknown",
                            inline: true,
                        },
                        {
                            name: "Attack Range",
                            value: `${formatNumber(range)} Tiles`,
                            inline: true,
                        },
                        {
                            name: "Attack Speed",
                            value:
                                attackSpeed !== "Unknown"
                                    ? `${formatNumber(attackSpeed)}ms`
                                    : "Unknown",
                            inline: true,
                        },
                        {
                            name: "Armory Level Required",
                            value: armoryRequired.toString(),
                            inline: true,
                        },
                    );
                } else if (troopType === "scorcher") {
                    embedTroop.addFields(
                        {
                            name: "Health",
                            value: formatNumber(stats.health),
                            inline: true,
                        },
                        {
                            name: "DPS",
                            value: formatNumber(dps),
                            inline: true,
                        },
                        {
                            name: "Damage Per Shot",
                            value: formatNumber(stats.damage),
                            inline: true,
                        },
                        {
                            name: "Death Damage",
                            value: `${formatNumber(stats.deathDamage)}`,
                            inline: true,
                        },
                        {
                            name: "Death Radius",
                            value: `${formatNumber(troopData.deathRadius)} Tiles`,
                            inline: true,
                        },
                        {
                            name: "Training Cost",
                            value: `Gold: ${formatNumber(trainingCost.gold)}`,
                            inline: true,
                        },
                        {
                            name: "Research Cost",
                            value: `Gold: ${formatNumber(researchCost.gold)}`,
                            inline: true,
                        },
                        {
                            name: "Unit Size",
                            value: formatNumber(troopData.unitSize),
                            inline: true,
                        },
                        {
                            name: "Training Time",
                            value: troopData.trainingTime || "Unknown",
                            inline: true,
                        },
                        {
                            name: "Movement Speed",
                            value: troopData.movementSpeed || "Unknown",
                            inline: true,
                        },
                        {
                            name: "Attack Range",
                            value: `${formatNumber(range)} Tiles`,
                            inline: true,
                        },
                        {
                            name: "Attack Speed",
                            value:
                                attackSpeed !== "Unknown"
                                    ? `${formatNumber(attackSpeed)}ms`
                                    : "Unknown",
                            inline: true,
                        },
                        {
                            name: "Armory Level Required",
                            value: armoryRequired.toString(),
                            inline: true,
                        },
                    );
                } else if (troopType === "laser_ranger") {
                    embedTroop.addFields(
                        {
                            name: "Health",
                            value: formatNumber(stats.health),
                            inline: true,
                        },
                        {
                            name: "DPS",
                            value: formatNumber(dps),
                            inline: true,
                        },
                        {
                            name: "Damage Per Shot",
                            value: formatNumber(stats.damage),
                            inline: true,
                        },
                        {
                            name: "Beam Extension",
                            value: `${formatNumber(stats.beamExtension)}%`,
                            inline: true,
                        },
                        {
                            name: "Training Cost",
                            value: `Gold: ${formatNumber(trainingCost.gold)}`,
                            inline: true,
                        },
                        {
                            name: "Research Cost",
                            value: `Gold: ${formatNumber(researchCost.gold)}`,
                            inline: true,
                        },
                        {
                            name: "Unit Size",
                            value: formatNumber(troopData.unitSize),
                            inline: true,
                        },
                        {
                            name: "Training Time",
                            value: troopData.trainingTime || "Unknown",
                            inline: true,
                        },
                        {
                            name: "Movement Speed",
                            value: troopData.movementSpeed || "Unknown",
                            inline: true,
                        },
                        {
                            name: "Attack Range",
                            value: `${formatNumber(range)} Tiles`,
                            inline: true,
                        },
                        {
                            name: "Attack Speed",
                            value:
                                attackSpeed !== "Unknown"
                                    ? `${formatNumber(attackSpeed)}ms`
                                    : "Unknown",
                            inline: true,
                        },
                        {
                            name: "Armory Level Required",
                            value: armoryRequired.toString(),
                            inline: true,
                        },
                    );
                } else if (troopType === "mech") {
                    embedTroop.addFields(
                        {
                            name: "Health",
                            value: formatNumber(stats.health),
                            inline: true,
                        },
                        {
                            name: "DPS",
                            value: formatNumber(dps),
                            inline: true,
                        },
                        {
                            name: "Damage Per Shot",
                            value: formatNumber(stats.damage),
                            inline: true,
                        },
                        {
                            name: "Splash Radius",
                            value: `${formatNumber(troopData.splashRadius)} Tiles`,
                            inline: true,
                        },
                        {
                            name: "Shock Duration",
                            value: `${formatNumber(troopData.stunDuration)}s`,
                            inline: true,
                        },
                        {
                            name: "Training Cost",
                            value: `Gold: ${formatNumber(trainingCost.gold)}`,
                            inline: true,
                        },
                        {
                            name: "Research Cost",
                            value: `Gold: ${formatNumber(researchCost.gold)}`,
                            inline: true,
                        },
                        {
                            name: "Unit Size",
                            value: formatNumber(troopData.unitSize),
                            inline: true,
                        },
                        {
                            name: "Training Time",
                            value: troopData.trainingTime || "Unknown",
                            inline: true,
                        },
                        {
                            name: "Movement Speed",
                            value: troopData.movementSpeed || "Unknown",
                            inline: true,
                        },
                        {
                            name: "Attack Range",
                            value: `${formatNumber(range)} Tiles`,
                            inline: true,
                        },
                        {
                            name: "Attack Speed",
                            value:
                                attackSpeed !== "Unknown"
                                    ? `${formatNumber(attackSpeed)}ms`
                                    : "Unknown",
                            inline: true,
                        },
                        {
                            name: "Armory Level Required",
                            value: armoryRequired.toString(),
                            inline: true,
                        },
                    );
                } else {
                    // Handle general troop stats
                    embedTroop.addFields(
                        {
                            name: "Health",
                            value: formatNumber(stats.health),
                            inline: true,
                        },
                        {
                            name: "DPS",
                            value: formatNumber(dps),
                            inline: true,
                        },
                        {
                            name: "Damage Per Shot",
                            value: formatNumber(stats.damage),
                            inline: true,
                        },
                        {
                            name: "Training Cost",
                            value: `Gold: ${formatNumber(trainingCost.gold)}`,
                            inline: true,
                        },
                        {
                            name: "Research Cost",
                            value: `Gold: ${formatNumber(researchCost.gold)}`,
                            inline: true,
                        },
                        {
                            name: "Unit Size",
                            value: formatNumber(troopData.unitSize),
                            inline: true,
                        },
                        {
                            name: "Training Time",
                            value: troopData.trainingTime || "Unknown",
                            inline: true,
                        },
                        {
                            name: "Movement Speed",
                            value: troopData.movementSpeed || "Unknown",
                            inline: true,
                        },
                        {
                            name: "Attack Range",
                            value: `${formatNumber(range)} Tiles`,
                            inline: true,
                        },
                        {
                            name: "Attack Speed",
                            value:
                                attackSpeed !== "Unknown"
                                    ? `${formatNumber(attackSpeed)}ms`
                                    : "Unknown",
                            inline: true,
                        },
                        {
                            name: "Armory Level Required",
                            value: armoryRequired.toString(),
                            inline: true,
                        },
                    );
                }

                await message.reply({
                    embeds: [embedTroop],
                });
            }
        } catch (error) {
            if (error.code === 10008) {
                return message.reply(
                    `I couldn't find the selection menu for ${interaction.customId || "this interaction"}, please try again later.`,
                );
            } else if (error.code === 10062) {
                return message.reply(
                    "My systematic networking is currently out of sync and timed out. Please try again later.",
                );
            } else if (error.code === 40060) {
                return message.reply(
                    "I couldn't reuse this interaction as I've already acknowledged it. Please try again later.",
                );
            } else if (
                error.status === 403 ||
                error.status === 404 ||
                error.status === 503 ||
                error.status === 520
            ) {
                return message.reply(
                    "An unexpected error occurred. Please try again later.",
                );
            } else if (error.message.includes("Interaction was not replied")) {
                return message.reply(
                    "An interaction error occurred. Please try again later.",
                );
            } else {
                console.error("Error executing troop command:", error);
                message.reply(
                    "An error occurred while executing the troop command. Please try again later.",
                );
            }
        }
    },
};