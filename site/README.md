# MARSON SENSUALITY — Site & dashboard

Site vitrine + boutique + **dashboard d'administration**, créé selon le cahier des charges.
**Lancer :** `python3 -m http.server 8000` depuis ce dossier → `http://localhost:8000`.
**Dashboard :** `http://localhost:8000/admin.html` (lien discret « Espace administrateur » en pied de page).
**Mot de passe initial : `marson2026`** (à changer dans « Contenus & réglages »).

---

## Identité visuelle (étape 1) ✔
- Palette : ivoire/crème `#FBF8F3`, brun très foncé `#2F2420`, beige/nude `#EDE4D8`/`#DFCDBC`, doré champagne `#C3A163` (touches fines), nude rosé `#EAD5CE` (discret).
- 2 polices : *Cormorant Garamond* (titres) + *Jost* (textes, menus, boutons).
- Photos cohérentes : lumière douce, fonds ivoire/crème/beige, sensualité suggérée.

## Navigation & pages (étapes 2–3) ✔
Accueil (13 sections) · Boutique (filtres, tri, recherche intelligente) · Collections (univers) · Fiches produit · Panier (tiroir, codes promo) · Commande (invité accepté) · Compte client · Contact (WhatsApp pré-rempli, formulaire) · Informations légales.
Barre d'annonce dynamique, responsive mobile complet.

## ✨ Dashboard administrateur (`admin.html`)
Pensé pour une personne non technique : grands boutons, phrases d'aide, confirmations visuelles.
- **Vue d'ensemble** : CA, CA du mois, commandes, produits en ligne, alerte stock bas, actions rapides, dernières commandes, guide en 3 pas.
- **Produits & photos** : créer / modifier / supprimer / **activer-désactiver** ; **stock suivi** (décrémenté à chaque commande, alerte stock bas, « Rupture » affiché au public) ; **2 photos** (principale + mise en scène, upload téléphone/ordinateur, redimensionnées et converties automatiquement) ; prix et ancien prix modifiables ; catégorie, audience, format, notes, mots-clés, collections.
- **Catégories & collections** : créer / modifier / supprimer des catégories (Parfums, Brumes…) et des collections (univers), avec image d'ambiance et **association des produits** à la collection.
- **Promotions** : codes avec **pourcentage et dates de validité** (refus automatique hors période) + prix barrés par produit.
- **Commandes** : liste complète, **détail dépliable** (articles, adresse, mode de livraison, paiement, note), statuts modifiables, informations client.
- **Comptabilité** (le bouton comptable) : CA total, CA du mois, panier moyen, remises, livraison perçue, graphique mois par mois, meilleurs produits, **export CSV** commandes + résumé mensuel.
- **Contenus & réglages** : **produits mis en avant** sur l'accueil + collection mise en avant, barre d'annonce, slogan & phrases, coordonnées, réseaux sociaux, livraison, **pixel Facebook**, **sauvegarde / restauration** complète (JSON), mot de passe.
- Les modifications sont visibles immédiatement sur le site (stockage local du navigateur de l'administrateur).

## Sécurité (section 24)
- Mots de passe admin **et** clients chiffrés SHA-256 (jamais en clair).
- Session admin expirant après 12 h ; **verrouillage 5 min après 5 tentatives** de connexion.
- Échappement HTML de toutes les données saisies (protection contre les injections/XSS) + validation des formulaires.
- Contrôle d'accès au dashboard ; données personnelles stockées localement, non transmises ; politique de confidentialité publiée.
- **Sauvegardes** : export/restauration JSON en un clic depuis le dashboard.
- HTTPS : à activer via l'hébergeur à la mise en ligne (Netlify/OVH/Hostinger = certificat automatique).

## Pixel Facebook / Meta ✔
- Renseignez l'ID du pixel dans le dashboard (« Contenus & réglages ») : le site charge alors `fbevents.js` et envoie les événements **PageView**, **AddToCart**, **InitiateCheckout**, **Purchase** (valeur en XOF).
- Vide = pixel désactivé (aucun traceur par défaut).

## Jumia — retiré ✔
Toutes les références (section accueil, bouton fiche produit, annonces, avantages) ont été supprimées à la demande.

## SEO (section 26)
- Titres HTML et méta-descriptions propres sur chaque page ; URLs simples (`boutique.html`, `produit.html?id=…`).
- Balises `alt` descriptives partout ; **Open Graph + Twitter Card** sur les 10 pages ; `og:locale fr_CI`.
- **Données structurées Schema.org** : `Organization` (accueil) et `Product` avec prix XOF et disponibilité (fiches produit).
- **`sitemap.xml`** (22 URLs) et **`robots.txt`** (admin et compte exclus) — domaine placeholder `votre-domaine.ci` à remplacer à la mise en ligne.
- Mots-clés visés : parfum Côte d'Ivoire, parfum Abidjan, MARSON SENSUALITY, parfums femme Côte d'Ivoire, brumes parfumées Côte d'Ivoire (présents dans titres, descriptions et contenus).

## Performance (section 27)
- Images **WebP** (−50 % de poids vs JPG originals conservés), redimensionnées ≤ 1600 px.
- `loading="lazy"` + `decoding="async"` sur toutes les images hors hero ; hero **préchargé**.
- Photos uploadées au dashboard : redimensionnées et compressées automatiquement.
- CSS/JS vanilla sans dépendance (2 fichiers), animations limitées et désactivées si `prefers-reduced-motion`.
- Mise en cache : à configurer chez l'hébergeur (en-têtes `Cache-Control` sur /assets).

## Responsive (section 25)
- Ordinateur : navigation complète, grandes images, rendu premium.
- Tablette : grilles adaptées (3→2 colonnes), en-tête conservé.
- Smartphone : menu plein écran, recherche et panier à portée de pouce, tiroir panier pleine largeur, boutons ≥ 44 px, aucun défilement horizontal (tableaux du dashboard défilables verticalement dans leur carte).

## Phases du cahier des charges
- **Phase 1 (MVP)** ✔ : identité, accueil, boutique, fiches produits, recherche, catégories, collections, panier, commande, contact, WhatsApp, responsive, administration produits, livraison, paiements.
- **Phase 2** ✔ en grande partie : compte client, historique, favoris, codes promo, newsletter, avis (placeholder authentique), recherche intelligente, gestion des promotions.
- **Phase 3** (à venir) : recommandations, fidélité, automatisations, statistiques avancées, autres canaux de vente.

## ⚠ À personnaliser (depuis le dashboard, sans code)
1. Numéro WhatsApp Business, e-mail, téléphone, adresse.
2. Liens Instagram / Facebook / TikTok.
3. Frais de livraison réels (indicatifs : Abidjan 1 500 / intérieur 3 000 FCFA).
4. ID du pixel Facebook.
5. Vos vrais produits, prix et photos (le catalogue actuel est un exemple cohérent).
6. Mot de passe administrateur.

## Note technique
Site statique HTML/CSS/JS : hébergeable partout (OVH, Netlify, Hostinger…). Données (panier, comptes, commandes, produits modifiés) stockées localement en démonstration ; un branchement base de données pourra être fait en phase 3 pour partager le catalogue entre appareils.
