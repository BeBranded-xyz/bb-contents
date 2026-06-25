/**
 * YouTube — render the fetched feed into the page using the author's template.
 */
import { formatDate, decodeHtmlEntities } from './format.js';

export function generateYouTubeFeed(container, template, data, allowShorts, language = 'fr') {
    if (!data || !data.items || data.items.length === 0) {
        if (data && data.allChannelsFailed) {
            container.innerHTML = '<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; text-align: center;"><strong>Erreur de chargement</strong><br>Impossible de récupérer les vidéos des chaînes YouTube</div>';
        } else {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Aucune vidéo trouvée</div>';
        }
        return;
    }

    const marqueeElements = container.querySelectorAll('[data-bb-marquee-processed]');
    container.innerHTML = '';
    marqueeElements.forEach(marqueeEl => container.appendChild(marqueeEl));

    data.items.forEach(item => {
        const videoId = item.id?.videoId;
        if (!videoId) return;
        const snippet = item.snippet;
        const clone = template.cloneNode(true);
        clone.style.display = '';
        fillVideoData(clone, videoId, snippet, language);
        container.appendChild(clone);
    });
}

function fillVideoData(element, videoId, snippet, language = 'fr') {
    if (element.tagName === 'A' || element.hasAttribute('bb-youtube-item') || element.hasAttribute('data-bb-youtube-item')) {
        element.href = `https://www.youtube.com/watch?v=${videoId}`;
        element.target = '_blank';
        element.rel = 'noopener noreferrer';
    }

    const thumbnail = element.querySelector(bbContents._attrSelector('youtube-thumbnail'));
    if (thumbnail) {
        const t = snippet.thumbnails;
        const bestUrl = (t.maxres || t.high || t.medium || t.default || {}).url;
        if (bestUrl && bbContents.utils.isValidUrl(bestUrl)) {
            thumbnail.src = bestUrl;
            thumbnail.alt = snippet.title;
        }
    }

    const title = element.querySelector(bbContents._attrSelector('youtube-title'));
    if (title) title.textContent = decodeHtmlEntities(snippet.title);

    const description = element.querySelector(bbContents._attrSelector('youtube-description'));
    if (description) description.textContent = decodeHtmlEntities(snippet.description);

    const date = element.querySelector(bbContents._attrSelector('youtube-date'));
    if (date) date.textContent = formatDate(snippet.publishedAt, language);

    const channel = element.querySelector(bbContents._attrSelector('youtube-channel'));
    if (channel) channel.textContent = snippet.channelTitle;
}
