import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from 'discord.js';
import dictionary from '../../data/dictionary.json' with { type: 'json' };

export const PRONUNCIATION_BASE_URL = 'https://funny-eclair-d437ee.netlify.app';

function chunkValues(values, chunkSize = 25) {
    const chunks = [];

    for (let index = 0; index < values.length; index += chunkSize) {
        chunks.push(values.slice(index, index + chunkSize));
    }

    return chunks;
}

function createSelectCustomId(baseId, index, total) {
    return total === 1 ? baseId : `${baseId}:${index}`;
}

function normalizeTerm(term) {
    return term.trim().toLowerCase();
}

export function getDictionary() {
    return dictionary;
}

export function getDictionaryCategories() {
    return Object.keys(dictionary);
}

export function getDictionaryCategory(category) {
    return dictionary[category] ?? null;
}

export function getDictionaryTerms(category) {
    const categoryData = getDictionaryCategory(category);

    if (!categoryData) {
        return [];
    }

    return Object.entries(categoryData)
        .filter(([, value]) => typeof value === 'object' && value?.terminology)
        .map(([key, value]) => ({
            key,
            value,
        }));
}

export function findDictionaryEntry(term) {
    const normalizedTerm = normalizeTerm(term);

    for (const [category, terms] of Object.entries(dictionary)) {
        for (const [key, value] of Object.entries(terms)) {
            if (typeof value !== 'object' || !value) {
                continue;
            }

            if (key.toLowerCase() === normalizedTerm ||
                value.terminology?.toLowerCase() === normalizedTerm) {
                return {
                    category,
                    key,
                    value,
                };
            }
        }
    }

    return null;
}

export function getRandomDictionaryEntry() {
    const allTerms = Object.entries(dictionary).flatMap(([category, terms]) =>
        Object.entries(terms)
            .filter(([, value]) => typeof value === 'object' && value)
            .map(([key, value]) => ({
                category,
                key,
                value,
            }))
    );

    if (allTerms.length === 0) {
        return null;
    }

    return allTerms[Math.floor(Math.random() * allTerms.length)];
}

export function buildDictionaryEntryEmbed(entry, options = {}) {
    const {
        categoryLabel = entry.category,
    } = options;
    const {
        terminology,
        definition,
        class: termClass,
        origin,
        pronunciation,
    } = entry.value;

    return new EmbedBuilder()
        .setTitle(`Boom Dictionary: ${terminology || entry.key}`)
        .setDescription(definition || 'No definition available.')
        .addFields({
            name: 'Category',
            value: categoryLabel || 'Unknown',
        }, {
            name: 'Class',
            value: termClass || 'Not provided',
        }, {
            name: 'Origin',
            value: origin || 'Not provided',
        }, {
            name: 'Pronunciation',
            value: pronunciation || 'Not provided',
        })
        .setColor('#0099ff');
}

export function buildDictionaryCategoriesEmbed() {
    const embed = new EmbedBuilder()
        .setTitle('Boom Dictionary Categories')
        .setDescription('Select a category to view its terms.')
        .setColor('#0099ff');

    for (const category of getDictionaryCategories()) {
        embed.addFields({
            name: category,
            value: dictionary[category].description || 'No description available',
            inline: false,
        });
    }

    return embed;
}

export function buildDictionaryCategoryEmbed(category) {
    const categoryData = getDictionaryCategory(category);

    return new EmbedBuilder()
        .setTitle(category)
        .setDescription(
            categoryData?.description ||
            'No description available for this category.'
        )
        .setColor('#0099ff');
}

export function buildDictionaryCategoryComponents(
    baseCustomId = 'select-category'
) {
    const options = getDictionaryCategories().map((category) =>
        new StringSelectMenuOptionBuilder()
            .setLabel(category)
            .setDescription(dictionary[category].description || 'No description available.')
            .setValue(category)
    );

    return chunkValues(options).map((optionChunk, index, chunks) =>
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(createSelectCustomId(baseCustomId, index, chunks.length))
                .setPlaceholder(
                    chunks.length === 1 ?
                        'Select a category' :
                        `Select categories ${index * 25 + 1}-${index * 25 + optionChunk.length}`
                )
                .addOptions(optionChunk)
        )
    );
}

export function buildDictionaryTermComponents(
    category,
    baseCustomId = 'select-term'
) {
    const termOptions = getDictionaryTerms(category).map(({ key, value }) =>
        new StringSelectMenuOptionBuilder()
            .setLabel(value.terminology)
            .setValue(key)
    );

    return chunkValues(termOptions).map((optionChunk, index, chunks) =>
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(createSelectCustomId(baseCustomId, index, chunks.length))
                .setPlaceholder(
                    chunks.length === 1 ?
                        'Select a term' :
                        `Select terms ${index * 25 + 1}-${index * 25 + optionChunk.length}`
                )
                .addOptions(optionChunk)
        )
    );
}

export function getPronunciationDetails(term) {
    const entry = findDictionaryEntry(term);

    if (!entry) {
        return null;
    }

    const displayName = entry.value.terminology || entry.key;
    const audioFileName = `${displayName
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')}.mp3`;

    return {
        ...entry,
        audioFileName,
        audioUrl: `${PRONUNCIATION_BASE_URL}/${encodeURIComponent(audioFileName)}`,
        displayName,
        termKey: entry.key.toLowerCase(),
    };
}

export function buildIpaEmbed(details) {
    return new EmbedBuilder()
        .setTitle(`Pronunciation for ${details.displayName}`)
        .setDescription(`Pronunciation: ${details.value.pronunciation || 'Not provided'}`)
        .setColor('#0099ff');
}

export function buildIpaActionRow(
    details,
    {
        includePlaybackButton = true,
    } = {}
) {
    const buttons = [];

    if (includePlaybackButton) {
        buttons.push(
            new ButtonBuilder()
                .setCustomId(`play-pronunciation-${encodeURIComponent(details.termKey)}`)
                .setLabel('Play Pronunciation')
                .setStyle(ButtonStyle.Primary)
        );
    }

    buttons.push(
        new ButtonBuilder()
            .setURL(details.audioUrl)
            .setLabel('Download MP3')
            .setStyle(ButtonStyle.Link)
    );

    return new ActionRowBuilder().addComponents(...buttons);
}
