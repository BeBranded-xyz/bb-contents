// YouTube API Worker pour bb-contents
// Déployez ce code sur Cloudflare Workers

export default {
  async fetch(request, env) {
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

    // Seulement GET autorisé
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    try {
      const url = new URL(request.url)
      const channelId = url.searchParams.get('channelId')
      let maxResults = url.searchParams.get('maxResults') || '10'
      const allowShorts = url.searchParams.get('allowShorts') || 'false'
      
      // Validation channelId
      if (!channelId) {
        return new Response(JSON.stringify({ error: 'channelId parameter is required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        })
      }
      
      // Validation format channelId (alphanumérique, tirets, underscores uniquement)
      if (!/^[a-zA-Z0-9_-]+$/.test(channelId)) {
        return new Response(JSON.stringify({ error: 'Invalid channelId format' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        })
      }
      
      // Validation et limitation maxResults
      maxResults = parseInt(maxResults, 10)
      if (isNaN(maxResults) || maxResults < 1) {
        maxResults = 10
      }
      // Limiter à 50 max (limite API YouTube)
      if (maxResults > 50) {
        maxResults = 50
      }
      maxResults = String(maxResults)
      
      // Validation allowShorts
      const safeAllowShorts = allowShorts === 'true'

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
      
      // Encoder les paramètres pour éviter l'injection
      const encodedChannelId = encodeURIComponent(channelId)
      const encodedMaxResults = encodeURIComponent(maxResults)
      
      // Timeout de 10 secondes pour les requêtes API
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      try {
        if (safeAllowShorts) {
          // Récupérer uniquement les vidéos courtes (< 4 minutes)
          const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodedChannelId}&maxResults=${encodedMaxResults}&order=date&type=video&videoDuration=short&key=${apiKey}`
          const response = await fetch(apiUrl, { signal: controller.signal })
          
          clearTimeout(timeoutId)
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(`YouTube API error: ${response.status}`)
          }
          
          const data = await response.json()
          
          // Validation de la structure des données
          if (!data || typeof data !== 'object' || !Array.isArray(data.items)) {
            throw new Error('Invalid response format from YouTube API')
          }
          
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
            fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodedChannelId}&maxResults=${encodedMaxResults}&order=date&type=video&videoDuration=medium&key=${apiKey}`, { signal: controller.signal }),
            fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodedChannelId}&maxResults=${encodedMaxResults}&order=date&type=video&videoDuration=long&key=${apiKey}`, { signal: controller.signal })
          ])
          
          clearTimeout(timeoutId)
          
          if (!mediumResponse.ok || !longResponse.ok) {
            const failedResponse = !mediumResponse.ok ? mediumResponse : longResponse
            throw new Error(`YouTube API error: ${failedResponse.status}`)
          }
          
          const [mediumData, longData] = await Promise.all([
            mediumResponse.json(),
            longResponse.json()
          ])
          
          // Validation de la structure des données
          if (!mediumData || typeof mediumData !== 'object' || !Array.isArray(mediumData.items)) {
            throw new Error('Invalid response format from YouTube API (medium)')
          }
          if (!longData || typeof longData !== 'object' || !Array.isArray(longData.items)) {
            throw new Error('Invalid response format from YouTube API (long)')
          }
          
          // Combiner les résultats et trier par date
          const combinedItems = [...(mediumData.items || []), ...(longData.items || [])]
          combinedItems.sort((a, b) => {
            const dateA = new Date(a.snippet?.publishedAt || 0)
            const dateB = new Date(b.snippet?.publishedAt || 0)
            return dateB - dateA
          })
          
          // Limiter au nombre de résultats demandé
          const limitedItems = combinedItems.slice(0, parseInt(maxResults, 10))
          
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
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout')
        }
        throw fetchError
      }
      
    } catch (error) {
      // Ne pas exposer les détails d'erreur sensibles
      const errorMessage = error.message || 'Internal server error'
      
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: errorMessage.includes('API key') ? 'Configuration error' : 'An error occurred'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
  }
}
