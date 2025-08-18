// YouTube API Worker pour bb-contents
// Déployez ce code sur Cloudflare Workers

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Gérer les CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }

  try {
    const url = new URL(request.url)
    const channelId = url.searchParams.get('channelId')
    const maxResults = url.searchParams.get('maxResults') || '10'
    const allowShorts = url.searchParams.get('allowShorts') || 'false'
    
    if (!channelId) {
      return new Response(JSON.stringify({ error: 'channelId parameter is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Remplacez YOUR_YOUTUBE_API_KEY par votre vraie clé API YouTube
    const apiKey = 'YOUR_YOUTUBE_API_KEY'
    
    // Déterminer la durée des vidéos selon allowShorts
    if (allowShorts === 'true') {
      // Récupérer uniquement les vidéos courtes (< 4 minutes)
      const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&videoDuration=short&key=${apiKey}`
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`)
      }
      
      const data = await response.json()
      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600'
        }
      })
    } else {
      // Récupérer les vidéos moyennes ET longues (exclure les shorts)
      const [mediumResponse, longResponse] = await Promise.all([
        fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&videoDuration=medium&key=${apiKey}`),
        fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&videoDuration=long&key=${apiKey}`)
      ])
      
      if (!mediumResponse.ok || !longResponse.ok) {
        throw new Error(`YouTube API error: ${mediumResponse.status || longResponse.status}`)
      }
      
      const [mediumData, longData] = await Promise.all([
        mediumResponse.json(),
        longResponse.json()
      ])
      
      // Combiner les résultats et trier par date
      const combinedItems = [...(mediumData.items || []), ...(longData.items || [])]
      combinedItems.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt))
      
      // Limiter au nombre de résultats demandé
      const limitedItems = combinedItems.slice(0, parseInt(maxResults))
      
      return new Response(JSON.stringify({
        ...mediumData,
        items: limitedItems
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600'
        }
      })
    }
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}
