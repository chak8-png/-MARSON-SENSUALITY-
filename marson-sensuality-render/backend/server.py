#!/usr/bin/env python3
# ============================================================
#  MARSON SENSUALITY — BACKEND (API + serveur de fichiers)
#  Python standard uniquement : aucune dépendance à installer.
#
#  Lancement :  python3 backend/server.py
#  Port :       8000  (variable d'environnement PORT acceptée)
#
#  Rôles :
#    1. Servir le frontend (dossier ../frontend) avec bons MIME + cache.
#    2. Exposer une API JSON (/api/…) : catalogue, commandes, comptes,
#       administration, sauvegardes.
#    3. Persister toutes les données dans db.json (la "base").
#
#  Sécurité intégrée :
#    - mots de passe salés + SHA-256 (jamais en clair) ;
#    - jetons de session avec expiration (admin 12 h, client 30 j) ;
#    - verrouillage anti force-brute (5 échecs → 5 min) ;
#    - validation serveur des prix, stocks et codes promo à la commande ;
#    - en-têtes HTTP de base (X-Content-Type-Options, X-Frame-Options).
#    ⚠ En production : déployer derrière HTTPS (reverse-proxy ou
#      hébergeur avec certificat automatique).
# ============================================================

import json, hashlib, secrets, os, re, time, threading
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime, date

PORT      = int(os.environ.get("PORT", 8000))
HERE      = os.path.dirname(os.path.abspath(__file__))
# Emplacement de la base : par défaut à côté du serveur.
# En production (Render…), montez un disque persistant et définissez
# la variable d'environnement DB_PATH (ex. : /data/db.json).
DB_PATH   = os.environ.get("DB_PATH", os.path.join(HERE, "db.json"))
SEED_PATH = os.path.join(HERE, "db.json")          # graine livrée avec le code
FRONTEND  = os.path.normpath(os.path.join(HERE, "..", "frontend"))

ADMIN_SESSION_H = 12          # durée de session administrateur (heures)
CLIENT_SESSION_D = 30         # durée de session cliente (jours)
MAX_TRIES, LOCK_S = 5, 300    # anti force-brute

_lock = threading.Lock()
_fail = {}                    # ip -> [nombre, timestamp] (mémoire)

# ------------------------------------------------------------ base de données
def db_load():
    with open(DB_PATH, encoding="utf-8") as f:
        return json.load(f)

def db_save(db):
    tmp = DB_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=1)
    os.replace(tmp, DB_PATH)

# ------------------------------------------------------------ petits outils
def hachage(mot_de_passe, salt):
    return hashlib.sha256((mot_de_passe + salt).encode("utf-8")).hexdigest()

def maintenant():
    return datetime.now().strftime("%d/%m/%Y")

def mois_courant():
    return date.today().isoformat()[:7]

def promo_valide(db, code):
    """Retourne le taux d'un code promo s'il existe et est dans sa période."""
    p = (db.get("promos") or {}).get((code or "").upper())
    if not p:
        return None
    today = date.today().isoformat()
    if p.get("debut") and today < p["debut"]:
        return None
    if p.get("fin") and today > p["fin"]:
        return None
    return float(p.get("rate", 0))

def config_public(cfg):
    """Configuration transmise au site public (rien de sensible)."""
    return {k: v for k, v in cfg.items()}

def bootstrap_public(db):
    return {
        "products":    [p for p in db["products"] if p.get("active") is not False],
        "categories":  db["categories"],
        "collections": db["collections"],
        "config":      config_public(db["config"]),
        "announcements": db["announcements"],
        "phrases":     db["phrases"],
        "featured":    db["featured"],
        "featuredCollection": db["featuredCollection"],
    }

def admin_state(db):
    """Vue complète réservée au dashboard."""
    st = bootstrap_public(db)
    st["products"]   = db["products"]           # y compris désactivés
    st["promos"]     = db["promos"]
    st["orders"]     = db["orders"]
    st["messages"]   = db["messages"]
    st["newsletter"] = db["newsletter"]
    return st

# ------------------------------------------------------------ jetons
def token_new(db, role, email=None):
    tok = secrets.token_hex(24)
    exp = time.time() + (ADMIN_SESSION_H * 3600 if role == "admin" else CLIENT_SESSION_D * 86400)
    db["tokens"][tok] = {"role": role, "email": email, "exp": exp}
    # purge des jetons expirés
    for t in [t for t, v in db["tokens"].items() if v["exp"] < time.time()]:
        del db["tokens"][t]
    return tok

