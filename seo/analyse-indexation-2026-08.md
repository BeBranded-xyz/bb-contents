# Analyse d'indexation — BeBranded

- **Domaine analysé :** `www.bebranded.xyz` (domaine canonique de production)
- **Date de l'analyse :** 1er août 2026
- **Sources :** Google Search Console (propriétés `sc-domain:bebranded.xyz` et `sc-domain:bebranded.fr`) + Ahrefs (Site Explorer & Site Audit, projet « Bebranded », crawl du 31/07/2026)
- **Période de performance :** 90 derniers jours (03/05 → 31/07/2026)

> ⚠️ Note méthodologique : l'API Search Console ne renvoie pas les compteurs agrégés du rapport « Indexation des pages ». Les volumes d'indexation ci-dessous sont **estimés** en croisant le sitemap (563 URL), le crawl Ahrefs (599 URL / ~513 indexables), les pages avec impressions sur 90 j (proxy « indexée et affichée ») et un échantillon d'inspections d'URL en direct via l'API GSC. Pour les compteurs exacts, se référer au rapport « Indexation » de l'interface GSC.

---

## 1. Synthèse (TL;DR)

1. **L'architecture de domaines est saine.** Les domaines `.fr` (`bebranded.fr` et `www.bebranded.fr`) redirigent en 301 vers `https://www.bebranded.xyz/`, et Google a bien sélectionné `www.bebranded.xyz` comme canonique. La propriété GSC `bebranded.fr` est donc **vide, ce qui est normal** (aucun contenu propre à indexer). Aucun problème de contenu dupliqué inter-domaines.

2. **Il existe un vrai déficit d'indexation sur le domaine `.xyz`.** Sur ~513 pages indexables crawlées par Ahrefs, seules **~190 URL ont reçu au moins une impression** sur 90 jours. Sur un échantillon ciblé de pages à faible/zéro impression, environ **la moitié ressort en « Crawled – currently not indexed »** (explorée mais non indexée par Google).

