# MARSON SENSUALITY — Maison de parfum (site + boutique + dashboard)

Projet **séparé en backend et frontend** pour une lecture claire :

```
.
├── backend/                  ← SERVEUR (Python standard, aucune dépendance)
│   ├── server.py             ← API JSON + service des fichiers du frontend
│   ├── db.json               ← base de données (catalogue, commandes, comptes, réglages)
│   └── README.md             ← documentation complète de l'API
│
└── frontend/                 ← SITE (HTML / CSS / JS vanilla)
    ├── index.html            ← page d'accueil (13 sections)
    ├── boutique.html         ← boutique : filtres, tri, recherche intelligente
    ├── collections.html      ← univers & collections
    ├── produit.html          ← fiche produit (galerie, notes, panier, favoris)
    ├── commande.html         ← tunnel de commande (invité accepté)
    ├── compte.html           ← espace client (commandes, favoris, adresses)
    ├── contact.html          ← WhatsApp, e-mail, réseaux, formulaire
    ├── a-propos.html         ← histoire, vision, philosophie
    ├── infos-legales.html    ← livraison, retours, CGV, confidentialité
    ├── admin.html            ← DASHBOARD administrateur
    ├── robots.txt / sitemap.xml
    └── assets/
        ├── css/style.css     ← design system (palette ivoire/brun/doré, 2 polices)
        ├── js/api.js         ← client API + état du catalogue (MS, MS_UTILS)
        ├── js/main.js        ← logique du site public
        ├── js/admin.js       ← logique du dashboard
        └── img/              ← photographies WebP de l'univers de la marque
```

## Lancer le projet
```bash
python3 backend/server.py
```
Puis ouvrir `http://localhost:8000` (ou l'aperçu en direct du sandbox).
Un seul serveur sert le site **et** l'API : aucune configuration CORS, aucun build.

## Accéder au dashboard
- URL : `/admin.html` (lien « Espace administrateur » en pied de page).
- Mot de passe initial : **`marson2026`** → à changer dans « Contenus & réglages ».
- Le dashboard permet tout gérer sans code : produits (photos, stock, activation),
  catégories, collections, promotions avec validité, commandes & statuts,
  comptabilité avec export CSV, textes du site, mise en avant, pixel Facebook,
  coordonnées, livraison, sauvegardes.

## Répartition des responsabilités
| Couche | Rôle |
|---|---|
| `backend/server.py` | routes API, authentification par jetons, mots de passe SHA-256 salés, recalcul serveur des prix/stocks/remises, persistance `db.json`, anti force-brute, sauvegardes |
| `frontend/assets/js/api.js` | client API (jetons client & admin), état `MS`, recherche intelligente, formatage FCFA |
| `frontend/assets/js/main.js` | rendu du site public : en-tête, annonce dynamique, recherche, panier, commande, compte, contact, SEO JSON-LD, pixel Meta |
| `frontend/assets/js/admin.js` | rendu du dashboard : 7 écrans guidés, upload & compression des photos |
| `frontend/assets/css/style.css` | identité visuelle : ivoire/crème, brun profond, doré champagne discret, Cormorant Garamond + Jost |

## À personnaliser (depuis le dashboard, sans code)
Numéro WhatsApp Business · e-mail · téléphone · adresse · liens Instagram/Facebook/TikTok ·
frais de livraison · ID du pixel Facebook · slogan et phrases · vrais produits, prix et photos ·
mot de passe administrateur · domaine réel dans `robots.txt`, `sitemap.xml` et balises Open Graph.

## Déployer sur Render

### 0. Pousser le code sur GitHub
```bash
git init && git add -A && git commit -m "MARSON SENSUALITY — site + backend"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/marson-sensuality.git
git push -u origin main
```

### 1. Créer le service (2 méthodes au choix)
**Méthode A — Blueprint (recommandée, tout automatique)**
Render Dashboard → **New → Blueprint** → sélectionner le dépôt → Render lit
`render.yaml` : service Python, commande de démarrage, disque persistant et
variable `DB_PATH` créés automatiquement.

**Méthode B — Manuelle**
Render Dashboard → **New → Web Service** → connecter le dépôt, puis :
| Champ | Valeur |
|---|---|
| Runtime | Python 3 |
| Build Command | *(laisser vide)* |
| Start Command | `python backend/server.py` |
| Health Check Path | `/` |
| Plan | Starter (recommandé) ou Free (voir encadré) |

### 2. Persistance des données (indispensable)
Render **efface les fichiers à chaque redémarrage**. Deux options :
- **Disque persistant (recommandé)** : service → *Disks* → *Add Disk* :
  nom `data`, point de montage `/data`, 1 Go ; puis *Environment* :
  `DB_PATH=/data/db.json`. Au premier démarrage, le serveur y copie
  automatiquement la base graine (`backend/db.json`).
- **Plan gratuit (sans disque)** : déconseillé pour une boutique vivante —
  commandes, comptes et produits ajoutés seraient perdus à chaque mise en
  veille/restart du service free. Acceptable uniquement pour une démo avec le
  catalogue graine. Pour un vrai gratuit persistant : prochaine étape possible =
  migration du stockage vers Postgres hébergé (Neon/Supabase, offre gratuite) —
  le frontend ne changerait pas, seul `server.py` serait adapté.

### 3. Checklist après mise en ligne
1. Changer le mot de passe admin (`/admin.html` → Contenus & réglages).
2. Renseigner WhatsApp, e-mail, téléphone, réseaux, frais de livraison, pixel Facebook.
3. Remplacer le domaine placeholder `votre-domaine.ci` dans :
   `frontend/robots.txt`, `frontend/sitemap.xml` et les balises Open Graph
   (`grep -rl "votre-domaine.ci" frontend | xargs sed -i 's|votre-domaine.ci|VOTRE-DOMAINE|g'`),
   puis ajouter le domaine Render dans un nouvel envoi de sitemap (Search Console).
4. Ajouter un domaine personnalisé (Render → Settings → Custom Domains) si désiré :
   le certificat HTTPS est automatique — l'exigence « HTTPS » du cahier des charges est donc couverte.
5. Télécharger une sauvegarde de temps en temps (dashboard → Sauvegardes).

## Phases du cahier des charges
- **Phase 1 (MVP)** ✔ identité, accueil, boutique, fiches, recherche, catégories, collections, panier, commande, contact, WhatsApp, responsive, administration produits, livraison, paiements.
- **Phase 2** ✔ compte client, historique, favoris, codes promo avec validité, newsletter, avis (emplacement réservé aux vrais retours), recherche intelligente, gestion des promotions.
- **Phase 3** (à planifier) : recommandations, fidélité, automatisations marketing, statistiques avancées, autres canaux de vente, base de données SQL hébergée si besoin.
