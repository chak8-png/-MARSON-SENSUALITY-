/* ============================================================
   MARSON SENSUALITY — Données de la maison
   ⚠ Tous les éléments marqués [À REMPLACER] sont des exemples
   à valider / remplacer (téléphone, liens, prix, photos…).
   ============================================================ */

const MS = {
  config: {
    brand: "MARSON SENSUALITY",
    sousTitre: "Maison de parfum",
    slogan: "Vivez intensément, sentez différemment.",
    // [À REMPLACER] numéro WhatsApp Business (format international, sans + ni espaces)
    whatsapp: "2250102030405",
    whatsappMessage: "Bonjour MARSON SENSUALITY, je souhaiterais avoir des informations concernant un parfum.",
    // [À REMPLACER] coordonnées réelles
    email: "contact@marson-sensuality.com",
    telephone: "+225 01 02 03 04 05",
    adresse: "Abidjan, Côte d'Ivoire",
    horaires: "Lundi – Samedi · 8h00 – 18h00",
    instagram: "https://www.instagram.com/",   // [À REMPLACER]
    facebook: "https://www.facebook.com/",     // [À REMPLACER]
    tiktok: "https://www.tiktok.com/",         // [À REMPLACER]
    // [À REMPLACER] ID de pixel Meta/Facebook (ex : "123456789012345") — vide = pixel désactivé
    facebookPixelId: "",
    livraison: {
      abidjan: 1500,      // [À CONFIRMER] frais indicatifs
      interieur: 3000,    // [À CONFIRMER]
      delai: "3 jours"
    },
    promoCodes: {          // codes de démonstration
      "MARSON10": 0.10,
      "SENSUALITE15": 0.15
    }
  },

  // Barre d'annonce dynamique (option D — défilement doux)
  announcements: [
    "Livraison disponible à Abidjan et partout en Côte d'Ivoire",
    "Découvrez nos nouveautés",
    "Paiement Mobile Money, carte ou à la livraison",
    "Profitez de nos offres du moment"
  ],

  categories: [
    { id: "parfums",  nom: "Parfums",  img: "assets/img/cat-parfums.webp", phrase: "Eaux de parfum signatures" },
    { id: "brumes",   nom: "Brumes",   img: "assets/img/cat-brumes.webp",  phrase: "Voiles parfumés délicats" },
    { id: "coffrets", nom: "Coffrets", img: "assets/img/cat-coffrets.webp",phrase: "Attentions prêtes à offrir" }
  ],

  collections: [
    { id: "sensuality", nom: "Collection Sensuality", img: "assets/img/univers.webp",
      phrase: "Fragrances sensuelles et envoûtantes, comme une présence qui ne s'oublie pas." },
    { id: "elegance", nom: "Collection Élégance", img: "assets/img/cat-parfums.webp",
      phrase: "Fragrances raffinées et sophistiquées, pour une allure intemporelle." },
    { id: "intense", nom: "Collection Intense", img: "assets/img/p-ambre.webp",
      phrase: "Fragrances profondes et puissantes, aux sillages inoubliables." },
    { id: "signature", nom: "Collection Signature", img: "assets/img/coll-signature.webp",
      phrase: "Les parfums emblématiques de la maison, essentiels et évidents." }
  ],

  // Catalogue de démonstration — à remplacer par les produits réels
  products: [
    {
      id: "vanille-sensuality", nom: "Marson Vanille Sensuality",
      type: "parfums", audience: "femme", format: "Eau de parfum · 50 ml",
      prix: 22000, ancienPrix: null, nouveau: true, promo: false,
      img: "assets/img/p-vanille.webp",
      desc: "Une caresse de vanille bourbon réchauffée d'ambre et de bois de santal. Un sillage doux, enveloppant, intimement sensuel — comme une confidence déposée sur la peau.",
      notes: { tete: "Bergamote, fleur de vanillier", coeur: "Vanille bourbon, héliotrope", fond: "Santal, ambre, musc blanc" },
      keywords: ["vanille", "vanilla", "sucre", "doux", "ambre", "santale", "femme", "parfum femme"],
      collections: ["sensuality", "signature"]
    },
    {
      id: "rose-eclat", nom: "Rose Éclat",
      type: "parfums", audience: "femme", format: "Eau de parfum · 50 ml",
      prix: 18000, ancienPrix: 21000, nouveau: false, promo: true,
      img: "assets/img/p-rose.webp",
      desc: "Une rose fraîche et lumineuse, ourlée de pivoine et de musc blanc. L'éclat d'un matin de femme, entre délicatesse et assurance.",
      notes: { tete: "Rose de mai, pivoine", coeur: "Pétale de rose, lychee", fond: "Musc blanc, cèdre clair" },
      keywords: ["rose", "floral", "fleur", "pivoine", "femme", "parfum femme", "promotion"],
      collections: ["elegance"]
    },
    {
      id: "ambre-nuit", nom: "Ambre Nuit",
      type: "parfums", audience: "unisexe", format: "Eau de parfum · 75 ml",
      prix: 26000, ancienPrix: null, nouveau: false, promo: false,
      img: "assets/img/p-ambre.webp",
      desc: "Un ambre profond, traversé de oud et de benjoin. Une fragrance de soirée, magnétique, qui laisse une empreinte longtemps après le départ.",
      notes: { tete: "Safran, poivre rose", coeur: "Oud, benjoin", fond: "Ambre gris, vanille noire" },
      keywords: ["ambre", "oud", "soir", "intense", "unisexe", "mixte", "boise"],
      collections: ["intense"]
    },
    {
      id: "fleur-de-coton", nom: "Fleur de Coton",
      type: "parfums", audience: "femme", format: "Eau de parfum · 50 ml",
      prix: 19500, ancienPrix: null, nouveau: false, promo: false,
      img: "assets/img/p-coton.webp",
      desc: "Le souvenir d'un lin fraîchement lavé et d'une peau au réveil. Iris poudré, fleur de coton et cèdre doux : la pureté faite sillage.",
      notes: { tete: "Fleur de coton, poire", coeur: "Iris poudré, muguet", fond: "Cèdre doux, musc" },
      keywords: ["coton", "poudre", "iris", "propre", "doux", "femme", "parfum femme"],
      collections: ["elegance"]
    },
    {
      id: "eclat-divoire", nom: "Éclat d'Ivoire",
      type: "parfums", audience: "femme", format: "Eau de parfum · 50 ml",
      prix: 24000, ancienPrix: null, nouveau: true, promo: false,
      img: "assets/img/cat-parfums.webp",
      desc: "Un bouquet blanc solaire — jasmin, fleur d'oranger — posé sur un fond de bois crème. L'élégance naturelle, celle qui n'insiste pas.",
      notes: { tete: "Fleur d'oranger, mandarine", coeur: "Jasmin, gardénia", fond: "Bois crème, ambre clair" },
      keywords: ["blanc", "jasmin", "fleur d'oranger", "lumineux", "femme", "parfum femme", "nouveaute"],
      collections: ["signature", "elegance"]
    },
    {
      id: "voile-de-soie", nom: "Voile de Soie",
      type: "brumes", audience: "femme", format: "Brume parfumée · 100 ml",
      prix: 12000, ancienPrix: null, nouveau: true, promo: false,
      img: "assets/img/cat-brumes.webp",
      desc: "Une brume légère comme un voile de soie sur l'épaule. Musc rosé et violette : à vaporiser partout, tout le jour, pour soi d'abord.",
      notes: { tete: "Poire, violette", coeur: "Musc rosé, pivoine", fond: "Cashmeran, ambre clair" },
      keywords: ["brume", "mist", "voile", "soie", "leger", "rose", "femme", "body mist"],
      collections: ["sensuality"]
    },
    {
      id: "coffret-decouverte", nom: "Coffret Découverte",
      type: "coffrets", audience: "femme", format: "3 vaporisateurs · 15 ml",
      prix: 28000, ancienPrix: null, nouveau: false, promo: false,
      img: "assets/img/cat-coffrets.webp",
      desc: "Trois signatures de la maison en format voyage, présentées dans un écrin ivoire noué de satin. L'attention parfaite, à offrir ou à s'offrir.",
      notes: { tete: "Vanille Sensuality", coeur: "Rose Éclat", fond: "Éclat d'Ivoire" },
      keywords: ["coffret", "cadeau", "coffret cadeau", "decouverte", "voyage", "offrir"],
      collections: ["signature"]
    },
    {
      id: "coffret-signature", nom: "Coffret Signature",
      type: "coffrets", audience: "unisexe", format: "Trio d'eaux de parfum · 30 ml",
      prix: 45000, ancienPrix: 52000, nouveau: false, promo: true,
      img: "assets/img/coll-signature.webp",
      desc: "Le trio emblématique de MARSON SENSUALITY réuni sur un plateau de marbre crème : trois caractères, une même signature.",
      notes: { tete: "Vanille Sensuality", coeur: "Ambre Nuit", fond: "Éclat d'Ivoire" },
      keywords: ["coffret", "cadeau", "trio", "signature", "offrir", "unisexe"],
      collections: ["signature", "intense"]
    }
  ],

  advantages: [
    { icone: "drop",   titre: "Sélection de fragrances", texte: "Des compositions exigeantes, pensées comme des signatures plutôt que comme des tendances." },
    { icone: "box",    titre: "Livraison en Côte d'Ivoire", texte: "Abidjan et toutes les villes du pays, sous 3 jours, en point de rendez-vous ou par coursier." },
    { icone: "heart",  titre: "Service attentionné", texte: "Une écoute vraie sur WhatsApp, du lundi au samedi, pour vous guider dans vos choix." },
    { icone: "card",   titre: "Paiement au choix", texte: "Mobile Money, carte bancaire ou paiement à la livraison — comme vous préférez." }
  ],

  phrases: {
    marque: "Une fragrance ne se porte pas seulement. Elle se ressent.",
    collection: "Chaque fragrance raconte une histoire.",
    sensualite: "La sensualité, dans chaque sillage.",
    univers: "Un parfum ne se contente pas de vous accompagner. Il laisse une empreinte."
  }
};

