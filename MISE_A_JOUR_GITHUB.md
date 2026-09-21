# Mettre à jour votre dépôt GitHub existant

## 1. Récupérer le code
Téléchargez le ZIP `marson-sensuality-render.zip` depuis l'espace de travail
et décompressez-le (vous obtenez un dossier `marson-sensuality-render` contenant
`backend/`, `frontend/`, `render.yaml`, `requirements.txt`, `README.md`, `.gitignore`).

## 2. Pousser vers votre dépôt existant

### Variante A — « Refaire » le dépôt (recommandé : remplace tout par la nouvelle version)
```bash
cd marson-sensuality-render
git init
git add -A
git commit -m "MARSON SENSUALITY — version Render (backend + frontend + dashboard)"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/VOTRE-DEPOT.git
git push -f -u origin main
```
⚠ `-f` écrase l'ancien contenu du dépôt GitHub (l'ancienne ébauche du site).
Si votre branche par défaut s'appelle `master` : remplacez `main` par `master`
dans les deux dernières commandes (ou changez-la dans Settings → Branches).

### Variante B — Mettre à jour en conservant l'historique
```bash
git clone https://github.com/VOTRE-COMPTE/VOTRE-DEPOT.git depot-ms
# copiez-collez le CONTENU du dossier dézippé dans depot-ms/ (en remplaçant les anciens fichiers)
cd depot-ms
git add -A
git commit -m "Mise à jour : séparation backend/frontend, prêt pour Render"
git push
```

## 3. Côté Render
Si votre service Render pointe déjà vers ce dépôt : le déploiement se lance
automatiquement à chaque push. Sinon : New → Blueprint → ce dépôt (voir README.md).

## 4. Après déploiement
- `/admin.html` → changer le mot de passe (`marson2026` au premier lancement) ;
- disque persistant + `DB_PATH=/data/db.json` (déjà prévu par render.yaml) ;
- remplacer `votre-domaine.ci` par votre domaine réel (robots.txt, sitemap.xml, Open Graph).
