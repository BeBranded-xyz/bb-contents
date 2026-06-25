// YouTube API Worker pour bb-contents
// Déployez ce code sur Cloudflare Workers
//
// CORS : définissez la variable d'environnement ALLOWED_ORIGINS (liste d'origines
// séparées par des virgules, ex: "https://www.bebranded.xyz,https://bb.webflow.io")
// pour restreindre l'accès au proxy. Tant qu'elle n'est PAS définie, le Worker
// conserve l'ancien comportement ouvert ('*') afin de ne rien casser — pensez à la
// définir avant la mise en production pour protéger votre quota YouTube.

// Résout l'origine autorisée pour une requête.
// Retourne la valeur d'en-tête Access-Control-Allow-Origin, ou null pour refuser.
function resolveAllowedOrigin(request, env) {
  const allowed = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)
  if (allowed.length === 0) return '*' // non configuré : comportement historique ouvert
  const requestOrigin = request.headers.get('Origin') || ''
  return allowed.includes(requestOrigin) ? requestOrigin : null
}

// En-têtes CORS pour une origine donnée. Vary: Origin pour ne pas polluer le cache.
function corsHeaders(allowOrigin) {
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  }
}

function jsonResponse(body, status, allowOrigin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(allowOrigin) },
  })
}

export default {
  async fetch(request, env) {
    const allowOrigin = resolveAllowedOrigin(request, env)

    // Origine non autorisée : refuser sans exposer d'en-tête CORS permissif.
    if (allowOrigin === null) {
      return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Préflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(allowOrigin) })
    }

    // Seulement GET autorisé
    if (request.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed' }, 405, allowOrigin)
    }

    try {
      const url = new URL(request.url)
      const channelId = url.searchParams.get('channelId')
      let maxResults = url.searchParams.get('maxResults') || '10'
      const allowShorts = url.searchParams.get('allowShorts') || 'false'

      // Validation channelId
      if (!channelId) {
        return jsonResponse({ error: 'channelId parameter is required' }, 400, allowOrigin)
      }

      // Validation format channelId (alphanumérique, tirets, underscores uniquement)
      if (!/^[a-zA-Z0-9_-]+$/.test(channelId)) {
        return jsonResponse({ error: 'Invalid channelId format' }, 400, allowOrigin)
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
        return jsonResponse({ error: 'API key not configured' }, 500, allowOrigin)
      }

      // Cache Cloudflare 24h : retourner la réponse en cache si présente
      const cachedResponse = await caches.default.match(request)
      if (cachedResponse) {
        return cachedResponse
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
          const apiResponse = await fetch(apiUrl, { signal: controller.signal })

          clearTimeout(timeoutId)

          if (!apiResponse.ok) {
            throw new Error(`YouTube API error: ${apiResponse.status}`)
          }

          const data = await apiResponse.json()

          // Validation de la structure des données
          if (!data || typeof data !== 'object' || !Array.isArray(data.items)) {
            throw new Error('Invalid response format from YouTube API')
          }

          const response = new Response(JSON.stringify(data), {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=86400',
              ...corsHeaders(allowOrigin),
            }
          })
          await caches.default.put(request, response.clone())
          return response
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

          const response = new Response(JSON.stringify({
            ...mediumData,
            items: limitedItems
          }), {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=86400',
              ...corsHeaders(allowOrigin),
            }
          })
          await caches.default.put(request, response.clone())
          return response
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

      return jsonResponse({
        error: 'Internal server error',
        message: errorMessage.includes('API key') ? 'Configuration error' : 'An error occurred'
      }, 500, allowOrigin)
    }
  }
}
