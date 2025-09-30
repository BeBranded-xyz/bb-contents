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
    
    // OPTIMISATION: Une seule requête API au lieu de deux
    // Utiliser la requête la plus flexible pour récupérer tous les types de vidéos
    let apiUrl
    
    if (allowShorts === 'true') {
      // Récupérer uniquement les vidéos courtes (< 4 minutes)
      apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&videoDuration=short&key=${apiKey}`
    } else {
      // OPTIMISATION: Une seule requête pour récupérer toutes les vidéos (pas de restriction de durée)
      // YouTube API retourne naturellement un mix de vidéos courtes, moyennes et longues
      // On laisse l'utilisateur choisir via allowShorts=true si il veut SEULEMENT les shorts
      apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&key=${apiKey}`
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
