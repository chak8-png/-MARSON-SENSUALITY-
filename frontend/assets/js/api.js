/* ============================================================
   MARSON SENSUALITY — FRONTEND / client API
   Ce fichier fait le pont entre le site et le backend (/api).
   Il expose :
     - API       : appels réseau (jetons client & admin gérés ici)
     - MS        : l'état du catalogue, rempli par MS.load()
     - MS_UTILS  : formatage, recherche intelligente, liens
   ============================================================ */

const API = {
  clientToken: () => localStorage.getItem("ms_token"),
  adminToken:  () => localStorage.getItem("ms_admin_token"),
  setClientToken: t => t ? localStorage.setItem("ms_token", t) : localStorage.removeItem("ms_token"),
  setAdminToken:  t => t ? localStorage.setItem("ms_admin_token", t) : localStorage.removeItem("ms_admin_token"),

  async req(path, {method = "GET", body, admin = false} = {}){
    const headers = {"Content-Type": "application/json"};
    const tok = admin ? API.adminToken() : API.clientToken();
    if(tok) headers["Authorization"] = "Bearer " + tok;
    const res = await fetch("/api" + path, {
      method, headers, body: body ? JSON.stringify(body) : undefined
    });
    let data = {};
    try{ data = await res.json(); }catch(e){}
    if(!res.ok || data.ok === false){
      const err = new Error(data.error || ("Erreur " + res.status));
      err.status = res.status;
      throw err;
    }
    return data;
  },
  get:   (p, admin) => API.req(p, {admin}),
  post:  (p, body, admin) => API.req(p, {method: "POST", body, admin}),
  del:   (p, admin) => API.req(p, {method: "DELETE", admin})
};

/* ---------- État public du site (rempli depuis le backend) ---------- */
const MS = {
  config: {}, products: [], categories: [], collections: [],
  announcements: [], phrases: {}, featured: [], featuredCollection: "signature",
  advantages: [
    { icone: "drop",  titre: "Sélection de fragrances", texte: "Des compositions exigeantes, pensées comme des signatures plutôt que comme des tendances." },
    { icone: "box",   titre: "Livraison en Côte d'Ivoire", texte: "Abidjan et toutes les villes du pays, sous 3 jours, en point de rendez-vous ou par coursier." },
    { icone: "heart", titre: "Service attentionné", texte: "Une écoute vraie sur WhatsApp, du lundi au samedi, pour vous guider dans vos choix." },
    { icone: "card",  titre: "Paiement au choix", texte: "Mobile Money, carte bancaire ou paiement à la livraison — comme vous préférez." }
  ],
  async load(){
    const d = await API.get("/bootstrap");
    Object.assign(MS, {
      config: d.config, products: d.products, categories: d.categories,
      collections: d.collections, announcements: d.announcements,
      phrases: d.phrases, featured: d.featured, featuredCollection: d.featuredCollection
    });
    return d;
  }
};

/* ---------- Utilitaires partagés ---------- */
const MS_UTILS = {
  fmt(n){ return n.toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ") + " FCFA"; },
  norm(s){ return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); },
  byId(id){ return MS.products.find(p => p.id === id); },
  collName(id){ const c = MS.collections.find(c => c.id === id); return c ? c.nom : ""; },
  catName(id){ const c = MS.categories.find(c => c.id === id); return c ? c.nom.replace(/s\s*$/, "") : id; },
  waLink(){ return "https://wa.me/" + (MS.config.whatsapp || "") + "?text=" + encodeURIComponent(MS.config.whatsappMessage || "Bonjour MARSON SENSUALITY"); },

  /* Recherche intelligente : accents ignorés, synonymes, mots partiels */
  search(q){
    const nq = MS_UTILS.norm(q).trim();
    if(!nq) return [];
    const tokens = nq.split(/\s+/).filter(t => t.length > 1);
    if(!tokens.length) return [];
    const syn = {
      "vanille":"vanill", "vanilla":"vanill", "rose":"ros", "brume":"brum", "mist":"brum",
      "mixte":"unisexe", "cadeau":"coffret", "eau":"parfum", "musque":"musc",
      "florale":"fleur", "floral":"fleur", "promotion":"promo", "nouveaute":"nouveau",
      "sensualite":"sensual"
    };
    return MS.products.filter(p => p.active !== false).filter(p => {
      const hay = MS_UTILS.norm([
        p.nom, p.type, MS_UTILS.catName(p.type), p.audience, p.format, p.desc,
        p.notes.tete, p.notes.coeur, p.notes.fond, (p.keywords || []).join(" "),
        (p.collections || []).map(c => MS_UTILS.collName(c)).join(" "),
        p.promo ? "promo promotion offre" : "", p.nouveau ? "nouveau nouveaute" : ""
      ].join(" "));
      return tokens.every(t => hay.includes(syn[t] || t) || hay.includes(t));
    });
  }
};

/* Échappement HTML (protection XSS de tout contenu dynamique) */
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
