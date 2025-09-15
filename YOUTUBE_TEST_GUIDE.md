# 🎥 Guide de test - Module YouTube Feed

## 📋 Étapes de test complètes

### **Étape 1 : Obtenir une clé API YouTube**
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un existant
3. Activez l'API "YouTube Data API v3"
4. Créez des identifiants → Clé API
5. Copiez votre clé API

### **Étape 2 : Créer un compte Cloudflare**
1. Allez sur [Cloudflare](https://dash.cloudflare.com/)
2. Créez un compte gratuit
3. Allez dans "Workers & Pages"
4. Cliquez sur "Create application"

### **Étape 3 : Déployer le Worker**
1. Dans Cloudflare Workers, cliquez "Create Worker"
2. Remplacez le code par défaut par le contenu de `youtube-worker.js`
3. **IMPORTANT** : Remplacez `YOUR_YOUTUBE_API_KEY` par votre vraie clé API
4. Cliquez "Deploy"
5. Notez l'URL de votre Worker (ex: `https://youtube-worker.your-name.workers.dev`)

### **Étape 4 : Tester le Worker**
1. Ouvrez votre navigateur
2. Allez sur : `https://votre-worker-url.workers.dev?channelId=UC_x5XG1OV2P6uZZ5FSM9Ttw`
3. Vous devriez voir du JSON avec les vidéos de Google Developers

### **Étape 5 : Configurer bb-contents**
1. Dans votre page Webflow, ajoutez ce script dans le Head Code :
```html
<script src="https://cdn.jsdelivr.net/npm/@bebranded/bb-contents@beta/bb-contents.js"></script>
<script>
bbContents.config.youtubeEndpoint = "https://votre-worker-url.workers.dev";
</script>
```

### **Étape 6 : Tester le module**
1. Créez un div dans Webflow
2. Ajoutez l'attribut : `bb-youtube-channel="UC_x5XG1OV2P6uZZ5FSM9Ttw"`
3. Publiez et testez

## 🎯 Exemples d'utilisation

### **Usage basique :**
```html
<div bb-youtube-channel="UC_x5XG1OV2P6uZZ5FSM9Ttw">
  Chargement...
</div>
```

### **Avec nombre de vidéos :**
```html
<div bb-youtube-channel="UC_x5XG1OV2P6uZZ5FSM9Ttw" bb-youtube-video-count="6">
  Chargement...
</div>
```

### **Avec champs personnalisés :**
```html
<div bb-youtube-channel="UC_x5XG1OV2P6uZZ5FSM9Ttw">
  <div bb-youtube-show-title="true">Titre de la vidéo</div>
  <div bb-youtube-show-description="true">Description de la vidéo</div>
  <div bb-youtube-show-date="true">Date de publication</div>
</div>
```

## 🔧 Dépannage

### **Erreur "Configuration YouTube manquante"**
- Vérifiez que `bbContents.config.youtubeEndpoint` est configuré
- Vérifiez l'URL de votre Worker

### **Erreur "HTTP 400"**
- Vérifiez que le `channelId` est correct
- Vérifiez que votre clé API YouTube est valide

### **Erreur "HTTP 403"**
- Vérifiez que l'API YouTube Data v3 est activée
- Vérifiez les quotas de votre clé API

### **Aucune vidéo affichée**
- Vérifiez que la chaîne YouTube a des vidéos publiques
- Testez d'abord le Worker directement dans le navigateur

## 📝 IDs de chaînes populaires pour tester

- **Google Developers** : `UC_x5XG1OV2P6uZZ5FSM9Ttw`
- **BeBranded** : `UC...` (votre ID de chaîne)
- **Toute chaîne publique** : Copiez l'ID depuis l'URL YouTube

## 🎉 Succès !

Si tout fonctionne, vous devriez voir :
- Une grille de vidéos YouTube
- Thumbnails, titres, descriptions
- Dates de publication
- Design personnalisable via Webflow