def token_check(db, handler, role):
    head = handler.headers.get("Authorization", "")
    tok = head[7:] if head.startswith("Bearer ") else ""
    info = db["tokens"].get(tok)
    if not info or info["exp"] < time.time() or info["role"] != role:
        return None
    return info

# ============================================================ HANDLER HTTP
class Handler(BaseHTTPRequestHandler):
    server_version = "MarsonSensuality/2.0"
    protocol_version = "HTTP/1.1"

    # ---------- réponses ----------
    def _json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.end_headers()
        self.wfile.write(body)

    def _err(self, status, msg):
        self._json({"ok": False, "error": msg}, status)

    def _body(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > 4_000_000:                      # limite anti abus (photos incluses)
            return None
        raw = self.rfile.read(n) if n else b"{}"
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:
            return None

    def log_message(self, fmt, *args):         # journal allégé (API seulement)
        try:
            first = str(args[0]) if args else str(fmt)
        except Exception:
            first = ""
        if "/api/" in first or "code 4" in first or "code 5" in first:
            super().log_message(fmt, *args)

    def do_HEAD(self):
        """Sonde de santé des hébergeurs (Render, load balancers)."""
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", "0")
        self.end_headers()

    # ---------- routage ----------
    def do_GET(self):
        u = urlparse(self.path)
        if u.path.startswith("/api/"):
            return self.api_get(u)
        return self.static(u.path)

    def do_POST(self):
        u = urlparse(self.path)
        if u.path.startswith("/api/"):
            return self.api_post(u)
        return self._err(404, "Introuvable")

    def do_PUT(self):
        return self.do_POST()

    def do_DELETE(self):
        u = urlparse(self.path)
        if u.path.startswith("/api/"):
            return self.api_delete(u)
        return self._err(404, "Introuvable")

    # ---------- fichiers statiques (frontend) ----------
    def static(self, path):
        rel = path.split("?")[0].lstrip("/") or "index.html"
        full = os.path.normpath(os.path.join(FRONTEND, rel))
        if not full.startswith(FRONTEND) or not os.path.isfile(full):
            return self._err(404, "Page introuvable")
        ext = os.path.splitext(full)[1].lower()
        mime = {".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
                ".js": "application/javascript; charset=utf-8", ".json": "application/json",
                ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                ".png": "image/png", ".svg": "image/svg+xml", ".xml": "application/xml",
                ".txt": "text/plain; charset=utf-8", ".ico": "image/x-icon"}.get(ext, "application/octet-stream")
        with open(full, "rb") as f:
            data = f.read()
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        # cache : une semaine pour les assets, rien pour le HTML
        self.send_header("Cache-Control", "public, max-age=604800" if rel.startswith("assets/") else "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(data)

    # ============================================================ API LECTURE
    def api_get(self, u):
        q = parse_qs(u.query)
        with _lock:
            db = db_load()
            if u.path == "/api/bootstrap":
                return self._json({"ok": True, **bootstrap_public(db)})

            if u.path == "/api/product":
                pid = (q.get("id") or [""])[0]
                p = next((p for p in db["products"] if p["id"] == pid and p.get("active") is not False), None)
                return self._json({"ok": True, "product": p}) if p else self._err(404, "Produit introuvable")

            if u.path == "/api/auth/me":
                info = token_check(db, self, "client")
                if not info:
                    return self._err(401, "Session expirée")
                usr = db["users"].get(info["email"])
                orders = [o for o in db["orders"] if o.get("email") == info["email"]]
                return self._json({"ok": True, "user": {k: usr[k] for k in ("prenom", "nom", "telephone", "adresses") if k in usr},
                                   "orders": orders})

            if u.path.startswith("/api/admin"):
                info = token_check(db, self, "admin")
                if not info:
                    return self._err(401, "Connexion administrateur requise")
                if u.path == "/api/admin/state":
                    return self._json({"ok": True, **admin_state(db)})
                if u.path == "/api/admin/backup":
                    return self._json({"ok": True, "backup": db})
            return self._err(404, "Route inconnue")

    # ============================================================ API ÉCRITURE
    def api_post(self, u):
        body = self._body()
        if body is None:
            return self._err(413, "Contenu trop volumineux ou invalide")
        with _lock:
            db = db_load()

            # ---------- public ----------
            if u.path == "/api/newsletter":
                em = str(body.get("email", "")).strip()
                if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", em):
                    return self._err(400, "E-mail invalide")
                if em not in db["newsletter"]:
                    db["newsletter"].append(em); db_save(db)
                return self._json({"ok": True})

            if u.path == "/api/contact":
                nom = str(body.get("nom", "")).strip()[:120]
                msg = str(body.get("message", "")).strip()[:2000]
                if not nom or not msg:
                    return self._err(400, "Champs requis manquants")
                db["messages"].append({"date": maintenant(), "nom": nom,
                                       "contact": str(body.get("contact", ""))[:120],
                                       "sujet": str(body.get("sujet", ""))[:80], "message": msg})
                db_save(db)
                return self._json({"ok": True})

            if u.path == "/api/promo/validate":
                rate = promo_valide(db, str(body.get("code", "")))
                return self._json({"ok": True, "valid": rate is not None, "rate": rate or 0})

            # ---------- commande (prix et stocks recalculés côté serveur) ----------
            if u.path == "/api/orders":
                items_in = body.get("items") or []
                lines, sub = [], 0
                for it in items_in:
                    p = next((p for p in db["products"] if p["id"] == it.get("id") and p.get("active") is not False), None)
                    qty = int(it.get("qty", 0))
                    if not p or qty < 1 or qty > 50:
                        return self._err(400, "Panier invalide")
                    if isinstance(p.get("stock"), int) and qty > p["stock"]:
                        return self._err(409, f"Stock insuffisant pour {p['nom']}")
                    lines.append({"id": p["id"], "nom": p["nom"], "qty": qty, "prix": p["prix"]})
                    sub += p["prix"] * qty
                if not lines:
                    return self._err(400, "Panier vide")
                rate = promo_valide(db, str(body.get("code", ""))) or 0
                disc = round(sub * rate)
                zone = body.get("zone") if body.get("zone") in ("abidjan", "interieur") else None
                if not zone:
                    return self._err(400, "Zone de livraison requise")
                ship = db["config"]["livraison"]["abidjan"] if zone == "abidjan" else db["config"]["livraison"]["interieur"]
                order = {
                    "ref": "MS%d" % (1024 + len(db["orders"]) + 1),
                    "date": maintenant(), "mois": mois_courant(),
                    "client": f"{str(body.get('prenom','')).strip()[:60]} {str(body.get('nom','')).strip()[:60]}".strip(),
                    "email": str(body.get("email", "")).strip()[:120],
                    "tel": str(body.get("tel", "")).strip()[:40],
                    "items": lines, "sousTotal": sub, "remise": disc, "livraison": ship,
                    "total": sub - disc + ship,
                    "zone": zone,
                    "mode": body.get("mode") if body.get("mode") in ("rdv", "coursier") else "rdv",
                    "paiement": body.get("paiement") if body.get("paiement") in ("mobile", "carte", "livraison") else "mobile",
                    "adresse": str(body.get("adresse", ""))[:200],
                    "note": str(body.get("note", ""))[:500],
                    "compte": "client" if token_check(db, self, "client") else "invité",
                    "statut": "En préparation",
                }
                for l in lines:                                   # décrémente le stock suivi
                    p = next(p for p in db["products"] if p["id"] == l["id"])
                    if isinstance(p.get("stock"), int):
                        p["stock"] = max(0, p["stock"] - l["qty"])
                db["orders"].append(order)
                db_save(db)
                return self._json({"ok": True, "order": order})

            # ---------- comptes clients ----------
            if u.path == "/api/auth/register":
                em = str(body.get("email", "")).strip().lower()
                if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", em):
                    return self._err(400, "E-mail invalide")
                if em in db["users"]:
                    return self._err(409, "Un compte existe déjà avec cet e-mail")
                pwd = str(body.get("password", ""))
                if len(pwd) < 6:
                    return self._err(400, "Mot de passe : 6 caractères minimum")
                salt = secrets.token_hex(8)
                db["users"][em] = {"prenom": str(body.get("prenom", ""))[:60], "nom": str(body.get("nom", ""))[:60],
                                   "telephone": str(body.get("telephone", ""))[:40],
                                   "salt": salt, "password_hash": hachage(pwd, salt), "adresses": []}
                tok = token_new(db, "client", em)
                db_save(db)
                return self._json({"ok": True, "token": tok, "email": em})

            if u.path == "/api/auth/login":
                em = str(body.get("email", "")).strip().lower()
                usr = db["users"].get(em)
                if not usr or usr["password_hash"] != hachage(str(body.get("password", "")), usr["salt"]):
                    return self._err(401, "E-mail ou mot de passe incorrect")
                tok = token_new(db, "client", em)
                db_save(db)
                return self._json({"ok": True, "token": tok, "email": em})

            if u.path == "/api/auth/password":
                info = token_check(db, self, "client")
                if not info:
                    return self._err(401, "Session expirée")
                usr = db["users"][info["email"]]
                if usr["password_hash"] != hachage(str(body.get("old", "")), usr["salt"]):
                    return self._err(401, "Mot de passe actuel incorrect")
                if len(str(body.get("new", ""))) < 6:
                    return self._err(400, "6 caractères minimum")
                usr["salt"] = secrets.token_hex(8)
                usr["password_hash"] = hachage(str(body.get("new", "")), usr["salt"])
                db_save(db)
                return self._json({"ok": True})

            if u.path == "/api/auth/me":                            # mise à jour infos / adresses
                info = token_check(db, self, "client")
                if not info:
                    return self._err(401, "Session expirée")
                usr = db["users"][info["email"]]
                for k in ("prenom", "nom", "telephone"):
                    if k in body:
                        usr[k] = str(body[k])[:60]
                if "adresses" in body and isinstance(body["adresses"], list):
                    usr["adresses"] = [str(a)[:200] for a in body["adresses"]][:20]
                db_save(db)
                return self._json({"ok": True})

            # ---------- administration ----------
            if u.path == "/api/admin/login":
                ip = self.client_address[0]
                f = _fail.get(ip, [0, 0])
                if f[0] >= MAX_TRIES and time.time() - f[1] < LOCK_S:
                    return self._err(423, f"Trop de tentatives — réessayez dans {int((LOCK_S - (time.time() - f[1])) // 60) + 1} min")
                if hachage(str(body.get("password", "")), db["admin"]["salt"]) == db["admin"]["password_hash"]:
                    _fail.pop(ip, None)
                    tok = token_new(db, "admin")
                    db_save(db)
                    return self._json({"ok": True, "token": tok})
                f = [f[0] + 1, time.time()]; _fail[ip] = f
                left = MAX_TRIES - f[0]
                return self._err(401, f"Mot de passe incorrect{' — ' + str(left) + ' essai(s) restant(s)' if left > 0 else ''}")

            info = token_check(db, self, "admin")
            if not info:
                return self._err(401, "Connexion administrateur requise")

            if u.path == "/api/admin/password":
                if hachage(str(body.get("old", "")), db["admin"]["salt"]) != db["admin"]["password_hash"]:
                    return self._err(401, "Mot de passe actuel incorrect")
                if len(str(body.get("new", ""))) < 6:
                    return self._err(400, "6 caractères minimum")
                db["admin"]["password_hash"] = hachage(str(body.get("new", "")), db["admin"]["salt"])
                db_save(db)
                return self._json({"ok": True})

            if u.path == "/api/admin/products":
                p = body.get("product") or {}
                if not p.get("id") or not p.get("nom") or not isinstance(p.get("prix"), int) or p["prix"] <= 0:
                    return self._err(400, "Produit invalide (id, nom et prix requis)")
                db["products"] = [x for x in db["products"] if x["id"] != p["id"]] + [p]
                db_save(db)
                return self._json({"ok": True})

            if u.path == "/api/admin/categories":
                c = body.get("category") or {}
                if not c.get("id") or not c.get("nom"):
                    return self._err(400, "Catégorie invalide")
                db["categories"] = [x for x in db["categories"] if x["id"] != c["id"]] + [c]
                db_save(db)
                return self._json({"ok": True})

            if u.path == "/api/admin/collections":
                c = body.get("collection") or {}
                if not c.get("id") or not c.get("nom"):
                    return self._err(400, "Collection invalide")
                db["collections"] = [x for x in db["collections"] if x["id"] != c["id"]] + [c]
                db_save(db)
                return self._json({"ok": True})

            if u.path == "/api/admin/collections/products":
                # associe / dissocie des produits à une collection
                cid, ids = body.get("id"), set(body.get("productIds") or [])
                for p in db["products"]:
                    cols = [c for c in (p.get("collections") or []) if c != cid]
                    if p["id"] in ids:
                        cols.append(cid)
                    p["collections"] = cols
                db_save(db)
                return self._json({"ok": True})

            if u.path == "/api/admin/config":
                for k, v in (body.get("config") or {}).items():
                    if k == "livraison" and isinstance(v, dict):
                        db["config"]["livraison"].update(v)
                    else:
                        db["config"][k] = v
                db_save(db)
                return self._json({"ok": True})

            if u.path == "/api/admin/announcements":
                db["announcements"] = [str(a)[:160] for a in (body.get("list") or [])][:8]
                db_save(db)
                return self._json({"ok": True})

            if u.path == "/api/admin/phrases":
                for k, v in (body.get("phrases") or {}).items():
                    if k in db["phrases"]:
                        db["phrases"][k] = str(v)[:200]
                db_save(db)
                return self._json({"ok": True})

            if u.path == "/api/admin/featured":
                ids = [i for i in (body.get("ids") or []) if any(p["id"] == i for p in db["products"])]
                if ids:
                    db["featured"] = ids
                if body.get("collection"):
                    db["featuredCollection"] = str(body["collection"])
                db_save(db)
                return self._json({"ok": True})

            if u.path == "/api/admin/promos":
                code = str(body.get("code", "")).upper().replace(" ", "")
                pct = body.get("rate")
                if not code or not isinstance(pct, (int, float)) or not (0 < pct <= 0.9):
                    return self._err(400, "Code et taux (0 < taux ≤ 0.90) requis")
                db["promos"][code] = {"rate": pct, "debut": str(body.get("debut", "")), "fin": str(body.get("fin", ""))}
                db_save(db)
                return self._json({"ok": True})

            if u.path == "/api/admin/orders/status":
                o = next((o for o in db["orders"] if o["ref"] == body.get("ref")), None)
                if not o or body.get("statut") not in ("En préparation", "Expédiée", "Livrée", "Annulée"):
                    return self._err(400, "Commande ou statut invalide")
                o["statut"] = body["statut"]
                db_save(db)
                return self._json({"ok": True})

            if u.path == "/api/admin/restore":
                bk = body.get("backup") or {}
                if not all(k in bk for k in ("products", "config", "orders", "admin")):
                    return self._err(400, "Sauvegarde invalide")
                db_save(bk)
                return self._json({"ok": True})

            return self._err(404, "Route inconnue")

    # ============================================================ API SUPPRESSION
    def api_delete(self, u):
        with _lock:
            db = db_load()
            info = token_check(db, self, "admin")
            if not info:
                return self._err(401, "Connexion administrateur requise")
            m = re.match(r"^/api/admin/(products|categories|collections|promos)/([\w\-\.]+)$", u.path)
            if not m:
                return self._err(404, "Route inconnue")
            kind, key = m.group(1), m.group(2)
            if kind == "products":
                db["products"] = [p for p in db["products"] if p["id"] != key]
            elif kind == "categories":
                if any(p.get("type") == key for p in db["products"]):
                    return self._err(409, "Des produits utilisent cette catégorie")
                db["categories"] = [c for c in db["categories"] if c["id"] != key]
            elif kind == "collections":
                db["collections"] = [c for c in db["collections"] if c["id"] != key]
                for p in db["products"]:
                    p["collections"] = [c for c in (p.get("collections") or []) if c != key]
            elif kind == "promos":
                db["promos"].pop(key, None)
            db_save(db)
            return self._json({"ok": True})


if __name__ == "__main__":
    # Si la base vise un disque persistant vide (premier démarrage Render),
    # on y copie la graine livrée avec le code.
    if not os.path.exists(DB_PATH) and os.path.exists(SEED_PATH) and DB_PATH != SEED_PATH:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        import shutil
        shutil.copy(SEED_PATH, DB_PATH)
        print(f"✦ base initialisée depuis la graine → {DB_PATH}")
    print(f"✦ MARSON SENSUALITY — backend sur http://0.0.0.0:{PORT}")
    print(f"  frontend : {FRONTEND}")
    print(f"  base     : {DB_PATH}")
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
