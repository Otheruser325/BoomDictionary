# Prototype Troop Analysis

Date: April 1, 2026

This document compares the bot's current `data/prototypeTroops.json` dataset against the current Boom Beach Wiki prototype troop roster and structure.

## Current Bot Coverage

The bot dataset now contains entries for:

- `rain_maker`
- `lazortron`
- `critter_cannon`
- `rocket_choppa`
- `heavy_choppa`
- `turret_engineer`
- `critter_engineer`
- `cryobombardier`
- `clone_rifleman`
- `cryotank`
- `dr_vitamin`
- `shockaneer`
- `protector`
- `melon_bombardier`
- `mega_scorcher`
- `stunner`
- `seeker`
- `vampire_zooka`
- `hidden_warrior`
- `undercover_rifleman`
- `zombie_rifleman`

The current slash and prefix command choices still intentionally expose only the entries that have usable stat tables:

- Rain Maker
- Lazortron
- Critter Cannon
- Heavy Choppa
- Turret Engineer
- Critter Engineer
- Cryobombardier

Rocket Choppa remains in the dataset for historical reference, but it is no longer exposed as a live prototype troop choice because it is a standard troop now. The newly added missing roster entries are currently tracked as metadata-first placeholders until their per-level workshop stats are migrated.

## Source-Backed Findings

Primary current roster source:

- [Proto Troop Workshop](https://boombeach.fandom.com/wiki/Proto_Troop_Workshop)

Current prototype troops available from the workshop according to the wiki roster:

- Rain Maker
- Critter Cannon MK II.
- Lazortron MK II.
- Heavy Choppa
- Clone Rifleman
- CryoTank
- Dr. Vitamin
- Cryobombardier
- Shockaneer
- Protector
- Critter Engineer
- Melon Bombardier
- MegaScorcher
- Turret Engineer
- Stunner

Prototype troops listed on the roster as not available at the workshop:

- Seeker
- Vampire Zooka
- Hidden Warrior
- Undercover Rifleman

Other special roster notes:

- Zombie Rifleman appears in the current Warships prototype troop list.
- Rocket Choppa is now a standard troop, not a current prototype troop.
- The workshop roster includes several prototype troops that are completely missing from the bot dataset.

## Structural Mismatches

The current bot dataset still reflects the older prototype troop model:

- Levels are stored as `12-26`.
- The command logic still assumes the old proto token upgrade pattern for legacy troops.
- Many entries still use `armoryRequired` rather than workshop-era progression.
- The bot dataset mixes current prototype troops with former prototype troops.

The current wiki workshop pages use a different model:

- Workshop-era prototype troops now use low-level progression starting at level `1`.
- Multiple pages extend to level `28`.
- Upgrade tables use `Workshop level required` instead of the old armory model.
- Some pages retain older legacy or Warships sections in addition to current workshop tables.

Examples of current workshop-era pages that show the newer structure:

- [Shockaneer](https://boombeach.fandom.com/wiki/Shockaneer)
- [Stunner](https://boombeach.fandom.com/wiki/Stunner)
- [MegaScorcher](https://boombeach.fandom.com/wiki/MegaScorcher)

## Missing Current Prototype Troops

These current workshop troops do not yet have live stat tables in the bot:

- Clone Rifleman
- CryoTank
- Dr. Vitamin
- Shockaneer
- Protector
- Melon Bombardier
- MegaScorcher
- Stunner

## Outdated or Legacy Entries

These entries need special handling because the current bot treatment is misleading:

- Rocket Choppa: should remain a regular troop, not a live prototype troop command option.
- Lazortron and Critter Cannon: the bot still labels them with legacy naming/value structure instead of the current MK II workshop framing.
- Any prototype troop entry that only contains level `12-26` data should be treated as legacy until migrated page-by-page.

## Recommended Migration Order

1. Keep the live prototype troop choices limited to entries with usable data.
2. Migrate current workshop-era troops one page at a time into a new `1-28`-capable structure.
3. Split historical/legacy prototype troop data from current workshop troop data instead of mixing both in one flat model.
4. Add an explicit availability field for each troop:
   - `workshop_current`
   - `warships_only`
   - `legacy_removed`
   - `standard_troop_now`
5. Replace old `armoryRequired` usage with `workshopRequired` wherever the wiki page is workshop-era.

## Suggested Next Data Pass

The safest next migration batch is:

1. Shockaneer
2. Stunner
3. MegaScorcher
4. Protector

Those pages clearly use the workshop-era structure and will force the data model to handle the newer format correctly.

## Sources Used

- [Proto Troop Workshop](https://boombeach.fandom.com/wiki/Proto_Troop_Workshop)
- [Rain Maker](https://boombeach.fandom.com/wiki/Rain_Maker)
- [Heavy Choppa](https://boombeach.fandom.com/wiki/Heavy_Choppa)
- [Turret Engineer](https://boombeach.fandom.com/wiki/Turret_Engineer)
- [Critter Engineer](https://boombeach.fandom.com/wiki/Critter_Engineer)
- [Cryobombardier](https://boombeach.fandom.com/wiki/Cryobombardier)
- [Shockaneer](https://boombeach.fandom.com/wiki/Shockaneer)
- [Stunner](https://boombeach.fandom.com/wiki/Stunner)
- [MegaScorcher](https://boombeach.fandom.com/wiki/MegaScorcher)
- [Rocket Choppa](https://boombeach.fandom.com/wiki/Rocket_Choppa)
