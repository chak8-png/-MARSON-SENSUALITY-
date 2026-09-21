# Backend — MARSON SENSUALITY

Serveur API + fichiers statiques, **Python standard uniquement** (aucune dépendance).

## Lancement
```bash
python3 backend/server.py          # port 8000 (ou PORT=8080 python3 backend/server.py)
```
Le serveur expose :
- le **frontend** (`../frontend`) avec bons MIME et cache (`assets/` mis en cache 7 j, HTML non caché) ;
- l'**API JSON** décrite ci-dessous.

## Base de données
`db.json` : catalogue, catégories, collections, configuration, annonces, phrases,
promotions, commandes, comptes clients, messages de contact, newsletter, jetons.
Toute écriture passe par l'API (jamais à la main en production).
Sauvegarde / restauration disponibles depuis le dashboard.

## Authentification
- `POST /api/admin/login {password}` → `{token}` (session 12 h, verrou 5 min après 5 échecs).
- `POST /api/auth/register` / `POST /api/auth/login` → `{token, email}` (session 30 j).
- Mot de passe : **SHA-256 salé** (sel par compte ; sel global pour l'admin).
- Jetons : `Authorization: Bearer <token>`, expiration purgée à chaque émission.

## Routes publiques
| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/bootstrap` | catalogue actif + catégories + collections + config publique + annonces + phrases + mise en avant |
| GET | `/api/product?id=` | fiche produit (actif uniquement) |
| POST | `/api/promo/validate {code}` | valide un code promo (période comprise) → `{valid, rate}` |
| POST | `/api/orders {items, …, code}` | crée la commande : **prix, remise, livraison et stocks recalculés côté serveur** → `{order}` |
| POST | `/api/newsletter {email}` | inscription newsletter |
| POST | `/api/contact {nom, contact, sujet, message}` | message de contact (lu dans le dashboard) |

## Routes compte client (jeton client)
| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/auth/me` | infos + commandes de la cliente |
| POST | `/api/auth/me {prenom, nom, telephone, adresses}` | mise à jour |
| POST | `/api/auth/password {old, new}` | changement de mot de passe |

## Routes administration (jeton admin)
| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/admin/state` | vue complète (produits désactivés inclus, commandes, messages, promos) |
| GET | `/api/admin/backup` | sauvegarde JSON complète |
| POST | `/api/admin/restore {backup}` | restauration |
| POST | `/api/admin/password {old, new}` | changement du mot de passe admin |
| POST | `/api/admin/products {product}` | créer / modifier un produit (id, nom, prix requis) |
| DELETE | `/api/admin/products/{id}` | supprimer |
| POST | `/api/admin/categories {category}` · DELETE `/api/admin/categories/{id}` | catégories (suppression bloquée si utilisée) |
| POST | `/api/admin/collections {collection}` · DELETE `/api/admin/collections/{id}` | collections |
| POST | `/api/admin/collections/products {id, productIds}` | associer des produits à une collection |
| POST | `/api/admin/config {config}` | configuration (coordonnées, livraison, pixel, slogan…) |
| POST | `/api/admin/announcements {list}` | barre d'annonce |
| POST | `/api/admin/phrases {phrases}` | phrases de marque |
| POST | `/api/admin/featured {ids, collection}` | produits & collection mis en avant |
| POST | `/api/admin/promos {code, rate, debut, fin}` · DELETE `/api/admin/promos/{code}` | codes promo avec validité |
| POST | `/api/admin/orders/status {ref, statut}` | suivi de commande |

## Sécurité intégrée
- prix / stocks / remises **recalculés côté serveur** à chaque commande (le navigateur n'est jamais cru) ;
- limites de taille des corps JSON (4 Mo) et des champs (longueurs bornées) ;
- en-têtes `X-Content-Type-Options`, `X-Frame-Options`, `Cache-Control: no-store` sur l'API ;
- anti force-brute sur la connexion admin ;
- ⚠ production : servir derrière **HTTPS** (reverse-proxy nginx/Caddy ou hébergeur avec certificat).
