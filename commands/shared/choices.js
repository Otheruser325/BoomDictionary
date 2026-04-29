function toLookupEntries(choice) {
    const normalizedName = choice.name.toLowerCase();
    const normalizedValue = choice.value.toLowerCase();

    return [
        [normalizedName, choice.value],
        [normalizedValue, choice.value],
        [normalizedValue.replace(/_/g, ' '), choice.value],
    ];
}

export function buildChoiceLookup(choices, extraAliases = {}) {
    return Object.fromEntries([
        ...choices.flatMap(toLookupEntries),
        ...Object.entries(extraAliases).map(([key, value]) => [
            key.toLowerCase(),
            value,
        ]),
    ]);
}

export const troopChoices = [
    { name: 'Rifleman', value: 'rifleman' },
    { name: 'Heavy', value: 'heavy' },
    { name: 'Zooka', value: 'zooka' },
    { name: 'Warrior', value: 'warrior' },
    { name: 'Tank', value: 'tank' },
    { name: 'Medic', value: 'medic' },
    { name: 'Grenadier', value: 'grenadier' },
    { name: 'Scorcher', value: 'scorcher' },
    { name: 'Laser Ranger', value: 'laser_ranger' },
    { name: 'Cryoneer', value: 'cryoneer' },
    { name: 'Bombardier', value: 'bombardier' },
    { name: 'Mech', value: 'mech' },
    { name: 'Rocket Choppa', value: 'rocket_choppa' },
];

export const defenceChoices = [
    { name: 'Sniper Tower', value: 'sniper_tower' },
    { name: 'Machine Gun', value: 'machine_gun' },
    { name: 'Mortar', value: 'mortar' },
    { name: 'Cannon', value: 'cannon' },
    { name: 'Flamethrower', value: 'flamethrower' },
    { name: 'Boom Cannon', value: 'boom_cannon' },
    { name: 'Rocket Launcher', value: 'rocket_launcher' },
    { name: 'Critter Launcher', value: 'critter_launcher' },
    { name: 'Shock Launcher', value: 'shock_launcher' },
];

export const gunboatChoices = [
    { name: 'Artillery', value: 'artillery' },
    { name: 'Flare', value: 'flare' },
    { name: 'Medkit', value: 'medkit' },
    { name: 'Shock Bomb', value: 'shock_bomb' },
    { name: 'Barrage', value: 'barrage' },
    { name: 'Smoke Screen', value: 'smokescreen' },
    { name: 'Critters', value: 'critters' },
];

export const temporaryGunboatChoices = [
    { name: 'Cryobomb', value: 'cryobomb' },
    { name: 'Super Warrior', value: 'super_warrior' },
    { name: 'Speed Serum', value: 'speed_serum' },
    { name: 'Deployable Turret', value: 'deployable_turret' },
    { name: 'Remote Defib', value: 'remote_defib' },
    { name: 'Explosive Drones', value: 'explosive_drones' },
    { name: 'Remote Hack', value: 'remote_hack' },
    { name: 'Tiny Shock', value: 'tiny_shock' },
    { name: 'Crystal Shield Projector', value: 'crystal_shield_projector' },
    { name: 'Crystal Critters', value: 'crystal_critters' },
];


export const heroChoices = [
    { name: 'Sergeant Brick', value: 'sergeant_brick' },
    { name: 'Dr. Kavan', value: 'corporal_kavan' },
    { name: 'Captain Everspark', value: 'captain_everspark' },
    { name: 'Pvt. Bullit', value: 'private_bullet' },
    { name: 'Cpt. Ruddero', value: 'captain_ruddero' },
];

export const prototypeDefenceChoices = [
    { name: 'Shock Blaster', value: 'shock_blaster' },
    { name: 'Lazor Beam', value: 'lazor_beam' },
    { name: 'Doom Cannon', value: 'doom_cannon' },
    { name: 'Damage Amplifier', value: 'damage_amplifier' },
    { name: 'Shield Generator', value: 'shield_generator' },
    { name: 'Hot Pot', value: 'hot_pot' },
    { name: 'Grappler', value: 'grappler' },
    { name: 'S.I.M.O.', value: 'simo' },
    { name: 'Sky Shield', value: 'sky_shield' },
    { name: "Microwav'r", value: 'microwavr' },
    { name: 'Boom Surprise', value: 'boom_surprise' },
    { name: 'Flotsam Cannon', value: 'flotsam_cannon' },
];

export const prototypeTroopChoices = [
    { name: 'Rain Maker', value: 'rain_maker' },
    { name: 'Critter Cannon MK II.', value: 'critter_cannon' },
    { name: 'Lazortron MK II.', value: 'lazortron' },
    { name: 'Heavy Choppa', value: 'heavy_choppa' },
    { name: 'Clone Rifleman', value: 'clone_rifleman' },
    { name: 'CryoTank', value: 'cryotank' },
    { name: 'Dr. Vitamin', value: 'dr_vitamin' },
    { name: 'Cryobombardier', value: 'cryobombardier' },
    { name: 'Shockaneer', value: 'shockaneer' },
    { name: 'Protector', value: 'protector' },
    { name: 'Critter Engineer', value: 'critter_engineer' },
    { name: 'Melon Bombardier', value: 'melon_bombardier' },
    { name: 'MegaScorcher', value: 'mega_scorcher' },
    { name: 'Turret Engineer', value: 'turret_engineer' },
    { name: 'Stunner', value: 'stunner' },
];
