/* ============================================================
   MARSON SENSUALITY — Dashboard administrateur (v2)
   Produits (stock, activation, photos), catégories, collections,
   commandes, promotions avec validité, contenu, mise en avant,
   comptabilité, sécurité, sauvegardes.
   ============================================================ */
(function(){
"use strict";
const $  = (s,c)=> (c||document).querySelector(s);
const $$ = (s,c)=> Array.from((c||document).querySelectorAll(s));
const ls = { get(k,d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
             set(k,v){ localStorage.setItem(k, JSON.stringify(v)); },
             raw(k){ return localStorage.getItem(k); } };
const fmt = MS_UTILS.fmt;
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const DEFAULT_PWD = "marson2026";
const SESSION_H = 12;           // expiration de session admin (heures)
const MAX_TRIES = 5;            // tentatives de connexion
const LOCK_MIN = 5;             // durée du verrouillage (minutes)

const IC = {
  home:'<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9h-5v-6h-6v6H4v-9z"/></svg>',
  bottle:'<svg viewBox="0 0 24 24"><path d="M10 3h4v3l2 3v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3V3z"/></svg>',
  layers:'<svg viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
  tag:'<svg viewBox="0 0 24 24"><path d="M3 12l9-9h9v9l-9 9-9-9z"/><circle cx="16.5" cy="7.5" r="1.5"/></svg>',
  bag:'<svg viewBox="0 0 24 24"><path d="M6 8h12l1 13H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  chart:'<svg viewBox="0 0 24 24"><path d="M5 20v-6M11 20V6M17 20v-9M3 20h18"/></svg>',
  gear:'<svg viewBox="0 0 24 24"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>'
};
const NAV = [
  ["home","Vue d'ensemble","home"],
  ["products","Produits & photos","bottle"],
  ["catcoll","Catégories & collections","layers"],
  ["promos","Promotions","tag"],
  ["orders","Commandes","bag"],
  ["accounting","Comptabilité","chart"],
  ["settings","Contenus & réglages","gear"]
];
let current = "home";

/* ---------- Sécurité ---------- */
async function hashPwd(p){
  try{
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(p + "::ms-salt"));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
  }catch(e){
    let h = 5381; for(const ch of p) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
    return "fnv" + h.toString(16);
  }
}
async function adminHashOk(input){
  const stored = ls.raw("ms_admin_pwd_hash");
  if(stored) return (await hashPwd(input)) === stored;
  const legacy = ls.raw("ms_admin_pwd") || DEFAULT_PWD;   // migration douce
  if(input === legacy){ ls.set("ms_admin_pwd_hash", await hashPwd(legacy)); localStorage.removeItem("ms_admin_pwd"); return true; }
  return false;
}
function lockState(){
  const l = ls.get("ms_admin_lock", {n:0, t:0});
  if(l.n >= MAX_TRIES && Date.now() - l.t < LOCK_MIN * 60000) return Math.ceil((LOCK_MIN * 60000 - (Date.now() - l.t)) / 60000);
  return 0;
}

/* ---------- Toast / images / CSV ---------- */
let tt;
function toast(msg){
  let t = $("#adm-toast");
  if(!t){ t = document.createElement("div"); t.id = "adm-toast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(tt); tt = setTimeout(()=> t.classList.remove("show"), 2600);
}
function readImage(file, cb){
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = ()=>{
    const max = 1000; let w = img.width, h = img.height;
    if(w > max){ h = Math.round(h * max / w); w = max; }
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    c.getContext("2d").drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    cb(c.toDataURL("image/webp", .82));
  };
  img.onerror = ()=> toast("Image illisible — essayez JPG ou PNG");
  img.src = url;
}
const slug = s => MS_UTILS.norm(s).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "element";
const monthKey = o => o.mois || ((d)=>{ const p = (d||"").split("/"); return p.length === 3 ? p[2]+"-"+p[1] : ""; })(o.date);
const validOrders = ()=> MS_DATA.orders().filter(o => o.statut !== "Annulée");
function dlCSV(name, rows){
  const csv = "\uFEFF" + rows.map(r => r.map(c => `"${String(c == null ? "" : c).replace(/"/g,'""')}"`).join(";")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8"}));
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
  toast("Téléchargement lancé : " + name);
}

/* ---------- Navigation ---------- */
function renderNav(){
  $("#adm-nav").innerHTML = NAV.map(([id,label,ic]) =>
    `<button data-p="${id}" class="${id === current ? "on" : ""}">${IC[ic]}${label}</button>`).join("");
  $$("#adm-nav button").forEach(b => b.addEventListener("click", ()=> show(b.dataset.p)));
}
function show(panel, opts){
  current = panel; renderNav();
  ({home:renderHome, products:renderProducts, catcoll:renderCatColl, promos:renderPromos,
    orders:renderOrders, accounting:renderAccounting, settings:renderSettings}[panel] || renderHome)(opts);
  window.scrollTo(0,0);
}

/* ============================================================ VUE D'ENSEMBLE */
function renderHome(){
  const vo = validOrders(), all = MS_DATA.orders();
  const now = new Date().toISOString().slice(0,7);
  const ca = vo.reduce((s,o)=> s + o.total, 0);
  const caMois = vo.filter(o => monthKey(o) === now).reduce((s,o)=> s + o.total, 0);
  const lowStock = MS.products.filter(p => typeof p.stock === "number" && p.stock <= 3);
  $("#admin-main").innerHTML = `
    <div class="adm-head">
      <h1>Bonjour, <em>prêt(e) à créer ?</em></h1>
      <p class="adm-guide">Tout se gère ici : produits, photos, stock, promotions, commandes, comptabilité et textes du site. Aucune connaissance technique nécessaire.</p>
    </div>
    <div class="adm-stats">
      <div class="adm-stat"><span>Chiffre d'affaires</span><b>${fmt(ca)}</b><small>commandes valides</small></div>
      <div class="adm-stat"><span>Ce mois-ci</span><b>${fmt(caMois)}</b><small>${new Date().toLocaleDateString("fr-FR",{month:"long", year:"numeric"})}</small></div>
      <div class="adm-stat"><span>Commandes</span><b>${all.length}</b><small>${all.filter(o=>o.statut==="En préparation").length} en préparation</small></div>
      <div class="adm-stat"><span>Produits en ligne</span><b>${MS.products.filter(p=>p.active!==false).length}</b><small>${MS.products.filter(p=>p.active===false).length} désactivé(s)</small></div>
    </div>
    ${lowStock.length ? `<div class="adm-card" style="border-color:var(--gold)"><h2>Stock <em>à surveiller</em></h2><p class="sub">${lowStock.map(p=>esc(p.nom)+" ("+p.stock+")").join(" · ")}</p></div>` : ""}
    <div class="adm-quick">
      <button id="q-add">+ Ajouter un produit</button>
      <button id="q-promo">Créer une promotion</button>
      <button id="q-compta">Ouvrir la comptabilité</button>
    </div>
    <div class="adm-card">
      <h2>Dernières <em>commandes</em></h2>
      <p class="sub">Les 5 commandes les plus récentes du site.</p>
      ${all.length ? `<div style="overflow-x:auto"><table class="adm-table"><thead><tr><th>Réf.</th><th>Date</th><th>Cliente / client</th><th>Total</th><th>Statut</th></tr></thead><tbody>
        ${all.slice(-5).reverse().map(o=>`<tr><td>${o.ref}</td><td>${o.date}</td><td>${esc(o.client)}</td><td>${fmt(o.total)}</td><td><span class="adm-badge ${o.statut==="Livrée"?"gold":""}">${o.statut}</span></td></tr>`).join("")}
      </tbody></table></div>` : `<p class="adm-empty">Aucune commande pour le moment — elles apparaîtront ici automatiquement.</p>`}
    </div>
    <div class="adm-card">
      <h2>Comment ça <em>marche ?</em></h2>
      <p class="sub">Trois gestes suffisent pour faire vivre votre boutique.</p>
      <p style="font-size:14px;color:var(--brown-2);margin-bottom:10px"><b style="font-weight:400;color:var(--gold)">1.</b> « Produits & photos » : touchez « + Ajouter un produit », choisissez une photo depuis votre téléphone, écrivez le nom et le prix : c'est en ligne.</p>
      <p style="font-size:14px;color:var(--brown-2);margin-bottom:10px"><b style="font-weight:400;color:var(--gold)">2.</b> « Promotions » : créez un code avec dates de validité (ex. FETE20 = −20 %) ou cochez un produit en promotion avec prix barré.</p>
      <p style="font-size:14px;color:var(--brown-2)"><b style="font-weight:400;color:var(--gold)">3.</b> « Comptabilité » : suivez vos revenus par mois et téléchargez le CSV pour votre comptable.</p>
    </div>`;
  $("#q-add").addEventListener("click", ()=> show("products", {new:true}));
  $("#q-promo").addEventListener("click", ()=> show("promos"));
  $("#q-compta").addEventListener("click", ()=> show("accounting"));
}

/* ============================================================ PRODUITS */
function renderProducts(opts){
  $("#admin-main").innerHTML = `
    <div class="adm-head">
      <h1>Produits & <em>photos</em></h1>
      <p class="adm-guide">Créez, modifiez, activez ou retirez vos parfums. Le stock se met à jour automatiquement à chaque commande.</p>
    </div>
    <div class="adm-card">
      <div style="display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;align-items:center;margin-bottom:20px">
        <input id="p-search" placeholder="Rechercher un produit…" style="border:1px solid var(--line);background:var(--white);padding:11px 16px;font-size:13px;outline:none;min-width:220px">
        <button class="btn" id="p-new">+ Ajouter un produit</button>
      </div>
      <div id="p-list" style="overflow-x:auto"></div>
    </div>
    <div id="p-form"></div>`;

  function drawList(){
    const q = MS_UTILS.norm($("#p-search").value || "");
    const list = MS.products.filter(p => !q || MS_UTILS.norm(p.nom + " " + p.type).includes(q));
    $("#p-list").innerHTML = list.length ? `
      <table class="adm-table"><thead><tr><th>Photo</th><th>Produit</th><th>Catégorie</th><th>Prix</th><th>Stock</th><th>État</th><th></th></tr></thead><tbody>
      ${list.map(p=>`<tr>
        <td><img src="${p.img}" alt=""></td>
        <td><b style="font-weight:400;font-family:var(--serif);font-size:16px">${esc(p.nom)}</b><br>
          ${p.nouveau ? '<span class="adm-badge rose">Nouveau</span>' : ""}${p.promo ? '<span class="adm-badge gold">Promo</span>' : ""}</td>
        <td>${esc(MS_UTILS.catName(p.type))}</td>
        <td>${p.ancienPrix ? `<s style="color:var(--muted)">${fmt(p.ancienPrix)}</s> ` : ""}${fmt(p.prix)}</td>
        <td>${typeof p.stock === "number" ? (p.stock === 0 ? '<span style="color:#A05a50">Rupture</span>' : p.stock) : '<span style="color:var(--muted)">non suivi</span>'}</td>
        <td>${p.active === false ? '<span class="adm-badge">Désactivé</span>' : '<span class="adm-badge gold">En ligne</span>'}</td>
        <td><div class="adm-row-actions">
          <button class="btn btn-outline btn-sm" data-toggle="${p.id}">${p.active === false ? "Activer" : "Désactiver"}</button>
          <button class="btn btn-outline btn-sm" data-edit="${p.id}">Modifier</button>
          <button class="btn btn-outline btn-sm" data-del="${p.id}" style="border-color:var(--rose);color:#A05a50">Supprimer</button>
        </div></td></tr>`).join("")}
      </tbody></table>` : `<p class="adm-empty">Aucun produit ne correspond.</p>`;

    $$("[data-edit]").forEach(b => b.addEventListener("click", ()=> openForm(MS_UTILS.byId(b.dataset.edit))));
    $$("[data-toggle]").forEach(b => b.addEventListener("click", ()=>{
      const p = MS_UTILS.byId(b.dataset.toggle);
      MS_DATA.saveProduct(Object.assign({}, p, {active: p.active === false}));
      toast(p.active === false ? p.nom + " remis en ligne" : p.nom + " désactivé (masqué du site)");
      drawList();
    }));
    $$("[data-del]").forEach(b => b.addEventListener("click", ()=>{
      const p = MS_UTILS.byId(b.dataset.del);
      if(confirm(`Supprimer « ${p.nom} » de la boutique ?`)){ MS_DATA.deleteProduct(p.id); toast("Produit supprimé"); drawList(); }
    }));
  }
  $("#p-search").addEventListener("input", drawList);
  $("#p-new").addEventListener("click", ()=> openForm(null));
  drawList();
  if(opts && opts.new) openForm(null);

  function openForm(p){
    const isNew = !p;
    const d = p || { nom:"", type: MS.categories[0] ? MS.categories[0].id : "parfums", audience:"femme", format:"Eau de parfum · 50 ml",
      prix:"", ancienPrix:null, nouveau:false, promo:false, img:"", img2:"", stock:"", active:true,
      desc:"", notes:{tete:"",coeur:"",fond:""}, keywords:[], collections:[] };
    let img = d.img || "", img2 = d.img2 || "";
    $("#p-form").innerHTML = `
    <div class="adm-card" id="p-form-card">
      <h2>${isNew ? "Nouveau <em>produit</em>" : "Modifier <em>" + esc(d.nom) + "</em>"}</h2>
      <p class="sub">Les champs marqués ✦ sont essentiels ; le reste peut être complété plus tard.</p>
      <div class="adm-form-grid">
        <div>
          <div class="upload-zone" id="f-zone">
            ${img ? `<img src="${img}" alt=""><p>Photo principale ✨ — touchez pour changer</p>` : `<p>✦ Photo principale</p><small>Touchez pour choisir depuis votre téléphone ou ordinateur</small>`}
          </div>
          <input type="file" id="f-file" accept="image/*" hidden>
        </div>
        <div>
          <div class="upload-zone" id="f-zone2">
            ${img2 ? `<img src="${img2}" alt=""><p>Photo de mise en scène — touchez pour changer</p>` : `<p>Photo de mise en scène (optionnelle)</p><small>Flacon accompagné de tissu, fleurs, bijou…</small>`}
          </div>
          <input type="file" id="f-file2" accept="image/*" hidden>
        </div>
        <div class="field"><label>✦ Nom du produit</label><input id="f-nom" value="${esc(d.nom)}" placeholder="Ex. : Vanille Sensuality"></div>
        <div class="field"><label>✦ Prix (FCFA)</label><input id="f-prix" inputmode="numeric" value="${d.prix === "" ? "" : d.prix}" placeholder="Ex. : 22000"></div>
        <div class="field"><label>Catégorie</label><select id="f-cat">
          ${MS.categories.map(c=>`<option value="${c.id}" ${d.type===c.id?"selected":""}>${esc(c.nom)}</option>`).join("")}
        </select></div>
        <div class="field"><label>Pour qui</label><select id="f-aud">
          <option value="femme" ${d.audience==="femme"?"selected":""}>Femme</option>
          <option value="unisexe" ${d.audience==="unisexe"?"selected":""}>Unisexe</option>
          <option value="enfant" ${d.audience==="enfant"?"selected":""}>Enfant</option>
        </select></div>
        <div class="field"><label>Format</label><input id="f-format" value="${esc(d.format)}" placeholder="Ex. : Eau de parfum · 50 ml"></div>
        <div class="field"><label>Stock (quantité)</label><input id="f-stock" inputmode="numeric" value="${d.stock == null ? "" : d.stock}" placeholder="Vide = stock non suivi"></div>
        <div class="field"><label>Ancien prix (barré)</label><input id="f-ancien" inputmode="numeric" value="${d.ancienPrix || ""}" placeholder="Laisser vide si aucun"></div>
        <div class="field"><label>Visibilité</label>
          <label class="adm-check"><input type="checkbox" id="f-active" ${d.active === false ? "" : "checked"}> Produit en ligne (décocher = masqué du site)</label>
          <label class="adm-check"><input type="checkbox" id="f-nouveau" ${d.nouveau?"checked":""}> Étiquette « Nouveau »</label>
          <label class="adm-check"><input type="checkbox" id="f-promo" ${d.promo?"checked":""}> Étiquette « Promotion »</label>
        </div>
        <div class="field full"><label>Description (l'émotion à transmettre)</label><textarea id="f-desc">${esc(d.desc)}</textarea></div>
        <div class="field"><label>Notes de tête</label><input id="f-tete" value="${esc(d.notes.tete)}"></div>
        <div class="field"><label>Notes de cœur</label><input id="f-coeur" value="${esc(d.notes.coeur)}"></div>
        <div class="field"><label>Notes de fond</label><input id="f-fond" value="${esc(d.notes.fond)}"></div>
        <div class="field"><label>Mots-clés de recherche</label><input id="f-key" value="${esc((d.keywords||[]).join(", "))}" placeholder="vanille, doux, soirée (virgules)"></div>
        <div class="field full"><label>Collections</label>
          <div class="adm-coll-checks">
            ${MS.collections.map(c=>`<label class="adm-check"><input type="checkbox" class="f-coll" value="${c.id}" ${(d.collections||[]).includes(c.id)?"checked":""}> ${esc(c.nom)}</label>`).join("")}
          </div>
        </div>
      </div>
      <div class="adm-actions">
        <button class="btn" id="f-save">Enregistrer le produit</button>
        <button class="btn btn-outline" id="f-cancel">Annuler</button>
      </div>
    </div>`;
    const wireZone = (zone, file, set) => {
      $(zone).addEventListener("click", ()=> $(file).click());
      $(file).addEventListener("change", e=>{
        const f = e.target.files[0]; if(!f) return;
        readImage(f, data => { set(data); toast("Photo chargée ✨"); $(zone).innerHTML = `<img src="${data}" alt=""><p>Photo choisie — touchez pour changer</p>`; });
      });
    };
    wireZone("#f-zone", "#f-file", v => img = v);
    wireZone("#f-zone2", "#f-file2", v => img2 = v);
    $("#f-cancel").addEventListener("click", ()=>{ $("#p-form").innerHTML = ""; });
    $("#f-save").addEventListener("click", ()=>{
      const nom = $("#f-nom").value.trim();
      const prix = parseInt(($("#f-prix").value || "").replace(/\s/g,""), 10);
      if(!nom){ toast("Donnez un nom au produit"); $("#f-nom").focus(); return; }
      if(!prix || prix <= 0){ toast("Indiquez un prix valide"); $("#f-prix").focus(); return; }
      if(!img){ toast("Ajoutez une photo du produit"); return; }
      const ancien = parseInt(($("#f-ancien").value || "").replace(/\s/g,""), 10);
      const stockRaw = ($("#f-stock").value || "").replace(/\s/g,"");
      let id = d.id;
      if(isNew){ id = slug(nom); let i = 2; while(MS_UTILS.byId(id)) id = slug(nom) + "-" + i++; }
      MS_DATA.saveProduct({
        id, nom, type: $("#f-cat").value, audience: $("#f-aud").value,
        format: $("#f-format").value.trim() || "—",
        prix, ancienPrix: ancien > 0 ? ancien : null,
        stock: stockRaw === "" ? null : Math.max(0, parseInt(stockRaw, 10) || 0),
        active: $("#f-active").checked,
        nouveau: $("#f-nouveau").checked, promo: $("#f-promo").checked,
        img, img2: img2 || null, desc: $("#f-desc").value.trim(),
        notes: { tete: $("#f-tete").value.trim(), coeur: $("#f-coeur").value.trim(), fond: $("#f-fond").value.trim() },
        keywords: $("#f-key").value.split(",").map(s=>s.trim()).filter(Boolean),
        collections: $$(".f-coll").filter(c=>c.checked).map(c=>c.value)
      });
      toast(isNew ? "Produit ajouté à la boutique ✨" : "Produit mis à jour");
      $("#p-form").innerHTML = ""; drawList();
    });
    $("#p-form-card").scrollIntoView({behavior:"smooth", block:"start"});
  }
}

/* ============================================================ CATÉGORIES & COLLECTIONS */
function renderCatColl(){
  $("#admin-main").innerHTML = `
    <div class="adm-head">
      <h1>Catégories & <em>collections</em></h1>
      <p class="adm-guide">Les catégories rangent la boutique (Parfums, Brumes…). Les collections racontent des univers (Sensuality, Signature…). Les deux se créent et se modifient ici.</p>
    </div>
    <div class="adm-card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:18px">
        <h2 style="margin:0">Catégories</h2><button class="btn btn-sm" id="cat-new">+ Nouvelle catégorie</button>
      </div>
      <div id="cat-list" style="overflow-x:auto"></div>
      <div id="cat-form"></div>
    </div>
    <div class="adm-card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:18px">
        <h2 style="margin:0">Collections</h2><button class="btn btn-sm" id="coll-new">+ Nouvelle collection</button>
      </div>
      <div id="coll-list" style="overflow-x:auto"></div>
      <div id="coll-form"></div>
    </div>`;

  function drawCats(){
    $("#cat-list").innerHTML = `<table class="adm-table"><thead><tr><th>Catégorie</th><th>Phrase</th><th>Produits</th><th></th></tr></thead><tbody>
      ${MS.categories.map(c=>`<tr><td><b style="font-weight:400;font-family:var(--serif);font-size:16px">${esc(c.nom)}</b></td>
        <td>${esc(c.phrase)}</td><td>${MS.products.filter(p=>p.type===c.id).length}</td>
        <td><div class="adm-row-actions">
          <button class="btn btn-outline btn-sm" data-cedit="${c.id}">Modifier</button>
          <button class="btn btn-outline btn-sm" data-cdel="${c.id}" style="border-color:var(--rose);color:#A05a50">Supprimer</button>
        </div></td></tr>`).join("")}</tbody></table>`;
    $$("[data-cedit]").forEach(b=> b.addEventListener("click", ()=> catForm(MS.categories.find(c=>c.id===b.dataset.cedit))));
    $$("[data-cdel]").forEach(b=> b.addEventListener("click", ()=>{
      const c = MS.categories.find(x=>x.id===b.dataset.cdel);
      if(MS.products.some(p=>p.type===c.id)){ toast("Impossible : des produits utilisent cette catégorie"); return; }
      if(confirm(`Supprimer la catégorie « ${c.nom} » ?`)){ MS_DATA.deleteCategory(c.id); toast("Catégorie supprimée"); drawCats(); }
    }));
  }
  function catForm(c){
    const isNew = !c; const d = c || {nom:"", phrase:"", img:""}; let img = d.img || "";
    $("#cat-form").innerHTML = `<div class="adm-card" style="margin-top:20px;background:var(--cream)">
      <h2>${isNew ? "Nouvelle catégorie" : "Modifier la catégorie"}</h2>
      <div class="adm-form-grid">
        <div class="field"><label>✦ Nom</label><input id="cat-nom" value="${esc(d.nom)}" placeholder="Ex. : Parfums"></div>
        <div class="field"><label>Phrase courte</label><input id="cat-phrase" value="${esc(d.phrase)}" placeholder="Ex. : Eaux de parfum signatures"></div>
        <div class="field full"><div class="upload-zone" id="cat-zone">${img ? `<img src="${img}" alt="">` : "<p>Image de la catégorie (optionnelle)</p>"}</div><input type="file" id="cat-file" accept="image/*" hidden></div>
      </div>
      <div class="adm-actions"><button class="btn btn-sm" id="cat-save">Enregistrer</button><button class="btn btn-outline btn-sm" id="cat-cancel">Annuler</button></div>
    </div>`;
    $("#cat-zone").addEventListener("click", ()=> $("#cat-file").click());
    $("#cat-file").addEventListener("change", e=>{ const f = e.target.files[0]; if(f) readImage(f, v=>{ img = v; $("#cat-zone").innerHTML = `<img src="${v}" alt="">`; }); });
    $("#cat-cancel").addEventListener("click", ()=> $("#cat-form").innerHTML = "");
    $("#cat-save").addEventListener("click", ()=>{
      const nom = $("#cat-nom").value.trim(); if(!nom){ toast("Nom requis"); return; }
      let id = d.id || slug(nom); let i = 2;
      while(isNew && MS.categories.some(x=>x.id===id)) id = slug(nom) + "-" + i++;
      MS_DATA.saveCategory({id, nom, phrase: $("#cat-phrase").value.trim(), img: img || (MS.categories[0] && MS.categories[0].img) || ""});
      toast("Catégorie enregistrée"); $("#cat-form").innerHTML = ""; drawCats();
    });
  }
  $("#cat-new").addEventListener("click", ()=> catForm(null));

  function drawColls(){
    $("#coll-list").innerHTML = `<table class="adm-table"><thead><tr><th>Collection</th><th>Univers</th><th>Produits</th><th></th></tr></thead><tbody>
      ${MS.collections.map(c=>`<tr><td><b style="font-weight:400;font-family:var(--serif);font-size:16px">${esc(c.nom)}</b></td>
        <td>${esc(c.phrase)}</td><td>${MS.products.filter(p=>(p.collections||[]).includes(c.id)).length}</td>
        <td><div class="adm-row-actions">
          <button class="btn btn-outline btn-sm" data-coll-edit="${c.id}">Modifier</button>
          <button class="btn btn-outline btn-sm" data-coll-del="${c.id}" style="border-color:var(--rose);color:#A05a50">Supprimer</button>
        </div></td></tr>`).join("")}</tbody></table>`;
    $$("[data-coll-edit]").forEach(b=> b.addEventListener("click", ()=> collForm(MS.collections.find(c=>c.id===b.dataset.collEdit))));
    $$("[data-coll-del]").forEach(b=> b.addEventListener("click", ()=>{
      const c = MS.collections.find(x=>x.id===b.dataset.collDel);
      if(confirm(`Supprimer la collection « ${c.nom} » ? Les produits resteront en boutique.`)){
        MS.products.filter(p=>(p.collections||[]).includes(c.id)).forEach(p=>
          MS_DATA.saveProduct(Object.assign({}, p, {collections: p.collections.filter(x=>x!==c.id)})));
        MS_DATA.deleteCollection(c.id); toast("Collection supprimée"); drawColls();
      }
    }));
  }
  function collForm(c){
    const isNew = !c; const d = c || {nom:"", phrase:"", img:""}; let img = d.img || "";
    $("#coll-form").innerHTML = `<div class="adm-card" style="margin-top:20px;background:var(--cream)">
      <h2>${isNew ? "Nouvelle collection" : "Modifier la collection"}</h2>
      <div class="adm-form-grid">
        <div class="field"><label>✦ Nom</label><input id="coll-nom" value="${esc(d.nom)}" placeholder="Ex. : Collection Sensuality"></div>
        <div class="field full"><label>Phrase d'univers</label><input id="coll-phrase" value="${esc(d.phrase)}" placeholder="Ex. : Fragrances sensuelles et envoûtantes…"></div>
        <div class="field full"><div class="upload-zone" id="coll-zone">${img ? `<img src="${img}" alt="">` : "<p>Image d'ambiance de la collection</p>"}</div><input type="file" id="coll-file" accept="image/*" hidden></div>
        <div class="field full"><label>Produits associés</label>
          <div class="adm-coll-checks">${MS.products.map(p=>`<label class="adm-check"><input type="checkbox" class="coll-prod" value="${p.id}" ${(p.collections||[]).includes(d.id||"")?"checked":""}> ${esc(p.nom)}</label>`).join("")}</div>
        </div>
      </div>
      <div class="adm-actions"><button class="btn btn-sm" id="coll-save">Enregistrer</button><button class="btn btn-outline btn-sm" id="coll-cancel">Annuler</button></div>
    </div>`;
    $("#coll-zone").addEventListener("click", ()=> $("#coll-file").click());
    $("#coll-file").addEventListener("change", e=>{ const f = e.target.files[0]; if(f) readImage(f, v=>{ img = v; $("#coll-zone").innerHTML = `<img src="${v}" alt="">`; }); });
    $("#coll-cancel").addEventListener("click", ()=> $("#coll-form").innerHTML = "");
    $("#coll-save").addEventListener("click", ()=>{
      const nom = $("#coll-nom").value.trim(); if(!nom){ toast("Nom requis"); return; }
      let id = d.id || slug(nom); let i = 2;
      while(isNew && MS.collections.some(x=>x.id===id)) id = slug(nom) + "-" + i++;
      MS_DATA.saveCollection({id, nom, phrase: $("#coll-phrase").value.trim(), img: img || d.img || ""});
      const chosen = $$(".coll-prod").filter(x=>x.checked).map(x=>x.value);
      MS.products.forEach(p=>{
        const has = (p.collections||[]).includes(id);
        const want = chosen.includes(p.id);
        if(has !== want){
          const cols = (p.collections||[]).filter(x=>x!==id);
          if(want) cols.push(id);
          MS_DATA.saveProduct(Object.assign({}, p, {collections: cols}));
        }
      });
      toast("Collection enregistrée"); $("#coll-form").innerHTML = ""; drawColls();
    });
  }
  $("#coll-new").addEventListener("click", ()=> collForm(null));
  drawCats(); drawColls();
}

/* ============================================================ PROMOTIONS */
function renderPromos(){
  $("#admin-main").innerHTML = `
    <div class="adm-head">
      <h1>Promotions & <em>codes</em></h1>
      <p class="adm-guide">Un code = une remise en pourcentage, avec dates de validité si vous le souhaitez. Hors période, le code est refusé automatiquement.</p>
    </div>
    <div class="adm-card">
      <h2>Codes <em>promo</em></h2>
      <p class="sub">La cliente saisit ce code dans son panier.</p>
      <div id="code-list"></div>
      <div class="adm-form-grid" style="margin-top:18px">
        <div class="field"><label>Code</label><input id="c-code" placeholder="Ex. : FETE20" style="text-transform:uppercase"></div>
        <div class="field"><label>Remise (%)</label><input id="c-pct" inputmode="numeric" placeholder="20"></div>
        <div class="field"><label>Valide du (optionnel)</label><input id="c-debut" type="date"></div>
        <div class="field"><label>Valide jusqu'au (optionnel)</label><input id="c-fin" type="date"></div>
      </div>
      <button class="btn btn-sm" id="c-add">Créer le code</button>
    </div>
    <div class="adm-card">
      <h2>Produits en <em>promotion</em></h2>
      <p class="sub">Cochez pour l'étiquette « Promotion » ; l'ancien prix s'affiche barré.</p>
      <div id="promo-products" style="overflow-x:auto"></div>
    </div>`;

  function drawCodes(){
    const codes = MS.config.promoCodes || {};
    const keys = Object.keys(codes);
    $("#code-list").innerHTML = keys.length ? keys.map(k=>{
      const i = MS_DATA.promoInfo(k);
      const exp = !i.valid;
      return `<div class="adm-list-input">
        <input value="${k} — ${Math.round(i.rate*100)} %${i.debut ? " · du " + i.debut : ""}${i.fin ? " au " + i.fin : ""}${exp ? "  (hors validité)" : ""}" disabled style="opacity:.8">
        <button data-cdel="${k}" title="Supprimer">✕</button></div>`;
    }).join("") : `<p class="adm-empty">Aucun code pour le moment.</p>`;
    $$("[data-cdel]").forEach(b => b.addEventListener("click", ()=>{
      const c2 = Object.assign({}, MS.config.promoCodes); delete c2[b.dataset.cdel];
      MS_DATA.saveConfig({promoCodes: c2}); toast("Code supprimé"); drawCodes();
    }));
  }
  $("#c-add").addEventListener("click", ()=>{
    const code = ($("#c-code").value || "").trim().toUpperCase().replace(/\s/g,"");
    const pct = parseInt($("#c-pct").value, 10);
    if(!code || !pct || pct < 1 || pct > 90){ toast("Code et pourcentage (1 à 90) requis"); return; }
    const codes = Object.assign({}, MS.config.promoCodes);
    codes[code] = {rate: pct/100, debut: $("#c-debut").value || "", fin: $("#c-fin").value || ""};
    MS_DATA.saveConfig({promoCodes: codes});
    toast("Code " + code + " créé (−" + pct + " %)");
    ["#c-code","#c-pct","#c-debut","#c-fin"].forEach(s=> $(s).value = "");
    drawCodes();
  });

  function drawPP(){
    $("#promo-products").innerHTML = `<table class="adm-table"><thead><tr><th>Produit</th><th>Prix</th><th>En promotion</th><th>Ancien prix barré</th></tr></thead><tbody>
      ${MS.products.map(p=>`<tr>
        <td><b style="font-weight:400;font-family:var(--serif);font-size:15px">${esc(p.nom)}</b></td>
        <td>${fmt(p.prix)}</td>
        <td><label class="adm-check"><input type="checkbox" data-pp="${p.id}" ${p.promo?"checked":""}></label></td>
        <td><input data-pp-old="${p.id}" value="${p.ancienPrix || ""}" inputmode="numeric" placeholder="—" style="border:1px solid var(--line);background:var(--white);padding:8px 12px;font-size:12.5px;width:120px;outline:none"></td>
      </tr>`).join("")}</tbody></table>`;
    $$("[data-pp]").forEach(c => c.addEventListener("change", ()=> saveRow(c.dataset.pp)));
    $$("[data-pp-old]").forEach(i => i.addEventListener("change", ()=> saveRow(i.dataset.ppOld)));
    function saveRow(id){
      const p = MS_UTILS.byId(id);
      const promo = $(`[data-pp="${id}"]`).checked;
      const old = parseInt(($(`[data-pp-old="${id}"]`).value || "").replace(/\s/g,""), 10);
      MS_DATA.saveProduct(Object.assign({}, p, {promo, ancienPrix: old > 0 ? old : null}));
      toast(promo ? "Promotion activée : " + p.nom : "Promotion retirée : " + p.nom);
    }
  }
  drawCodes(); drawPP();
}

/* ============================================================ COMMANDES */
function renderOrders(){
  const all = MS_DATA.orders().slice().reverse();
  $("#admin-main").innerHTML = `
    <div class="adm-head">
      <h1>Commandes & <em>suivi</em></h1>
      <p class="adm-guide">Touchez une ligne pour voir le détail (adresse, articles, note). Changez le statut : la cliente le voit dans son compte.</p>
    </div>
    <div class="adm-card" style="overflow-x:auto">
      ${all.length ? `<table class="adm-table"><thead><tr><th>Réf.</th><th>Date</th><th>Cliente / client</th><th>Total</th><th>Statut</th></tr></thead><tbody>
        ${all.map(o=>`<tr data-row="${o.ref}" style="cursor:pointer">
          <td>${o.ref}</td><td>${o.date}</td>
          <td>${esc(o.client)}<br><small style="color:var(--muted)">${esc(o.email)} · ${esc(o.tel)}</small></td>
          <td>${fmt(o.total)}</td>
          <td><select data-stat="${o.ref}">
            ${["En préparation","Expédiée","Livrée","Annulée"].map(s=>`<option ${o.statut===s?"selected":""}>${s}</option>`).join("")}
          </select></td></tr>
          <tr class="adm-detail" data-detail="${o.ref}" hidden><td colspan="5" style="background:var(--cream)">
            <b style="font-weight:400;letter-spacing:.18em;text-transform:uppercase;font-size:10px;color:var(--gold)">Détail</b>
            <p style="font-size:13px;margin-top:8px">${o.items.map(i=>esc(i.nom)+" — "+fmt(i.prix)+" × "+i.qty).join("<br>")}</p>
            <p style="font-size:12.5px;margin-top:8px;color:var(--muted)">Livraison : ${o.zone === "abidjan" ? "Abidjan" : "Intérieur"} · ${o.mode === "rdv" ? "point de rendez-vous" : "coursier"} · ${esc(o.adresse || "—")}</p>
            <p style="font-size:12.5px;color:var(--muted)">Paiement : ${o.paiement === "mobile" ? "Mobile Money" : o.paiement === "carte" ? "Carte bancaire" : "À la livraison"} · ${o.compte === "client" ? "compte client" : "commande invitée"}</p>
            ${o.note ? `<p style="font-size:12.5px;color:var(--brown-2);font-style:italic">Note : ${esc(o.note)}</p>` : ""}
            <p style="font-size:12.5px;margin-top:6px">Sous-total ${fmt(o.sousTotal)} · remise ${fmt(o.remise||0)} · livraison ${fmt(o.livraison||0)} · <b style="font-weight:400">total ${fmt(o.total)}</b></p>
          </td></tr>`).join("")}
      </tbody></table>` : `<p class="adm-empty">Aucune commande pour le moment.</p>`}
    </div>`;
  $$("[data-stat]").forEach(s => s.addEventListener("change", e=>{
    e.stopPropagation();
    const list = MS_DATA.orders();
    const o = list.find(x => x.ref === s.dataset.stat);
    if(o){ o.statut = s.value; MS_DATA.saveOrders(list); toast(o.ref + " → " + o.statut); }
  }));
  $$("[data-row]").forEach(r => r.addEventListener("click", e=>{
    if(e.target.closest("select")) return;
    const d = $(`[data-detail="${r.dataset.row}"]`);
    d.hidden = !d.hidden;
  }));
}

/* ============================================================ COMPTABILITÉ */
function renderAccounting(){
  const vo = validOrders();
  const ca = vo.reduce((s,o)=> s + o.total, 0);
  const remises = vo.reduce((s,o)=> s + (o.remise || 0), 0);
  const livr = vo.reduce((s,o)=> s + (o.livraison || 0), 0);
  const now = new Date().toISOString().slice(0,7);
  const caMois = vo.filter(o => monthKey(o) === now).reduce((s,o)=> s + o.total, 0);
  const byMonth = {};
  vo.forEach(o => { const k = monthKey(o) || "—"; byMonth[k] = byMonth[k] || {n:0, ca:0}; byMonth[k].n++; byMonth[k].ca += o.total; });
  const months = Object.keys(byMonth).sort().reverse();
  const maxCa = Math.max(1, ...months.map(k => byMonth[k].ca));
  const byProd = {};
  vo.forEach(o => o.items.forEach(i => { byProd[i.nom] = byProd[i.nom] || {q:0, ca:0}; byProd[i.nom].q += i.qty; byProd[i.nom].ca += i.qty * i.prix; }));
  const top = Object.keys(byProd).sort((a,b)=> byProd[b].ca - byProd[a].ca).slice(0,5);
  const maxP = Math.max(1, ...top.map(k => byProd[k].ca));

  $("#admin-main").innerHTML = `
    <div class="adm-head">
      <h1>Comptabilité</h1>
      <p class="adm-guide">Votre tableau de bord financier : encaissements, remises, livraison, mois par mois et meilleurs produits. Export CSV pour votre comptable.</p>
    </div>
    <div class="adm-stats">
      <div class="adm-stat"><span>CA total</span><b>${fmt(ca)}</b><small>hors commandes annulées</small></div>
      <div class="adm-stat"><span>CA ce mois</span><b>${fmt(caMois)}</b><small>${new Date().toLocaleDateString("fr-FR",{month:"long", year:"numeric"})}</small></div>
      <div class="adm-stat"><span>Panier moyen</span><b>${vo.length ? fmt(Math.round(ca/vo.length)) : "—"}</b><small>${vo.length} commande(s) valide(s)</small></div>
      <div class="adm-stat"><span>Remises offertes</span><b>${fmt(remises)}</b><small>livraison perçue : ${fmt(livr)}</small></div>
    </div>
    <div class="adm-actions" style="margin-bottom:28px">
      <button class="btn" id="csv-orders">Télécharger le CSV des commandes</button>
      <button class="btn btn-outline" id="csv-months">Télécharger le résumé mensuel</button>
    </div>
    <div class="adm-card">
      <h2>Mois par <em>mois</em></h2>
      ${months.length ? months.map(k => `
        <div style="padding:10px 0;border-bottom:1px solid var(--line)">
          <div style="display:flex;justify-content:space-between;font-size:13px"><span>${k}</span><span>${fmt(byMonth[k].ca)} · ${byMonth[k].n} cmd</span></div>
          <div class="adm-bar"><i style="width:${Math.round(byMonth[k].ca / maxCa * 100)}%"></i></div>
        </div>`).join("") : `<p class="adm-empty">Pas encore de ventes enregistrées.</p>`}
    </div>
    <div class="adm-card">
      <h2>Meilleurs <em>produits</em></h2>
      ${top.length ? top.map(k => `
        <div style="padding:10px 0;border-bottom:1px solid var(--line)">
          <div style="display:flex;justify-content:space-between;font-size:13px"><span>${esc(k)}</span><span>${fmt(byProd[k].ca)} · ${byProd[k].q} vendu(s)</span></div>
          <div class="adm-bar"><i style="width:${Math.round(byProd[k].ca / maxP * 100)}%"></i></div>
        </div>`).join("") : `<p class="adm-empty">Pas encore de ventes enregistrées.</p>`}
    </div>`;
  $("#csv-orders").addEventListener("click", ()=> dlCSV("marson-commandes.csv", [
    ["Référence","Date","Client","E-mail","Téléphone","Zone","Mode","Paiement","Statut","Sous-total","Remise","Livraison","Total","Articles"],
    ...MS_DATA.orders().map(o => [o.ref, o.date, o.client, o.email, o.tel, o.zone, o.mode, o.paiement, o.statut, o.sousTotal, o.remise, o.livraison, o.total, o.items.map(i=>i.nom+" x"+i.qty).join(" | ")])
  ]));
  $("#csv-months").addEventListener("click", ()=> dlCSV("marson-resume-mensuel.csv", [
    ["Mois","Commandes","Chiffre d'affaires (FCFA)"], ...months.map(k => [k, byMonth[k].n, byMonth[k].ca])
  ]));
}

/* ============================================================ CONTENUS & RÉGLAGES */
function renderSettings(){
  const c = MS.config;
  $("#admin-main").innerHTML = `
    <div class="adm-head">
      <h1>Contenus & <em>réglages</em></h1>
      <p class="adm-guide">Textes du site, produits mis en avant, coordonnées, livraison, pixel Facebook, sauvegardes et sécurité — sans toucher au code.</p>
    </div>

    <div class="adm-card">
      <h2>Produits <em>mis en avant</em></h2>
      <p class="sub">Ceux affichés dans « Les Incontournables » de la page d'accueil (4 recommandés), et la collection mise en avant.</p>
      <div class="adm-coll-checks" id="feat-list">
        ${MS.products.filter(p=>p.active!==false).map(p=>`<label class="adm-check"><input type="checkbox" class="feat-chk" value="${p.id}" ${MS.featured.includes(p.id)?"checked":""}> ${esc(p.nom)}</label>`).join("")}
      </div>
      <div class="field" style="margin-top:16px"><label>Collection mise en avant sur l'accueil</label>
        <select id="feat-coll">${MS.collections.map(x=>`<option value="${x.id}" ${MS.featuredCollection===x.id?"selected":""}>${esc(x.nom)}</option>`).join("")}</select>
      </div>
      <button class="btn btn-sm" id="feat-save">Enregistrer la mise en avant</button>
    </div>

    <div class="adm-card">
      <h2>Barre d'annonce <em>(haut du site)</em></h2>
      <p class="sub">Les messages défilent doucement, l'un après l'autre.</p>
      <div id="ann-list"></div>
      <div class="adm-actions"><button class="btn btn-outline btn-sm" id="ann-add">+ Ajouter un message</button>
      <button class="btn btn-sm" id="ann-save">Enregistrer</button></div>
    </div>

    <div class="adm-card">
      <h2>Slogan & <em>phrases de marque</em></h2>
      <div class="adm-form-grid">
        <div class="field full"><label>Slogan principal (bannière + pied de page)</label><input id="s-slogan" value="${esc(c.slogan)}"></div>
        <div class="field full"><label>Phrase « marque » (section univers)</label><input id="s-marque" value="${esc(MS.phrases.marque)}"></div>
        <div class="field full"><label>Phrase « collections »</label><input id="s-coll" value="${esc(MS.phrases.collection)}"></div>
        <div class="field full"><label>Phrase « sensualité »</label><input id="s-sens" value="${esc(MS.phrases.sensualite)}"></div>
      </div>
      <button class="btn btn-sm" id="s-save">Enregistrer</button>
    </div>

    <div class="adm-card">
      <h2>Coordonnées, réseaux & <em>livraison</em></h2>
      <div class="adm-form-grid">
        <div class="field"><label>Numéro WhatsApp Business</label><input id="k-wa" value="${esc(c.whatsapp)}"></div>
        <div class="field"><label>Téléphone affiché</label><input id="k-tel" value="${esc(c.telephone)}"></div>
        <div class="field"><label>E-mail</label><input id="k-mail" value="${esc(c.email)}"></div>
        <div class="field"><label>Adresse</label><input id="k-adr" value="${esc(c.adresse)}"></div>
        <div class="field"><label>Horaires</label><input id="k-hor" value="${esc(c.horaires)}"></div>
        <div class="field"><label>Délai de livraison</label><input id="l-del" value="${esc(c.livraison.delai)}"></div>
        <div class="field"><label>Livraison Abidjan (FCFA)</label><input id="l-abj" inputmode="numeric" value="${c.livraison.abidjan}"></div>
        <div class="field"><label>Autres villes (FCFA)</label><input id="l-int" inputmode="numeric" value="${c.livraison.interieur}"></div>
        <div class="field"><label>Instagram</label><input id="r-ig" value="${esc(c.instagram)}"></div>
        <div class="field"><label>Facebook</label><input id="r-fb" value="${esc(c.facebook)}"></div>
        <div class="field"><label>TikTok</label><input id="r-tt" value="${esc(c.tiktok)}"></div>
      </div>
      <button class="btn btn-sm" id="k-save">Enregistrer</button>
    </div>

    <div class="adm-card">
      <h2>Pixel <em>Facebook (Meta)</em></h2>
      <p class="sub">Collez l'ID de votre pixel (Meta Events Manager). Événements suivis : page vue, ajout panier, début de commande, achat. Vide = désactivé.</p>
      <div class="field"><label>ID du pixel Meta</label><input id="px-id" value="${esc(c.facebookPixelId || "")}" placeholder="Ex. : 123456789012345"></div>
      <button class="btn btn-sm" id="px-save">Enregistrer</button>
    </div>

    <div class="adm-card">
      <h2>Sauvegardes & <em>sécurité</em></h2>
      <p class="sub">Exportez régulièrement une sauvegarde complète (produits, commandes, réglages) et conservez-la en lieu sûr.</p>
      <div class="adm-actions" style="margin-bottom:20px">
        <button class="btn btn-outline btn-sm" id="bk-export">Télécharger une sauvegarde</button>
        <button class="btn btn-outline btn-sm" id="bk-import-btn">Restaurer une sauvegarde</button>
        <input type="file" id="bk-import" accept="application/json" hidden>
      </div>
      <p style="font-size:13px;color:var(--brown-2)">Mesures actives : mot de passe administrateur et mots de passe clients <b style="font-weight:400">chiffrés (SHA-256)</b>, session administrateur expirant après ${SESSION_H} h, verrouillage après ${MAX_TRIES} tentatives de connexion (${LOCK_MIN} min), validation et échappement des formulaires (protection contre les injections), contrôle d'accès au dashboard, données personnelles non transmises à des tiers. Lors de la mise en ligne, choisissez un hébergement <b style="font-weight:400">HTTPS</b> (Netlify, OVH, Hostinger… le certificat est automatique).</p>
      <div class="adm-form-grid" style="margin-top:20px">
        <div class="field"><label>Mot de passe actuel</label><input id="w-old" type="password"></div>
        <div class="field"><label>Nouveau mot de passe</label><input id="w-new" type="password" minlength="6"></div>
      </div>
      <button class="btn btn-sm" id="w-save">Changer le mot de passe</button>
    </div>`;

  $("#feat-save").addEventListener("click", ()=>{
    const ids = $$(".feat-chk").filter(x=>x.checked).map(x=>x.value);
    if(!ids.length){ toast("Choisissez au moins un produit mis en avant"); return; }
    MS_DATA.saveFeatured(ids);
    MS_DATA.saveConfig({featuredCollection: $("#feat-coll").value});
    toast("Mise en avant enregistrée ✨");
  });

  function drawAnn(){
    $("#ann-list").innerHTML = MS.announcements.map((a,i)=>`
      <div class="adm-list-input"><input data-ann="${i}" value="${esc(a)}"><button data-ann-del="${i}" title="Supprimer">✕</button></div>`).join("");
    $$("[data-ann-del]").forEach(b => b.addEventListener("click", ()=>{
      MS_DATA.saveAnnouncements(MS.announcements.filter((_,i)=> i !== parseInt(b.dataset.annDel,10)));
      drawAnn(); toast("Message retiré");
    }));
  }
  $("#ann-add").addEventListener("click", ()=>{ MS_DATA.saveAnnouncements(MS.announcements.concat(["Nouveau message"])); drawAnn(); });
  $("#ann-save").addEventListener("click", ()=>{
    MS_DATA.saveAnnouncements($$("[data-ann]").map(i => i.value.trim()).filter(Boolean));
    toast("Barre d'annonce mise à jour"); drawAnn();
  });
  drawAnn();

  $("#s-save").addEventListener("click", ()=>{
    MS_DATA.saveConfig({slogan: $("#s-slogan").value.trim() || MS.config.slogan});
    MS_DATA.savePhrases({marque: $("#s-marque").value.trim(), collection: $("#s-coll").value.trim(), sensualite: $("#s-sens").value.trim()});
    toast("Slogan et phrases enregistrés");
  });
  $("#k-save").addEventListener("click", ()=>{
    MS_DATA.saveConfig({
      whatsapp: $("#k-wa").value.replace(/\D/g,""), telephone: $("#k-tel").value.trim(),
      email: $("#k-mail").value.trim(), adresse: $("#k-adr").value.trim(), horaires: $("#k-hor").value.trim(),
      instagram: $("#r-ig").value.trim(), facebook: $("#r-fb").value.trim(), tiktok: $("#r-tt").value.trim(),
      livraison: {abidjan: parseInt($("#l-abj").value,10) || 0, interieur: parseInt($("#l-int").value,10) || 0, delai: $("#l-del").value.trim() || "3 jours"}
    });
    toast("Coordonnées et livraison enregistrées");
  });
  $("#px-save").addEventListener("click", ()=>{
    MS_DATA.saveConfig({facebookPixelId: $("#px-id").value.replace(/\s/g,"")});
    toast($("#px-id").value.trim() ? "Pixel Facebook activé ✓" : "Pixel Facebook désactivé");
  });

  $("#bk-export").addEventListener("click", ()=>{
    const data = {};
    for(let i = 0; i < localStorage.length; i++){
      const k = localStorage.key(i);
      if(k && k.startsWith("ms_")) data[k] = localStorage.getItem(k);
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type:"application/json"}));
    a.download = "sauvegarde-marson-" + new Date().toISOString().slice(0,10) + ".json";
    a.click(); URL.revokeObjectURL(a.href);
    toast("Sauvegarde téléchargée — conservez-la précieusement");
  });
  $("#bk-import-btn").addEventListener("click", ()=> $("#bk-import").click());
  $("#bk-import").addEventListener("change", e=>{
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = ()=>{
      try{
        const data = JSON.parse(r.result);
        if(!confirm("Restaurer cette sauvegarde ? Les données actuelles seront remplacées.")) return;
        Object.keys(data).forEach(k=>{ if(k.startsWith("ms_")) localStorage.setItem(k, data[k]); });
        toast("Sauvegarde restaurée"); setTimeout(()=> location.reload(), 900);
      }catch(err){ toast("Fichier de sauvegarde invalide"); }
    };
    r.readAsText(f);
  });

  $("#w-save").addEventListener("click", async ()=>{
    if(!(await adminHashOk($("#w-old").value))){ toast("Mot de passe actuel incorrect"); return; }
    if($("#w-new").value.length < 6){ toast("6 caractères minimum"); return; }
    ls.set("ms_admin_pwd_hash", await hashPwd($("#w-new").value));
    localStorage.removeItem("ms_admin_pwd");
    toast("Mot de passe modifié ✓"); $("#w-old").value = ""; $("#w-new").value = "";
  });
}

/* ============================================================ AUTH & INIT */
function init(){
  const enter = ()=>{ $("#admin-login").hidden = true; $("#admin-shell").hidden = false; show("home"); };
  const saved = ls.get("ms_admin_ok", 0);
  if(saved && Date.now() - saved < SESSION_H * 3600000) enter();
  else localStorage.removeItem("ms_admin_ok");

  $("#login-form").addEventListener("submit", async e=>{
    e.preventDefault();
    const locked = lockState();
    if(locked){ toast("Trop de tentatives — réessayez dans " + locked + " min"); return; }
    const ok = await adminHashOk($("#adm-pwd").value);
    if(ok){
      localStorage.removeItem("ms_admin_lock");
      ls.set("ms_admin_ok", Date.now());
      enter();
    } else {
      const l = ls.get("ms_admin_lock", {n:0, t:0});
      ls.set("ms_admin_lock", {n: l.n + 1, t: Date.now()});
      const left = MAX_TRIES - (l.n + 1);
      $("#adm-pwd").value = "";
      $("#adm-pwd").placeholder = left > 0 ? "Incorrect — " + left + " essai(s) restant(s)" : "Compte verrouillé " + LOCK_MIN + " min";
    }
  });
  $("#adm-logout").addEventListener("click", ()=>{ localStorage.removeItem("ms_admin_ok"); location.reload(); });
}
document.addEventListener("DOMContentLoaded", init);
})();
