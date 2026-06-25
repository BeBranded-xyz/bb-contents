/**
 * YouTube — pure formatting / data-shaping helpers (no module state).
 */

export function applySkipAndLimit(data, skip, videoCount) {
    if (!data || !data.items) return data;
    const afterSkip = skip > 0 ? data.items.slice(skip) : data.items;
    return { ...data, items: afterSkip.slice(0, videoCount) };
}

export function errorBox(message) {
    return '<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;"><strong>Erreur de chargement</strong><br>' +
        bbContents.utils.sanitize(message || 'Erreur inconnue') + '</div>';
}

export function formatDate(dateString, language = 'fr') {
    const date = new Date(dateString);
    const diffDays = Math.ceil(Math.abs(new Date() - date) / (1000 * 60 * 60 * 24));

    const t = {
        fr: { day: 'jour', days: 'jours', week: 'semaine', weeks: 'semaines', month: 'mois', months: 'mois', year: 'an', years: 'ans', ago: 'Il y a' },
        en: { day: 'day', days: 'days', week: 'week', weeks: 'weeks', month: 'month', months: 'months', year: 'year', years: 'years', ago: 'ago' }
    }[language] || { day: 'jour', days: 'jours', week: 'semaine', weeks: 'semaines', month: 'mois', months: 'mois', year: 'an', years: 'ans', ago: 'Il y a' };

    if (diffDays === 1) return `${t.ago} 1 ${t.day}`;
    if (diffDays < 7) return `${t.ago} ${diffDays} ${t.days}`;
    const weeks = Math.floor(diffDays / 7);
    if (weeks === 1) return `${t.ago} 1 ${t.week}`;
    if (diffDays < 30) return `${t.ago} ${weeks} ${t.weeks}`;
    const months = Math.floor(diffDays / 30);
    if (months === 1) return `${t.ago} 1 ${t.month}`;
    if (diffDays < 365) return `${t.ago} ${months} ${t.months}`;
    const years = Math.floor(diffDays / 365);
    if (years === 1) return `${t.ago} 1 ${t.year}`;
    return `${t.ago} ${years} ${t.years}`;
}

export function decodeHtmlEntities(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = div.innerHTML;
    return textarea.value;
}
