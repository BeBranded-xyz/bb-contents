/**
 * Option attribute → owning module root.
 * Used by the dev-mode guard (_checkOptionRules) to warn when an option
 * attribute (e.g. bb-marquee-speed) appears without its root (bb-marquee).
 */
export default [
    { option: 'marquee-speed',              root: 'marquee' },
    { option: 'marquee-direction',          root: 'marquee' },
    { option: 'marquee-pause',              root: 'marquee' },
    { option: 'marquee-gap',                root: 'marquee' },
    { option: 'marquee-orientation',        root: 'marquee' },
    { option: 'marquee-height',             root: 'marquee' },
    { option: 'marquee-min-height',         root: 'marquee' },
    { option: 'url',                        root: 'share' },
    { option: 'text',                       root: 'share' },
    { option: 'current-year-format',        root: 'current-year' },
    { option: 'current-year-prefix',        root: 'current-year' },
    { option: 'current-year-suffix',        root: 'current-year' },
    { option: 'reading-time-target',        root: 'reading-time' },
    { option: 'reading-time-speed',         root: 'reading-time' },
    { option: 'reading-time-image-speed',   root: 'reading-time' },
    { option: 'reading-time-format',        root: 'reading-time' },
    { option: 'reading-time-url',           root: 'reading-time' },
    { option: 'country-select-preferred',   root: 'country-select' },
    { option: 'country-select-default',     root: 'country-select' },
    { option: 'favicon-dark',               root: 'favicon' },
    { option: 'youtube-video-count',        root: 'youtube-channel' },
    { option: 'youtube-skip',               root: 'youtube-channel' },
    { option: 'youtube-language',           root: 'youtube-channel' },
    { option: 'youtube-allow-shorts',       root: 'youtube-channel' },
];
