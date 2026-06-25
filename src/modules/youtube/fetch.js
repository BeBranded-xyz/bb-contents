/**
 * YouTube — network access through the Worker proxy endpoint.
 */

export function fetchChannelFeed(endpoint, channelId, maxResults, allowShorts) {
    return fetch(`${endpoint}?channelId=${encodeURIComponent(channelId)}&maxResults=${maxResults}&allowShorts=${allowShorts}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        });
}

export function fetchMultipleChannels(endpoint, channelIds, maxResults, allowShorts) {
    if (channelIds.length > 10) throw new Error('Maximum 10 channelIds allowed');

    const promises = channelIds.map(channelId => {
        return fetch(`${endpoint}?channelId=${encodeURIComponent(channelId)}&maxResults=${maxResults}&allowShorts=${allowShorts}`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status} for channel ${channelId}`);
                return response.json();
            })
            .then(data => {
                if (data.error) throw new Error(data.error.message || 'Erreur API YouTube');
                return { success: true, items: data.items || [] };
            })
            .catch(() => ({ success: false, items: [] }));
    });

    return Promise.all(promises).then(allResults => {
        const allChannelsFailed = allResults.every(result => !result.success);
        const mergedItems = [].concat(...allResults.map(result => result.items));
        mergedItems.sort((a, b) => {
            const dateA = new Date(a.snippet?.publishedAt || 0);
            const dateB = new Date(b.snippet?.publishedAt || 0);
            return dateB - dateA;
        });
        return {
            items: mergedItems,
            pageInfo: { totalResults: mergedItems.length, resultsPerPage: mergedItems.length },
            allChannelsFailed
        };
    });
}