3. **Trois clusters concentrent la non-indexation** (confirmés par inspection d'URL) :
   - Le **contenu localisé `/fr/`** (ex. `/fr/blog/webflow-cms-guide-complet`, `/fr/blog/refonte-site-internet-guide-complet`) ;
   - Les **pages locales programmatiques `/agency/*`** (ex. `/agency/webflow-agency-brest`) ;
   - Les **pages outils `/tools/*`** (ex. `/tools/make`).

4. **La cause technique principale est identifiée : le maillage interne.** Ahrefs remonte **30 pages orphelines indexables** (aucun lien interne entrant) et **14 pages 404**. Une page orpheline ou faiblement liée est mal explorée et bascule fréquemment en « Crawled – not indexed ».

5. **La performance globale se dégrade légèrement.** 252 clics / 112 319 impressions sur 90 j (CTR 0,22 %, position moyenne 16,0), avec une **position moyenne qui glisse d'environ 10 (début mai) à ~28 (fin juillet)**.

**Priorités :** (P0) rétablir le maillage interne des pages orphelines et corriger les 404/canonical cassés ; (P0) trancher le sort des trois clusters non indexés (enrichir / consolider / `noindex`) ; (P1) clarifier la soumission des sitemaps et corriger les métadonnées.

---

## 2. Architecture des domaines & canonicalisation

Le site Webflow « BeBranded » est publié sur 4 domaines personnalisés :

| Domaine | Rôle | Comportement observé |
|---|---|---|
| `www.bebranded.xyz` | **Canonique de production** | 200, indexé, auto-canonique |
| `bebranded.xyz` | Variante sans www | Sert le canonique `www.bebranded.xyz` |
| `www.bebranded.fr` | Domaine `.fr` | **301 → `https://www.bebranded.xyz/`** |
| `bebranded.fr` | Variante `.fr` sans www | **301 → `https://www.bebranded.xyz/`** |

**Inspections d'URL (API GSC) :**

| URL inspectée | Propriété | Couverture | Canonique Google |
|---|---|---|---|
| `https://www.bebranded.fr/` | `sc-domain:bebranded.fr` | Page avec redirection | `https://www.bebranded.xyz/` |
| `https://bebranded.fr/` | `sc-domain:bebranded.fr` | Page avec redirection | `https://www.bebranded.xyz/` |
| `https://www.bebranded.xyz/` | `sc-domain:bebranded.xyz` | Soumise et indexée | `https://www.bebranded.xyz/` |
| `https://www.bebranded.xyz/fr` | `sc-domain:bebranded.xyz` | Soumise et indexée | `https://www.bebranded.xyz/fr` |

✅ **Conclusion :** la consolidation `.fr → .xyz` est correcte. La propriété GSC `bebranded.fr` sans données est le comportement attendu, **pas un bug**. Il n'y a pas de duplication de domaine à corriger.

ℹ️ Le contenu français vit sous le **sous-répertoire `/fr/` du domaine `.xyz`** (localisation Webflow), et non sur le domaine `.fr`.

---

## 3. Sitemaps

| Sitemap | Statut GSC | URL | Erreurs |
|---|---|---|---|
| `https://www.bebranded.xyz/fr/sitemap.xml` | **Soumis** (dernière lecture 01/08/2026) | 563 | 0 |
| `https://www.bebranded.xyz/sitemap.xml` (racine) | **Non soumis** dans GSC | — | — |

- Le sitemap racine `/sitemap.xml` existe bel et bien (référencé par Google lors du crawl de plusieurs pages, ex. `/tools/make`), mais **seul `/fr/sitemap.xml` est déclaré dans GSC**.
- Le sitemap soumis ne remonte aucune erreur (563 URL, 0 erreur, 0 avertissement) — la découverte des URL n'est donc pas le blocage ; le problème est **côté sélection/indexation**, pas côté découverte.

**Recommandation :** vérifier quel sitemap est le point d'entrée canonique généré par Webflow et **soumettre explicitement dans GSC le sitemap qui couvre l'ensemble des URL EN + FR** (idéalement `/sitemap.xml`), afin de garantir une couverture de découverte complète et cohérente.

---

## 4. Couverture d'indexation (estimation)

**Dénominateurs disponibles :**

| Mesure | Valeur | Source |
|---|---|---|
| URL dans le sitemap soumis | 563 | GSC (sitemaps) |
| URL crawlées | 599 | Ahrefs Site Audit (31/07) |
| Pages « indexables » | ~513 | Ahrefs (« Pages to submit to IndexNow ») |
| URL ayant reçu ≥ 1 impression sur 90 j | ~190 | GSC (dimension page) |

L'écart entre **~513 pages indexables** et **~190 pages effectivement affichées en recherche** matérialise le déficit d'indexation. Une partie de ces ~320 URL sans impression est indexée mais sans requête déclenchée ; **une part importante est réellement non indexée**, comme le confirment les inspections ci-dessous.

**Échantillon d'inspections d'URL en direct (`sc-domain:bebranded.xyz`) :**

| URL | Couverture | Dernier crawl |
|---|---|---|
| `/` | ✅ Soumise et indexée | 01/08/2026 |
| `/fr` | ✅ Soumise et indexée | 28/07/2026 |
| `/blog/create-website-ai-guide-2026` | ✅ Soumise et indexée | 29/07/2026 |
| `/services/webflow-maintenance` | ✅ Soumise et indexée | 29/06/2026 |
| `/fr/blog/webflow-cms-guide-complet` | ❌ Crawled – currently not indexed | 10/06/2026 |
| `/fr/blog/refonte-site-internet-guide-complet` | ❌ Crawled – currently not indexed | 09/06/2026 |
| `/agency/webflow-agency-brest` | ❌ Crawled – currently not indexed | 02/03/2026 |
| `/tools/make` | ❌ Crawled – currently not indexed | 06/04/2026 |

→ Sur cet échantillon **ciblé sur des pages à faible/zéro impression**, ~50 % sont « Crawled – currently not indexed ». (Échantillon non aléatoire : sert à **caractériser les clusters à risque**, pas à mesurer un taux global exact.)

**Clusters non indexés identifiés :**

1. **Contenu localisé `/fr/`** — de nombreux articles `/fr/blog/*` cumulent 0 clic et impressions très faibles ; deux inspectés sont confirmés non indexés. Symptôme typique de **duplication perçue / signal de qualité insuffisant** de la version localisée face à l'originale EN.
2. **Pages locales `/agency/*`** (agences par ville) — pages programmatiques fines ; `/agency/webflow-agency-brest` non indexée, dernier crawl remontant à mars 2026 (crawl peu fréquent = faible priorité perçue).
3. **Pages outils `/tools/*`** — pages fines de type annuaire/affiliation ; `/tools/make` non indexée, dernier crawl avril 2026.

---

## 5. Problèmes techniques (Ahrefs Site Audit — crawl 31/07/2026)

Score de santé : **90/100** — 599 URL crawlées, 62 erreurs, 581 avertissements, 534 notices.

**Indexabilité & structure (prioritaire) :**

| Problème | Gravité | Pages | Impact indexation |
|---|---|---|---|
| **Pages orphelines indexables** (aucun lien interne entrant) | Error | **30** | 🔴 Élevé — cause directe de « Crawled – not indexed » |
| Pages 404 | Error | 14 | 🔴 Liens internes cassés, gaspillage de crawl |
| Pages 4XX | Error | 14 | 🔴 (recoupe les 404) |
| Canonical pointant vers une redirection | Error | 1 | 🟠 Signal de canonique ambigu |
| Canonical pointant vers une 4XX | Error | 1 | 🟠 Canonique invalide |
| Pages `noindex` | Warning | 6 | 🟢 À vérifier (probables pages système) |
| « Page indexable devenue non-indexable » | Notice | −5 (variation) | 🟠 5 pages récemment passées en non-indexable — à surveiller |
| Pages indexables (proxy) | — | ~513 | Référence dénominateur |

**Qualité de contenu (signaux secondaires de non-indexation) :**

| Problème | Gravité | Pages |
|---|---|---|
| Balise `title` trop longue | Warning | 101 |
| Meta description trop courte | Warning | 121 |
| Meta description trop longue | Warning | 39 |
| Texte alternatif d'image manquant | Warning | 125 |
| Erreur de validation « rich results » Google (données structurées) | Notice | 14 |
| Erreur de validation schema.org | Notice | 2 |
| Plusieurs balises H1 | Notice | 2 |

Ces signaux de qualité (titres/descriptions non optimisés, pages fines) **renforcent la probabilité que Google déprie certaines pages** vers « Crawled – not indexed ».

---

## 6. Performance en recherche (contexte)

**90 jours (`sc-domain:bebranded.xyz`) :** 252 clics · 112 319 impressions · CTR 0,22 % · position moyenne 16,0.

- **Beaucoup d'impressions, peu de clics** : cohérent avec un grand nombre de pages positionnées en page 2–3 et une longue traîne non indexée qui plafonne le potentiel.
- **Tendance de position en dégradation** : la position moyenne glisse d'environ **10 début mai à ~28 fin juillet**. À surveiller de près.
- **Pages/requêtes locomotives** : `/fr/blog/claude-ai` (57 clics), `/fr` (38 clics, CTR 12,6 %), `/blog/how-to-add-a-video-to-your-webflow-cms-collection…` (22 clics), `/` (16 clics), `/flowconsent` (CTR 9,2 %).
- **Gros volumes d'impressions à très faible CTR** (opportunités de contenu/positionnement) : `/blog/claude-ai` (28 709 impr.), `/blog/webflow-pricing-2026…` (13 330), `/blog/create-website-ai-guide-2026` (8 422), `/tools/tally` (7 885).

---

## 7. Recommandations priorisées

### 🔴 P0 — Débloquer l'indexation (impact fort, effort modéré)

1. **Réintégrer les 30 pages orphelines dans le maillage interne.** Ajouter des liens contextuels depuis des pages fortes (hubs `/blog`, `/our-agencies`, `/toolbox`, pages services). Une page sans lien interne ne sera durablement pas indexée.
2. **Corriger les 14 pages 404 et les canonicals cassés** (canonical → redirection, canonical → 4XX). Réparer ou rediriger les liens internes pointant vers ces URL.
3. **Trancher le sort des 3 clusters non indexés :**
   - **`/fr/` localisé** : enrichir/différencier le contenu FR et vérifier la cohérence `hreflang` EN ↔ FR ; à défaut de valeur ajoutée, envisager de dé-prioriser ou consolider.
   - **`/agency/*`** : consolider les pages villes fines en pages plus substantielles (ou regrouper), ou les passer en `noindex` si elles n'apportent pas de valeur SEO propre.
   - **`/tools/*`** : même arbitrage — enrichir les pages à conserver, `noindex` ou fusionner les pages fines.

### 🟠 P1 — Hygiène technique & découverte

4. **Clarifier et soumettre les sitemaps** : déclarer dans GSC le sitemap racine couvrant EN + FR ; s'assurer qu'un seul sitemap canonique fait autorité.
5. **Corriger les métadonnées** : raccourcir les 101 `title` trop longs, retravailler les 121+39 meta descriptions hors format, ajouter les 125 textes alternatifs manquants.
6. **Surveiller les 5 pages « devenues non-indexables »** pour s'assurer que ce n'est pas accidentel.

### 🟢 P2 — Optimisation

7. **Corriger les 14 erreurs « rich results »** et les 2 erreurs schema.org pour sécuriser l'éligibilité aux résultats enrichis (fil d'Ariane déjà détecté sur les articles).
8. **Retravailler le CTR des pages à fort volume d'impressions** (`/blog/claude-ai`, `/blog/webflow-pricing-2026…`, `/tools/tally`) : titres et méta plus incitatifs.
9. **Après corrections**, réinspecter un lot d'URL représentatives dans GSC et **demander une (ré)indexation** des pages clés remises en état.

---

## 8. Annexe — Récapitulatif des sources

- **GSC — Vue d'ensemble (90 j, `sc-domain:bebranded.xyz`)** : 252 clics · 112 319 impressions · CTR 0,22 % · position 16,0.
- **GSC — Sitemaps** : `/fr/sitemap.xml` soumis, 563 URL, 0 erreur.
- **GSC — Inspections d'URL** : voir §2 et §4.
- **Ahrefs Site Audit** (projet « Bebranded », id 7917556, crawl 31/07/2026) : santé 90/100, 599 URL, 62 erreurs, 581 avertissements ; 30 pages orphelines indexables, 14×404, ~513 pages indexables.
- **Ahrefs Site Explorer** (subdomains, 01/08/2026) : estimation propre à Ahrefs de 6 mots-clés organiques / 80 visites (Ahrefs sous-estime nettement ce site par rapport aux données GSC ; à titre indicatif uniquement).
