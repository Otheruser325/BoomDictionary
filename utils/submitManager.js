const developerId = "822964244697710612"; // Otheruser325 (developer)
const restrictedUsers = new Map(); // Track restricted users with offenses

// List of banned words to filter
const bannedWords = [
    "fuck",
    "fucking",
    "fucker",
    "fck",
    "fuk",
    "motherfucker",
    "cunt",
    "shit",
    "sh1t",
    "bullshit",
    "bullsh1t",
    "dogshit",
    "dogsh1t",
    "piss",
    "p1ss",
    "slag",
    "fag",
    "faggy",
    "fagger",
    "faggot",
    "kill yourself",
    "kys",
    "nsfw",
    "not safe for work",
    "not-safe-for-work",
    "nigga",
    "n1gga",
    "nigger",
    "n1gger",
];

module.exports = {
    developerId,
    restrictedUsers,
    bannedWords,
};