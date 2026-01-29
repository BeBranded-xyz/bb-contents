// YouTube API Worker pour bb-contents
// Déployez ce code sur Cloudflare Workers

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event.env))
})

async function handleRequest(request, env) {
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

    // Récupérer la clé API depuis les secrets Cloudflare
    const apiKey = env.YOUTUBE_API_KEY
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    
    // OPTIMISATION: Une seule requête API au lieu de deux
    // Utiliser la requête la plus flexible pour récupérer tous les types de vidéos
    let apiUrl
    
    if (allowShorts === 'true') {
      // Récupérer uniquement les vidéos courtes (< 4 minutes)
      apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&videoDuration=short&key=${apiKey}`
    } else {
      // OPTIMISATION: Une seule requête pour récupérer les vidéos moyennes ET longues (exclure les shorts)
      // On fait deux requêtes en parallèle pour medium et long, puis on combine
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
          'Cache-Control': 'public, max-age=86400' // 24 heures au lieu de 1 heure
        }
      })
    }
    
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // OPTIMISATION: Cache plus long pour réduire les appels API
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400' // 24 heures au lieu de 1 heure
      }
    })
    
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