/* ============================================================
   COUCHE D'ADMINISTRATION — MS_DATA
   Les modifications faites dans le dashboard (admin.html) sont
   stockées localement et fusionnées ici au chargement du site.
   ============================================================ */
const BASE_PRODUCTS = MS.products.map(p => Object.assign({}, p));
const BASE_CATEGORIES = MS.categories.map(c => Object.assign({}, c));
const BASE_COLLECTIONS = MS.collections.map(c => Object.assign({}, c));
const DEFAULT_FEATURED = ["vanille-sensuality", "rose-eclat", "ambre-nuit", "voile-de-soie"];

const MS_DATA = {
  _ls(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  _set(k, v){ localStorage.setItem(k, JSON.stringify(v)); },

  _merge(base, prefix){
    const edits = this._ls(prefix + "_edit", {});
    const extra = this._ls(prefix + "_extra", []);
    const del   = this._ls(prefix + "_deleted", []);
    let list = base.map(x => edits[x.id] ? Object.assign({}, x, edits[x.id]) : x);
    list = list.filter(x => !del.includes(x.id));
    return list.concat(extra.filter(x => !del.includes(x.id)));
  },

  refresh(){
    MS.products    = this._merge(BASE_PRODUCTS, "ms_products");
    MS.categories  = this._merge(BASE_CATEGORIES, "ms_categories");
    MS.collections = this._merge(BASE_COLLECTIONS, "ms_collections");

    Object.assign(MS.config, this._ls("ms_config", {}));
    const ann = this._ls("ms_announcements", null); if(ann) MS.announcements = ann;
    Object.assign(MS.phrases, this._ls("ms_phrases", {}));

    MS.featured = this._ls("ms_featured", DEFAULT_FEATURED).filter(id => MS.products.some(p => p.id === id));
    if(!MS.featured.length) MS.featured = DEFAULT_FEATURED.filter(id => MS.products.some(p => p.id === id));
    MS.featuredCollection = MS.config.featuredCollection || "signature";
  },

  /* ---- produits ---- */
  saveProduct(p){
    const edits = this._ls("ms_products_edit", {});
    let extra   = this._ls("ms_products_extra", []);
    let del     = this._ls("ms_products_deleted", []);
    del = del.filter(id => id !== p.id);
    if(BASE_PRODUCTS.some(b => b.id === p.id)) edits[p.id] = p;
    else { extra = extra.filter(x => x.id !== p.id); extra.push(p); }
    this._set("ms_products_edit", edits);
    this._set("ms_products_extra", extra);
    this._set("ms_products_deleted", del);
    this.refresh();
  },
  deleteProduct(id){
    let extra = this._ls("ms_products_extra", []);
    let del   = this._ls("ms_products_deleted", []);
    if(extra.some(x => x.id === id)) extra = extra.filter(x => x.id !== id);
    else if(!del.includes(id)) del.push(id);
    this._set("ms_products_extra", extra);
    this._set("ms_products_deleted", del);
    this.refresh();
  },

  /* ---- catégories & collections ---- */
  saveCategory(c){ this._saveGeneric(c, BASE_CATEGORIES, "ms_categories"); this.refresh(); },
  deleteCategory(id){ this._delGeneric(id, "ms_categories"); this.refresh(); },
  saveCollection(c){ this._saveGeneric(c, BASE_COLLECTIONS, "ms_collections"); this.refresh(); },
  deleteCollection(id){ this._delGeneric(id, "ms_collections"); this.refresh(); },
  _saveGeneric(item, base, prefix){
    const edits = this._ls(prefix + "_edit", {});
    let extra   = this._ls(prefix + "_extra", []);
    let del     = this._ls(prefix + "_deleted", []);
    del = del.filter(x => x !== item.id);
    if(base.some(b => b.id === item.id)) edits[item.id] = item;
    else { extra = extra.filter(x => x.id !== item.id); extra.push(item); }
    this._set(prefix + "_edit", edits);
    this._set(prefix + "_extra", extra);
    this._set(prefix + "_deleted", del);
  },
  _delGeneric(id, prefix){
    let extra = this._ls(prefix + "_extra", []);
    let del   = this._ls(prefix + "_deleted", []);
    if(extra.some(x => x.id === id)) extra = extra.filter(x => x.id !== id);
    else if(!del.includes(id)) del.push(id);
    this._set(prefix + "_extra", extra);
    this._set(prefix + "_deleted", del);
  },

  /* ---- mise en avant ---- */
  saveFeatured(ids){ this._set("ms_featured", ids); this.refresh(); },

  /* ---- promotions : taux + validité ---- */
  promoInfo(code){
    const v = (MS.config.promoCodes || {})[code];
    if(v == null) return null;
    const rate  = typeof v === "number" ? v : v.rate;
    const debut = typeof v === "object" ? v.debut : "";
    const fin   = typeof v === "object" ? v.fin : "";
    const today = new Date().toISOString().slice(0,10);
    const valid = (!debut || today >= debut) && (!fin || today <= fin);
    return {rate, debut, fin, valid};
  },

  saveConfig(o){
    const cur = this._ls("ms_config", {});
    this._set("ms_config", Object.assign(cur, o));
    this.refresh();
  },
  saveAnnouncements(list){ this._set("ms_announcements", list); this.refresh(); },
  savePhrases(o){
    const cur = this._ls("ms_phrases", {});
    this._set("ms_phrases", Object.assign(cur, o));
    this.refresh();
  },

  orders(){ return this._ls("ms_orders", []); },
  saveOrders(list){ this._set("ms_orders", list); }
};

MS_DATA.refresh();

/* ---------- Utilitaires partagés ---------- */
const MS_UTILS = {
  fmt(n){ return n.toLocaleString("fr-FR").replace(/\u202f|\u00a0/g," ") + " FCFA"; },
  norm(s){ return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); },
  byId(id){ return MS.products.find(p => p.id === id); },
  collName(id){ const c = MS.collections.find(c => c.id === id); return c ? c.nom : ""; },
  catName(id){
    const c = MS.categories.find(c => c.id === id);
    return c ? c.nom.replace(/s\s*$/,"") : id;
  },
  waLink(){
    return "https://wa.me/" + MS.config.whatsapp + "?text=" + encodeURIComponent(MS.config.whatsappMessage);
  },
  // Recherche intelligente : insensible aux accents, synonymes, mots partiels
  search(q){
    const nq = MS_UTILS.norm(q).trim();
    if(!nq) return [];
    const tokens = nq.split(/\s+/).filter(t => t.length > 1);
    if(!tokens.length) return [];
    const syn = {
      "vanille":"vanill", "vanilla":"vanill", "rose":"ros", "brume":"brum", "mist":"brum",
      "femme":"femme", "homme":"homme", "unisexe":"unisexe", "mixte":"unisexe",
      "coffret":"coffret", "cadeau":"coffret", "parfum":"parfum", "eau":"parfum",
      "musque":"musc", "musc":"musc", "ambre":"ambr", "coton":"coton", "soie":"soie",
      "fleur":"fleur", "florale":"fleur", "floral":"fleur", "promo":"promo", "promotion":"promo",
      "nouveau":"nouveau", "nouveaute":"nouveau", "sensuel":"sensual", "sensualite":"sensual"
    };
    return MS.products.filter(p => p.active !== false).filter(p => {
      const hay = MS_UTILS.norm([
        p.nom, p.type, MS_UTILS.catName(p.type), p.audience, p.format, p.desc,
        p.notes.tete, p.notes.coeur, p.notes.fond,
        p.keywords.join(" "),
        p.collections.map(c => MS_UTILS.collName(c)).join(" "),
        p.promo ? "promo promotion offre" : "",
        p.nouveau ? "nouveau nouveaute" : ""
      ].join(" "));
      return tokens.every(t => {
        const st = syn[t] || t;
        return hay.includes(st) || hay.includes(t);
      });
    });
  }
};
