/* ============================================================
   MARSON SENSUALITY — FRONTEND / site public
   En-tête, annonce, recherche, panier, favoris, pages.
   Les données viennent du backend via api.js (MS / API).
   ============================================================ */
(function(){
"use strict";
const $  = (s,c)=> (c||document).querySelector(s);
const $$ = (s,c)=> Array.from((c||document).querySelectorAll(s));
const LS = { get(k,d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
             set(k,v){ localStorage.setItem(k, JSON.stringify(v)); } };

/* ---------------- Icônes ---------------- */
const I = {
  search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"/></svg>',
  bag:'<svg viewBox="0 0 24 24"><path d="M6 8h12l1 13H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  heart:'<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.5-9-9c-1.2-2.8.6-6 3.8-6 2 0 3.4 1.2 5.2 3.4C13.8 6.2 15.2 5 17.2 5c3.2 0 5 3.2 3.8 6-2 4.5-9 9-9 9z"/></svg>',
  burger:'<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  drop:'<svg viewBox="0 0 24 24"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg>',
  box:'<svg viewBox="0 0 24 24"><path d="M3 8l9-4 9 4v9l-9 4-9-4V8z"/><path d="M3 8l9 4 9-4M12 12v9"/></svg>',
  mail:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14"/><path d="M3 6l9 7 9-7"/></svg>',
  phone:'<svg viewBox="0 0 24 24"><path d="M6 3h4l1 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 1v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z"/></svg>',
  pin:'<svg viewBox="0 0 24 24"><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  card:'<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13"/><path d="M3 10h18"/></svg>',
  ig:'<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3.8" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="17" cy="7" r="1.1"/></svg>',
  fb:'<svg viewBox="0 0 24 24"><path d="M13.5 21v-7h2.6l.5-3.2h-3.1V8.7c0-.9.3-1.6 1.7-1.6h1.5V4.2c-.3 0-1.2-.1-2.2-.1-2.2 0-3.8 1.4-3.8 3.9v2.8H8v3.2h2.7v7h2.8z"/></svg>',
  tt:'<svg viewBox="0 0 24 24"><path d="M16.2 3c.3 2.2 1.8 3.8 3.8 4v2.9c-1.5 0-2.8-.5-3.8-1.2v6.6a5.8 5.8 0 1 1-5.8-5.8c.3 0 .6 0 .9.1v3a2.9 2.9 0 1 0 2 2.7V3h2.9z"/></svg>'
};

/* ---------------- État local (panier, favoris) ---------------- */
const cart = ()=> LS.get("ms_cart", {});
const favs = ()=> LS.get("ms_favs", []);
const sessionEmail = ()=> localStorage.getItem("ms_email");
const promo = ()=> LS.get("ms_promo", null);   // {code, rate} validé par le serveur

/* ---------------- Pixel Facebook / Meta ---------------- */
function initPixel(){
  window.__msTrack = function(ev, val){ if(window.fbq){ try{ fbq("track", ev, val || {}); }catch(e){} } };
  const id = MS.config.facebookPixelId;
  if(!id || window.fbq) return;
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', id); fbq('track', 'PageView');
}

/* ---------------- Toast ---------------- */
let toastTimer;
function toast(msg){
  let t = $("#toast");
  if(!t){ t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.classList.remove("show"), 2600);
}

/* ---------------- En-tête + annonce ---------------- */
function mountChrome(){
  const page = document.body.dataset.page || "";
  const nav = [["index.html","Accueil","home"],["boutique.html","Boutique","boutique"],
    ["collections.html","Collections","collections"],["a-propos.html","À propos","a-propos"],["contact.html","Contact","contact"]];
  document.body.insertAdjacentHTML("afterbegin", `
  <div class="announce" aria-live="polite">${MS.announcements.map((m,i)=>`<span class="${i===0?"on":""}"><i class="star">✦</i>${esc(m)}<i class="star">✦</i></span>`).join("")}</div>
  <header class="header">
    <div class="container header-in">
      <a class="brand" href="index.html">MARSON SENSUALITY<small>${esc(MS.config.sousTitre || "Maison de parfum")}</small></a>
      <nav class="nav" aria-label="Navigation principale">
        ${nav.map(([h,l,id])=>`<a href="${h}" class="${page===id?"active":""}">${l}</a>`).join("")}
      </nav>
      <div class="header-icons">
        <button class="icon-btn" id="search-open" aria-label="Recherche">${I.search}<span class="search-label">Rechercher</span></button>
        <a class="icon-btn" href="compte.html" aria-label="Compte client">${I.user}</a>
        <button class="icon-btn" id="cart-open" aria-label="Panier">${I.bag}<span class="cart-count" id="cart-count" hidden>0</span></button>
        <button class="icon-btn burger" id="burger" aria-label="Menu">${I.burger}</button>
      </div>
    </div>
  </header>
  <div class="mobile-menu" id="mobile-menu">
    <button class="close-menu" id="menu-close" aria-label="Fermer">✕</button>
    ${nav.map(([h,l])=>`<a href="${h}">${l}</a>`).join("")}
    <a href="compte.html"><em>Mon compte</em></a>
  </div>`);
  const msgs = $$(".announce span");
  if(msgs.length > 1){ let i = 0; setInterval(()=>{ msgs[i].classList.remove("on"); i = (i+1)%msgs.length; msgs[i].classList.add("on"); }, 4600); }
  $("#burger").addEventListener("click", ()=> $("#mobile-menu").classList.add("open"));
  $("#menu-close").addEventListener("click", ()=> $("#mobile-menu").classList.remove("open"));
  $$("#mobile-menu a").forEach(a=> a.addEventListener("click", ()=> $("#mobile-menu").classList.remove("open")));
}

/* ---------------- Footer ---------------- */
function mountFooter(){
  const c = MS.config;
  document.body.insertAdjacentHTML("beforeend", `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <a class="brand" href="index.html">MARSON SENSUALITY<small>${esc(c.sousTitre || "Maison de parfum")}</small></a>
          <p class="tagline">${esc(c.slogan || "")}</p>
          <div class="socials">
            <a href="${esc(c.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${I.ig}</a>
            <a href="${esc(c.facebook)}" target="_blank" rel="noopener" aria-label="Facebook">${I.fb}</a>
            <a href="${esc(c.tiktok)}" target="_blank" rel="noopener" aria-label="TikTok">${I.tt}</a>
          </div>
        </div>
        <div><h4>Boutique</h4><ul>
          <li><a href="boutique.html">Tous les produits</a></li>
          ${MS.categories.map(cat=>`<li><a href="boutique.html?cat=${cat.id}">${esc(cat.nom)}</a></li>`).join("")}
          <li><a href="boutique.html?cat=nouveautes">Nouveautés</a></li>
          <li><a href="boutique.html?cat=promotions">Promotions</a></li>
        </ul></div>
        <div><h4>Maison</h4><ul>
          <li><a href="collections.html">Collections</a></li>
          <li><a href="a-propos.html">À propos</a></li>
          <li><a href="contact.html">Contact</a></li>
          <li><a href="infos-legales.html#livraison">Livraison</a></li>
          <li><a href="infos-legales.html#retours">Retours / échanges</a></li>
          <li><a href="infos-legales.html#cgv">Conditions générales</a></li>
          <li><a href="infos-legales.html#confidentialite">Politique de confidentialité</a></li>
        </ul></div>
        <div><h4>Contact</h4><ul>
          <li><a href="${MS_UTILS.waLink()}" target="_blank" rel="noopener">WhatsApp — nous écrire</a></li>
          <li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>
          <li><a href="tel:${String(c.telephone || "").replace(/[^+\d]/g,"")}">${esc(c.telephone)}</a></li>
          <li><a href="contact.html">${esc(c.horaires)}</a></li>
          <li><a href="contact.html">${esc(c.adresse)}</a></li>
        </ul></div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 MARSON SENSUALITY — Tous droits réservés</span>
        <a href="admin.html" style="letter-spacing:.18em;text-transform:uppercase;font-size:10px;color:var(--muted)">Espace administrateur</a>
        <span>Abidjan · Côte d'Ivoire</span>
      </div>
    </div>
  </footer>`);
}

/* ---------------- Recherche ---------------- */
function mountSearch(){
  const ov = document.createElement("div");
  ov.className = "search-overlay"; ov.id = "search-overlay";
  ov.innerHTML = `
    <div class="search-panel"><div class="container">
      <div class="search-field">
        <svg viewBox="0 0 24 24" style="width:22px;height:22px;stroke:var(--brown-2);fill:none;stroke-width:1.4"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <input id="search-input" type="search" placeholder="Vanille, brume, rose, coffret…" autocomplete="off" aria-label="Rechercher un produit">
        <button class="search-close" id="search-close" aria-label="Fermer">✕</button>
      </div>
      <div class="search-sugs"><span class="lab">Suggestions :</span>
        ${["vanille","brume","rose","coffret cadeau","parfum femme"].map(s=>`<button class="chip" data-sug="${s}">${s}</button>`).join("")}
      </div>
      <div id="search-results"></div>
    </div></div>`;
  document.body.appendChild(ov);
  const input = $("#search-input", ov), res = $("#search-results", ov);
  const close = ()=> ov.classList.remove("open");
  $("#search-open").addEventListener("click", ()=>{ ov.classList.add("open"); setTimeout(()=>input.focus(),120); });
  $("#search-close", ov).addEventListener("click", close);
  ov.addEventListener("click", e=>{ if(e.target === ov) close(); });
  document.addEventListener("keydown", e=>{ if(e.key === "Escape") close(); });
  function draw(){
    const q = input.value.trim();
    if(!q){ res.innerHTML = ""; return; }
    const list = MS_UTILS.search(q);
    if(!list.length){
      res.innerHTML = `<div class="search-empty"><p class="serif">Aucun résultat trouvé.</p>
        <p>Essayez avec un autre mot-clé.</p>
        <p style="margin-top:18px"><a class="link-u" href="boutique.html">Découvrir tous les produits</a></p></div>`;
      return;
    }
    res.innerHTML = `<div class="search-results">${list.slice(0,4).map(cardHTML).join("")}</div>
      <p style="margin-top:26px;text-align:center"><a class="link-u" href="boutique.html?q=${encodeURIComponent(q)}">Voir tous les résultats</a></p>`;
    bindCards(res);
  }
  input.addEventListener("input", draw);
  input.addEventListener("keydown", e=>{ if(e.key === "Enter") location.href = "boutique.html?q=" + encodeURIComponent(input.value.trim()); });
  $$("[data-sug]", ov).forEach(b=> b.addEventListener("click", ()=>{ input.value = b.dataset.sug; draw(); }));
}

/* ---------------- Cartes produit ---------------- */
function cardHTML(p){
  const f = favs();
  const badge = p.stock === 0 ? `<span class="p-badge promo">Rupture</span>`
    : p.promo ? `<span class="p-badge promo">Promotion</span>`
    : (p.nouveau ? `<span class="p-badge">Nouveau</span>` : "");
  return `
  <article class="p-card reveal">
    <a class="ph" href="produit.html?id=${p.id}" aria-label="${esc(p.nom)}">
      <img src="${p.img}" alt="${esc(p.nom)} — MARSON SENSUALITY" loading="lazy" decoding="async">${badge}
    </a>
    <button class="fav-btn ${f.includes(p.id)?"on":""}" data-fav="${p.id}" aria-label="Ajouter aux favoris">${I.heart}</button>
    <div class="txt">
      <span class="cat">${esc(MS_UTILS.catName(p.type))} ${p.audience === "femme" ? "· Femme" : p.audience === "unisexe" ? "· Unisexe" : p.audience === "enfant" ? "· Enfant" : ""}</span>
      <h3 class="serif">${esc(p.nom)}</h3>
      <p class="price">${p.ancienPrix ? `<s>${MS_UTILS.fmt(p.ancienPrix)}</s>` : ""}${MS_UTILS.fmt(p.prix)}</p>
      <a class="link-u" href="produit.html?id=${p.id}">Voir le produit</a>
    </div>
  </article>`;
}
function bindCards(scope){
  $$("[data-fav]", scope).forEach(b=>{
    if(b.dataset.bound) return; b.dataset.bound = "1";
    b.addEventListener("click", e=>{
      e.preventDefault();
      const id = b.dataset.fav; let f = favs();
      if(f.includes(id)){ f = f.filter(x=>x!==id); toast("Retiré des favoris"); }
      else { f.push(id); toast("Ajouté aux favoris ♡"); }
      LS.set("ms_favs", f);
      $$(`[data-fav="${id}"]`).forEach(x=>{
        x.classList.toggle("on", f.includes(id));
        if(x.classList.contains("fav-toggle")) x.textContent = f.includes(id) ? "♥ Dans vos favoris" : "♡ Ajouter aux favoris";
      });
    });
  });
}

/* ---------------- Panier (tiroir) ---------------- */
function mountDrawer(){
  const bd = document.createElement("div"); bd.className = "backdrop"; bd.id = "backdrop";
  const dr = document.createElement("aside"); dr.className = "drawer"; dr.id = "drawer"; dr.setAttribute("aria-label","Panier");
  dr.innerHTML = `
    <div class="drawer-head"><h3 class="serif">Panier</h3><button class="icon-btn" id="drawer-close" aria-label="Fermer">✕</button></div>
    <div class="drawer-body" id="cart-body"></div>
    <div class="drawer-foot">
      <div class="promo-row"><input id="promo-input" placeholder="Code promo" aria-label="Code promo"><button id="promo-apply">Appliquer</button></div>
      <div id="promo-applied"></div>
      <div id="cart-totals"></div>
      <div class="drawer-actions">
        <button class="btn btn-outline" id="continue-shop">Continuer mes achats</button>
        <a class="btn" href="commande.html" id="go-checkout">Passer la commande</a>
      </div>
    </div>`;
  document.body.appendChild(bd); document.body.appendChild(dr);
  const open = ()=>{ dr.classList.add("open"); bd.classList.add("open"); renderCart(); };
  const close = ()=>{ dr.classList.remove("open"); bd.classList.remove("open"); };
  $("#cart-open").addEventListener("click", open);
  $("#drawer-close", dr).addEventListener("click", close);
  bd.addEventListener("click", close);
  $("#continue-shop", dr).addEventListener("click", close);
  $("#promo-apply", dr).addEventListener("click", async ()=>{
    const code = ($("#promo-input", dr).value || "").trim().toUpperCase();
    try{
      const r = await API.post("/promo/validate", {code});
      if(r.valid){ LS.set("ms_promo", {code, rate: r.rate}); toast("Code " + code + " appliqué"); }
      else toast("Code promo invalide ou expiré");
    }catch(e){ toast("Code promo invalide ou expiré"); }
    renderCart();
  });
  dr.addEventListener("click", e=>{
    const b = e.target.closest("[data-cart]");
    if(!b) return;
    const c = cart(); const id = b.dataset.id;
    if(b.dataset.cart === "plus") c[id] = (c[id]||0) + 1;
    if(b.dataset.cart === "minus"){ c[id] = (c[id]||0) - 1; if(c[id] <= 0) delete c[id]; }
    if(b.dataset.cart === "rm"){ delete c[id]; toast("Produit retiré du panier"); }
    LS.set("ms_cart", c); renderCart();
  });
  window.__openCart = open;
}

function cartDetail(){
  const c = cart();
  const lines = Object.keys(c).map(id=>{ const p = MS_UTILS.byId(id); return p ? {p, qty:c[id]} : null; }).filter(Boolean);
  const sub = lines.reduce((s,l)=> s + l.p.prix * l.qty, 0);
  const pr = promo();
  const rate = pr && pr.rate ? pr.rate : 0;
  const disc = Math.round(sub * rate);
  return {lines, sub, code: rate ? pr.code : null, rate, disc, count: lines.reduce((s,l)=> s + l.qty, 0)};
}

function renderCart(){
  const body = $("#cart-body"), totals = $("#cart-totals"), applied = $("#promo-applied");
  if(!body) return;
  const d = cartDetail();
  const cnt = $("#cart-count");
  cnt.hidden = d.count === 0; cnt.textContent = d.count;
  const go = $("#go-checkout");
  if(!d.lines.length){
    body.innerHTML = `<div class="cart-empty"><p class="serif">Votre panier est vide.</p>
      <p>Laissez-vous tenter par une signature.</p>
      <p style="margin-top:20px"><a class="link-u" href="boutique.html">Découvrir la boutique</a></p></div>`;
    totals.innerHTML = ""; applied.innerHTML = "";
    go.style.pointerEvents = "none"; go.style.opacity = ".4";
    return;
  }
  go.style.pointerEvents = ""; go.style.opacity = "";
  body.innerHTML = d.lines.map(l=>`
    <div class="cart-line">
      <img src="${l.p.img}" alt="${esc(l.p.nom)}">
      <div>
        <h4>${esc(l.p.nom)}</h4>
        <p class="u">${MS_UTILS.fmt(l.p.prix)} · ${esc(l.p.format)}</p>
        <div class="qty">
          <button data-cart="minus" data-id="${l.p.id}" aria-label="Diminuer">−</button>
          <span>${l.qty}</span>
          <button data-cart="plus" data-id="${l.p.id}" aria-label="Augmenter">+</button>
        </div>
      </div>
      <div class="right"><span class="sub">${MS_UTILS.fmt(l.p.prix * l.qty)}</span>
        <button class="rm" data-cart="rm" data-id="${l.p.id}">Retirer</button></div>
    </div>`).join("");
  applied.innerHTML = d.code ? `<div class="promo-applied"><span>Code ${esc(d.code)} · −${Math.round(d.rate*100)} %</span><button class="rm" id="promo-rm">Retirer</button></div>` : "";
  const rm = $("#promo-rm"); if(rm) rm.addEventListener("click", ()=>{ localStorage.removeItem("ms_promo"); renderCart(); });
  totals.innerHTML = `
    <div class="tot-row"><span>Sous-total</span><span>${MS_UTILS.fmt(d.sub)}</span></div>
    ${d.disc ? `<div class="tot-row"><span>Remise</span><span>− ${MS_UTILS.fmt(d.disc)}</span></div>` : ""}
    <div class="tot-row"><span>Livraison</span><span class="tbd">à déterminer</span></div>
    <div class="tot-row total"><span>Total</span><span>${MS_UTILS.fmt(d.sub - d.disc)}</span></div>`;
}

function addToCart(id, qty){
  const p = MS_UTILS.byId(id);
  if(!p) return;
  if(p.stock === 0){ toast("Ce parfum est momentanément en rupture"); return; }
  if(typeof p.stock === "number" && p.stock > 0 && (cart()[id] || 0) + (qty||1) > p.stock){
    toast("Stock disponible insuffisant (" + p.stock + ")"); return;
  }
  const c = cart(); c[id] = (c[id]||0) + (qty||1); LS.set("ms_cart", c);
  renderCart();
  if(window.__msTrack) window.__msTrack("AddToCart", {value: p.prix, currency: "XOF"});
  toast("Ajouté au panier — " + p.nom);
  const cnt = $("#cart-count");
  cnt.style.transition = "transform .3s"; cnt.style.transform = "scale(1.35)";
  setTimeout(()=> cnt.style.transform = "scale(1)", 300);
}

/* ---------------- Révélations au défilement ---------------- */
function mountReveal(){
  const io = new IntersectionObserver(es=> es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("visible"); io.unobserve(e.target); } }), {threshold:.12});
  $$(".reveal").forEach(el=> io.observe(el));
  window.__observeReveal = ()=> $$(".reveal:not(.visible)").forEach(el=> io.observe(el));
}

/* ============================================================ PAGES */
function initHome(){
  const hs = $("#hero-slogan");
  if(hs){ const s = MS.config.slogan || "", i = s.indexOf(","); hs.innerHTML = i > 0 ? esc(s.slice(0, i+1)) + "<br>" + esc(s.slice(i+1).trim()) : esc(s); }
  const pm = $("#phrase-marque");    if(pm) pm.textContent = MS.phrases.marque || "";
  const pc = $("#phrase-collection");if(pc) pc.textContent = MS.phrases.collection || "";
  const ps = $("#phrase-sensualite");if(ps) ps.textContent = MS.phrases.sensualite || "";

  $("#home-cats").innerHTML = MS.categories.map(c=>`
    <a class="cat-card reveal" href="boutique.html?cat=${c.id}">
      <div class="ph"><img src="${c.img}" alt="${esc(c.nom)} — MARSON SENSUALITY" loading="lazy" decoding="async"></div>
      <div class="txt"><h3 class="serif">${esc(c.nom)}</h3><span>${esc(c.phrase)}</span></div>
    </a>`).join("");

  const fc = MS.collections.find(c => c.id === MS.featuredCollection) || MS.collections[0];
  if(fc){
    const ft = $("#feat-title"); if(ft) ft.innerHTML = `La Collection <em>${esc(fc.nom.replace("Collection ",""))}</em>`;
    const fi = $("#feat-img");  if(fi){ fi.src = fc.img; fi.alt = esc(fc.nom) + " — MARSON SENSUALITY"; }
    const fd = $("#feat-desc"); if(fd) fd.textContent = fc.phrase;
    const fl = $("#feat-link"); if(fl) fl.href = "collections.html?id=" + fc.id;
    $("#feat-mini").innerHTML = MS.products.filter(p => p.collections.includes(fc.id)).slice(0,3).map(p=>`
      <a href="produit.html?id=${p.id}"><img src="${p.img}" alt="${esc(p.nom)}" loading="lazy" decoding="async"><span>${esc(p.nom)}</span></a>`).join("");
  }
  $("#home-prods").innerHTML = MS.featured.map(id=> MS_UTILS.byId(id)).filter(Boolean).map(cardHTML).join("");
  bindCards($("#home-prods"));

  const insta = ["assets/img/univers.webp","assets/img/p-rose.webp","assets/img/cat-coffrets.webp","assets/img/p-vanille.webp","assets/img/p-ambre.webp","assets/img/cat-brumes.webp"];
  $("#insta-grid").innerHTML = insta.map(src=>`<a href="${esc(MS.config.instagram)}" target="_blank" rel="noopener"><img src="${src}" alt="Univers MARSON SENSUALITY sur Instagram" loading="lazy" decoding="async"></a>`).join("");
  $("#adv-grid").innerHTML = MS.advantages.map(a=>`<div class="adv reveal">${I[a.icone] || I.drop}<h3>${a.titre}</h3><p>${a.texte}</p></div>`).join("");

  const ld = {"@context":"https://schema.org","@type":"Organization","name":"MARSON SENSUALITY",
    "slogan": MS.config.slogan, "email": MS.config.email, "telephone": MS.config.telephone,
    "areaServed":"Côte d'Ivoire", "sameAs":[MS.config.instagram, MS.config.facebook, MS.config.tiktok].filter(Boolean)};
  const sc = document.createElement("script"); sc.type = "application/ld+json"; sc.textContent = JSON.stringify(ld);
  document.head.appendChild(sc);
}

function initBoutique(){
  const params = new URLSearchParams(location.search);
  let cat = params.get("cat") || "tous";
  let q = params.get("q") || "";
  let sort = "selection";
  const qInput = $("#shop-q"); if(qInput) qInput.value = q;
  const chips = [["tous","Tous les produits"]].concat(MS.categories.map(c=>[c.id,c.nom])).concat([["nouveautes","Nouveautés"],["promotions","Promotions"]]);
  $("#shop-filters").innerHTML = chips.map(([id,l])=>`<button class="chip ${id===cat?"active":""}" data-cat="${id}">${esc(l)}</button>`).join("");
  function list(){
    let l = MS.products.filter(p => p.active !== false);
    if(MS.categories.some(c => c.id === cat)) l = l.filter(p=> p.type === cat);
    if(cat === "nouveautes") l = l.filter(p=> p.nouveau);
    if(cat === "promotions") l = l.filter(p=> p.promo);
    if(q.trim()) l = MS_UTILS.search(q).filter(p=> l.includes(p));
    if(sort === "prix-asc") l.sort((a,b)=> a.prix - b.prix);
    if(sort === "prix-desc") l.sort((a,b)=> b.prix - a.prix);
    if(sort === "nom") l.sort((a,b)=> a.nom.localeCompare(b.nom, "fr"));
    if(sort === "nouveautes") l.sort((a,b)=> (b.nouveau?1:0) - (a.nouveau?1:0));
    return l;
  }
  function draw(){
    const l = list();
    $("#shop-count").textContent = l.length + " produit" + (l.length > 1 ? "s" : "");
    if(!l.length){
      $("#shop-grid").innerHTML = `<div class="search-empty" style="grid-column:1/-1"><p class="serif">Aucun résultat trouvé.</p>
        <p>Essayez avec un autre mot-clé.</p>
        <p style="margin-top:18px"><button class="link-u" id="reset-shop">Découvrir tous les produits</button></p></div>`;
      $("#reset-shop").addEventListener("click", ()=>{ cat = "tous"; q = ""; qInput.value = "";
        $$("#shop-filters .chip").forEach(c=> c.classList.toggle("active", c.dataset.cat === "tous")); draw(); });
      return;
    }
    $("#shop-grid").innerHTML = l.map(cardHTML).join("");
    bindCards($("#shop-grid"));
    if(window.__observeReveal) window.__observeReveal();
  }
  $("#shop-filters").addEventListener("click", e=>{
    const b = e.target.closest("[data-cat]"); if(!b) return;
    cat = b.dataset.cat;
    $$("#shop-filters .chip").forEach(c=> c.classList.toggle("active", c === b));
    draw();
  });
  $("#shop-sort").addEventListener("change", e=>{ sort = e.target.value; draw(); });
  qInput.addEventListener("input", e=>{ q = e.target.value; draw(); });
  draw();
}

function initCollections(){
  const id = new URLSearchParams(location.search).get("id");
  if(id){
    const c = MS.collections.find(x=> x.id === id);
    if(!c) return;
    document.title = c.nom + " — MARSON SENSUALITY";
    const ph = $(".page-head"); if(ph) ph.style.display = "none";
    const cl = $("#coll-list"); if(cl) cl.style.display = "none";
    $("#coll-detail").innerHTML = `
      <div class="coll-hero">
        <img src="${c.img}" alt="${esc(c.nom)} — MARSON SENSUALITY">
        <div class="veil"></div>
        <div class="container txt">
          <span class="kicker" style="color:var(--gold)">Collection</span>
          <h1>${esc(c.nom).replace("Collection ","Collection <em>")}</em></h1>
          <p>${esc(c.phrase)}</p>
        </div>
      </div>
      <div class="container">
        <div class="prod-grid" id="coll-grid">${MS.products.filter(p=> p.active !== false && p.collections.includes(id)).map(cardHTML).join("")}</div>
        <p style="text-align:center;margin-top:50px"><a class="link-u" href="collections.html">Toutes les collections</a></p>
      </div>`;
    bindCards($("#coll-grid"));
  } else {
    $("#coll-list").innerHTML = MS.collections.map(c=>`
      <a class="coll-card reveal" href="collections.html?id=${c.id}">
        <img src="${c.img}" alt="${esc(c.nom)} — MARSON SENSUALITY" loading="lazy" decoding="async">
        <div class="veil"></div>
        <div class="txt"><h3>${esc(c.nom).replace("Collection ","Collection <em>")}</em></h3>
        <p>${esc(c.phrase)}</p><span class="link-u">Découvrir</span></div>
      </a>`).join("");
  }
  if(window.__observeReveal) window.__observeReveal();
}

function initProduit(){
  const id = new URLSearchParams(location.search).get("id");
  const p = MS_UTILS.byId(id);
  const wrap = $("#prod-detail");
  if(!p || p.active === false){
    wrap.innerHTML = `<div class="container search-empty" style="padding:90px 0"><p class="serif">Produit introuvable.</p>
      <p style="margin-top:16px"><a class="link-u" href="boutique.html">Découvrir tous les produits</a></p></div>`;
    return;
  }
  document.title = p.nom + " — MARSON SENSUALITY";
  const f = favs();
  const out = p.stock === 0;
  const thumb2 = p.img2 ? `<button data-v="3" aria-label="Mise en scène"><img src="${p.img2}" alt=""></button>` : "";
  wrap.innerHTML = `
  <div class="container prod-layout" style="padding:70px 0">
    <div class="gallery">
      <div class="main"><img id="g-main" src="${p.img}" alt="${esc(p.nom)} — MARSON SENSUALITY"></div>
      <div class="thumbs">
        <button class="sel" data-v="0" aria-label="Vue principale"><img src="${p.img}" alt=""></button>
        <button data-v="1" aria-label="Détail du flacon"><img class="zoom-cap" src="${p.img}" alt=""></button>
        <button data-v="2" aria-label="Détail de l'étiquette"><img class="zoom-label" src="${p.img}" alt=""></button>
        ${thumb2}
      </div>
    </div>
    <div class="p-info">
      <span class="cat">${esc(MS_UTILS.catName(p.type))} · ${p.audience === "femme" ? "Femme" : p.audience === "enfant" ? "Enfant" : "Unisexe"}${p.collections.length ? " · " + esc(MS_UTILS.collName(p.collections[0])) : ""}</span>
      <h1>${esc(p.nom)}</h1>
      <p class="price">${p.ancienPrix ? `<s>${MS_UTILS.fmt(p.ancienPrix)}</s>` : ""}${MS_UTILS.fmt(p.prix)}</p>
      <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)">${esc(p.format)}</p>
      ${out ? `<p style="color:#A05a50;font-size:12px;letter-spacing:.18em;text-transform:uppercase;margin-top:6px">Momentanément en rupture</p>`
            : (typeof p.stock === "number" && p.stock > 0 && p.stock <= 5 ? `<p style="color:var(--gold);font-size:12px;letter-spacing:.14em;margin-top:6px">Plus que ${p.stock} en stock</p>` : "")}
      <p class="desc">${esc(p.desc)}</p>
      <div class="notes">
        <div><span>Notes de tête</span><p>${esc(p.notes.tete)}</p></div>
        <div><span>Notes de coeur</span><p>${esc(p.notes.coeur)}</p></div>
        <div><span>Notes de fond</span><p>${esc(p.notes.fond)}</p></div>
      </div>
      <div class="buy-row">
        <div class="qty"><button id="q-minus" aria-label="Diminuer">−</button><span id="q-val">1</span><button id="q-plus" aria-label="Augmenter">+</button></div>
        <button class="btn" id="add-btn" style="flex:1;min-width:200px" ${out ? "disabled" : ""}>${out ? "Rupture de stock" : "Ajouter au panier"}</button>
      </div>
      <div class="p-actions">
        <button class="btn btn-outline fav-toggle ${f.includes(p.id)?"on":""}" data-fav="${p.id}" style="border-color:var(--line)">${f.includes(p.id) ? "♥ Dans vos favoris" : "♡ Ajouter aux favoris"}</button>
      </div>
      <div class="p-meta">
        <p><span>✦</span> Livraison à Abidjan et partout en Côte d'Ivoire — sous ${esc(MS.config.livraison.delai)}.</p>
        <p><span>✦</span> Paiement : Mobile Money, carte bancaire ou à la livraison.</p>
        <p><span>✦</span> Une question ? <a href="${MS_UTILS.waLink()}" target="_blank" rel="noopener" style="border-bottom:1px solid var(--gold-soft)">Écrivez-nous sur WhatsApp</a>.</p>
      </div>
    </div>
  </div>
  <section class="section section-alt"><div class="container">
    <div class="section-head"><span class="kicker">Dans le même univers</span><h2 class="section-title">Vous aimerez <em>aussi</em></h2></div>
    <div class="prod-grid three" id="rel-grid"></div>
  </div></section>`;

  let qty = 1;
  $("#q-plus").addEventListener("click", ()=>{ qty++; $("#q-val").textContent = qty; });
  $("#q-minus").addEventListener("click", ()=>{ qty = Math.max(1, qty-1); $("#q-val").textContent = qty; });
  $("#add-btn").addEventListener("click", ()=> addToCart(p.id, qty));

  const main = $("#g-main");
  const views = [{src:p.img,t:""},{src:p.img,t:"scale(1.7)",p:"top center"},{src:p.img,t:"scale(1.4)",p:"center"},{src:p.img2||p.img,t:""}];
  $$(".thumbs button").forEach(b=> b.addEventListener("click", ()=>{
    $$(".thumbs button").forEach(x=> x.classList.remove("sel")); b.classList.add("sel");
    const v = views[parseInt(b.dataset.v,10)] || views[0];
    main.src = v.src; main.style.transform = v.t || ""; main.style.objectPosition = v.p || "center";
  }));

  const rel = MS.products.filter(x=> x.active !== false && x.id !== p.id && x.collections.some(c=> p.collections.includes(c))).slice(0,3);
  $("#rel-grid").innerHTML = (rel.length ? rel : MS.products.filter(x=> x.id !== p.id).slice(0,3)).map(cardHTML).join("");
  bindCards($("#rel-grid"));

  const ld = {"@context":"https://schema.org","@type":"Product","name":p.nom,"image":[p.img,p.img2].filter(Boolean),
    "description":p.desc,"brand":{"@type":"Brand","name":"MARSON SENSUALITY"},
    "offers":{"@type":"Offer","priceCurrency":"XOF","price":p.prix,
      "availability": p.stock === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      "seller":{"@type":"Organization","name":"MARSON SENSUALITY"}}};
  const sc = document.createElement("script"); sc.type = "application/ld+json"; sc.textContent = JSON.stringify(ld);
  document.head.appendChild(sc);
  if(window.__observeReveal) window.__observeReveal();
}

/* ---------- Commande ---------- */
function initCommande(){
  const wrap = $("#order-wrap");
  const d = cartDetail();
  if(!d.lines.length){
    wrap.innerHTML = `<div class="container cart-empty" style="padding:90px 0"><p class="serif">Votre panier est vide.</p>
      <p>Ajoutez une fragrance pour passer commande.</p>
      <p style="margin-top:22px"><a class="btn" href="boutique.html">Découvrir la boutique</a></p></div>`;
    return;
  }
  wrap.innerHTML = `
  <div class="container order-grid" style="padding:70px 0">
    <form id="order-form" novalidate>
      <div class="guest-note">Vous pouvez commander sans créer de compte. <a href="compte.html" style="border-bottom:1px solid var(--gold-soft)">Créer un compte</a> vous permettra de suivre vos commandes.</div>
      <div class="form-row">
        <div class="field"><label for="o-prenom">Prénom</label><input id="o-prenom" required></div>
        <div class="field"><label for="o-nom">Nom</label><input id="o-nom" required></div>
      </div>
      <div class="form-row">
        <div class="field"><label for="o-tel">Téléphone</label><input id="o-tel" type="tel" required placeholder="+225 …"></div>
        <div class="field"><label for="o-mail">E-mail</label><input id="o-mail" type="email" required></div>
      </div>
      <div class="field"><label for="o-zone">Zone de livraison</label>
        <select id="o-zone"><option value="">— Choisir —</option><option value="abidjan">Abidjan</option><option value="interieur">Autre ville de Côte d'Ivoire</option></select></div>
      <div class="field"><label for="o-adresse">Adresse / point de rendez-vous</label><input id="o-adresse" required placeholder="Commune, quartier, repère…"></div>
      <div class="form-row">
        <div class="field"><label for="o-mode">Mode de livraison</label>
          <select id="o-mode"><option value="rdv">Point de rendez-vous</option><option value="coursier">Coursier (livraison à l'adresse)</option></select></div>
        <div class="field"><label for="o-paiement">Paiement</label>
          <select id="o-paiement"><option value="mobile">Mobile Money</option><option value="carte">Carte bancaire</option><option value="livraison">Paiement à la livraison</option></select></div>
      </div>
      <div class="field"><label for="o-note">Note (optionnel)</label><textarea id="o-note" style="min-height:80px"></textarea></div>
      <button class="btn btn-block" type="submit">Confirmer la commande</button>
    </form>
    <aside class="order-sum">
      <h3 class="serif">Récapitulatif</h3>
      ${d.lines.map(l=>`<div class="sum-line"><span class="l"><img src="${l.p.img}" alt=""><span>${esc(l.p.nom)}<br><small style="color:var(--muted)">× ${l.qty}</small></span></span><span>${MS_UTILS.fmt(l.p.prix*l.qty)}</span></div>`).join("")}
      <div id="sum-totals" style="margin-top:14px"></div>
    </aside>
  </div>`;
  let ship = 0;
  function totals(){
    $("#sum-totals").innerHTML = `
      <div class="tot-row"><span>Sous-total</span><span>${MS_UTILS.fmt(d.sub)}</span></div>
      ${d.disc ? `<div class="tot-row"><span>Remise (${esc(d.code)})</span><span>− ${MS_UTILS.fmt(d.disc)}</span></div>` : ""}
      <div class="tot-row"><span>Livraison</span><span>${ship ? MS_UTILS.fmt(ship) : "<i class='tbd'>à déterminer</i>"}</span></div>
      <div class="tot-row total"><span>Total</span><span>${MS_UTILS.fmt(d.sub - d.disc + ship)}</span></div>`;
  }
  totals();
  if(window.__msTrack) window.__msTrack("InitiateCheckout", {value: d.sub - d.disc, currency: "XOF"});
  $("#o-zone").addEventListener("change", e=>{
    ship = e.target.value === "abidjan" ? MS.config.livraison.abidjan : e.target.value === "interieur" ? MS.config.livraison.interieur : 0;
    totals();
  });
  $("#order-form").addEventListener("submit", async e=>{
    e.preventDefault();
    for(const id of ["o-prenom","o-nom","o-tel","o-mail","o-zone","o-adresse"]){
      const el = $("#"+id);
      if(!el.value.trim()){ el.focus(); el.style.borderColor = "#C4756A"; toast("Merci de compléter tous les champs"); return; }
      el.style.borderColor = "";
    }
    try{
      const r = await API.post("/orders", {
        items: d.lines.map(l=> ({id: l.p.id, qty: l.qty})),
        prenom: $("#o-prenom").value.trim(), nom: $("#o-nom").value.trim(),
        tel: $("#o-tel").value.trim(), email: $("#o-mail").value.trim(),
        zone: $("#o-zone").value, mode: $("#o-mode").value, paiement: $("#o-paiement").value,
        adresse: $("#o-adresse").value.trim(), note: $("#o-note").value.trim(),
        code: d.code || ""
      });
      const o = r.order;
      LS.set("ms_cart", {}); localStorage.removeItem("ms_promo"); renderCart();
      if(window.__msTrack) window.__msTrack("Purchase", {value: o.total, currency: "XOF"});
      wrap.innerHTML = `<div class="container order-done">
        <span class="kicker">Merci</span>
        <p class="serif">Votre commande est confirmée.</p>
        <p class="ref">Commande ${esc(o.ref)} · ${MS_UTILS.fmt(o.total)}</p>
        <p class="lead" style="max-width:460px;margin:0 auto 30px">Nous vous contacterons très vite pour confirmer la livraison (délai habituel : ${esc(MS.config.livraison.delai)}).</p>
        ${sessionEmail() ? "" : `<p style="margin-bottom:26px"><a class="link-u" href="compte.html">Créer un compte pour retrouver cette commande</a></p>`}
        <a class="btn" href="boutique.html">Continuer mes achats</a></div>`;
      window.scrollTo({top:0, behavior:"smooth"});
    }catch(err){ toast(err.message); }
  });
}

/* ---------- Compte client ---------- */
function initCompte(){
  const wrap = $("#account-wrap");
  if(API.clientToken()) drawDash(); else drawAuth();

  function drawAuth(){
    wrap.innerHTML = `
    <div class="container-narrow" style="padding:70px 0">
      <div class="auth-tabs"><button class="on" data-tab="login">Connexion</button><button data-tab="register">Créer un compte</button></div>
      <div class="account-panel" id="auth-panel"></div>
    </div>`;
    const tabs = $$(".auth-tabs button");
    tabs.forEach(t=> t.addEventListener("click", ()=>{ tabs.forEach(x=> x.classList.toggle("on", x === t)); t.dataset.tab === "login" ? loginForm() : regForm(); }));
    function loginForm(){
      $("#auth-panel").innerHTML = `
        <h2 class="serif">Bon retour parmi nous</h2>
        <form id="f-login">
          <div class="field"><label>E-mail</label><input type="email" id="l-mail" required></div>
          <div class="field"><label>Mot de passe</label><input type="password" id="l-pwd" required></div>
          <button class="btn btn-block" type="submit">Se connecter</button>
          <p style="text-align:center;margin-top:16px;font-size:12px;color:var(--muted)">Mot de passe oublié ? Contactez-nous sur WhatsApp, nous vous aiderons.</p>
        </form>`;
      $("#f-login").addEventListener("submit", async e=>{
        e.preventDefault();
        try{
          const r = await API.post("/auth/login", {email: $("#l-mail").value.trim(), password: $("#l-pwd").value});
          API.setClientToken(r.token); localStorage.setItem("ms_email", r.email);
          toast("Connexion réussie"); drawDash();
        }catch(err){ toast(err.message); }
      });
    }
    function regForm(){
      $("#auth-panel").innerHTML = `
        <h2 class="serif">Créer votre compte</h2>
        <form id="f-reg">
          <div class="form-row"><div class="field"><label>Prénom</label><input id="r-prenom" required></div>
          <div class="field"><label>Nom</label><input id="r-nom" required></div></div>
          <div class="field"><label>Téléphone</label><input id="r-tel" type="tel" required></div>
          <div class="field"><label>Adresse e-mail</label><input id="r-mail" type="email" required></div>
          <div class="field"><label>Mot de passe</label><input id="r-pwd" type="password" required minlength="6"></div>
          <button class="btn btn-block" type="submit">Créer mon compte</button>
          <p style="font-size:12px;color:var(--muted);margin-top:14px;text-align:center">La création d'un compte n'est jamais obligatoire pour commander.</p>
        </form>`;
      $("#f-reg").addEventListener("submit", async e=>{
        e.preventDefault();
        try{
          const r = await API.post("/auth/register", {prenom: $("#r-prenom").value.trim(), nom: $("#r-nom").value.trim(),
            telephone: $("#r-tel").value.trim(), email: $("#r-mail").value.trim(), password: $("#r-pwd").value});
          API.setClientToken(r.token); localStorage.setItem("ms_email", r.email);
          toast("Bienvenue dans votre espace"); drawDash();
        }catch(err){ toast(err.message); }
      });
    }
    loginForm();
  }

  async function drawDash(){
    let me;
    try{ me = await API.get("/auth/me"); }
    catch(err){ API.setClientToken(null); localStorage.removeItem("ms_email"); drawAuth(); return; }
    const u = me.user;
    wrap.innerHTML = `
    <div class="container account-grid" style="padding:70px 0">
      <nav class="account-nav" id="acc-nav">
        <button class="on" data-p="infos">Mon compte</button>
        <button data-p="orders">Mes commandes</button>
        <button data-p="favs">Mes favoris</button>
        <button data-p="addr">Mes adresses</button>
        <button data-p="pwd">Mot de passe</button>
        <button data-p="out">Se déconnecter</button>
      </nav>
      <div class="account-panel" id="acc-panel"></div>
    </div>`;
    const nav = $("#acc-nav");
    nav.addEventListener("click", e=>{
      const b = e.target.closest("[data-p]"); if(!b) return;
      if(b.dataset.p === "out"){ API.setClientToken(null); localStorage.removeItem("ms_email"); toast("Vous êtes déconnecté(e)"); location.reload(); return; }
      $$("button", nav).forEach(x=> x.classList.toggle("on", x === b));
      panels[b.dataset.p]();
    });
    const panels = {
      infos(){
        $("#acc-panel").innerHTML = `
          <h2 class="serif">Bonjour, ${esc(u.prenom)}</h2>
          <div class="field"><label>Prénom</label><input id="i-prenom" value="${esc(u.prenom)}"></div>
          <div class="field"><label>Nom</label><input id="i-nom" value="${esc(u.nom)}"></div>
          <div class="field"><label>Téléphone</label><input id="i-tel" value="${esc(u.telephone)}"></div>
          <div class="field"><label>E-mail</label><input value="${esc(sessionEmail())}" disabled style="opacity:.6"></div>
          <button class="btn" id="i-save">Enregistrer</button>`;
        $("#i-save").addEventListener("click", async ()=>{
          try{ await API.post("/auth/me", {prenom: $("#i-prenom").value, nom: $("#i-nom").value, telephone: $("#i-tel").value});
            toast("Informations enregistrées"); }catch(err){ toast(err.message); }
        });
      },
      orders(){
        const ords = me.orders.slice().reverse();
        $("#acc-panel").innerHTML = `<h2 class="serif">Mes commandes</h2>` + (ords.length ? ords.map(o=>`
          <div class="order-card">
            <div class="top"><span>Commande ${esc(o.ref)}</span><span>${esc(o.date)}</span><span class="status">Statut : ${esc(o.statut)}</span></div>
            ${o.items.map(it=> `<p style="font-size:13px;color:var(--brown-2)">${esc(it.nom)} — ${MS_UTILS.fmt(it.prix)} × ${it.qty}</p>`).join("")}
            <p style="margin-top:10px;font-size:14px"><b style="font-weight:400">Total : ${MS_UTILS.fmt(o.total)}</b></p>
          </div>`).join("") : `<p class="lead">Aucune commande pour le moment.</p>`);
      },
      favs(){
        const f = favs().map(MS_UTILS.byId).filter(Boolean);
        $("#acc-panel").innerHTML = `<h2 class="serif">Mes favoris</h2>` + (f.length ?
          `<div class="prod-grid three" style="gap:18px">${f.map(cardHTML).join("")}</div>` :
          `<p class="lead">Aucun favori pour le moment — parcourez la boutique et touchez le cœur ♡.</p>`);
        bindCards($("#acc-panel"));
      },
      addr(){
        $("#acc-panel").innerHTML = `
          <h2 class="serif">Mes adresses</h2>
          <div class="field"><label>Nouvelle adresse (commune, quartier, repère)</label><textarea id="a-new" style="min-height:80px"></textarea></div>
          <button class="btn" id="a-add">Ajouter</button>
          <div style="margin-top:24px">${(u.adresses||[]).map((a,i)=>`<p style="padding:12px 0;border-top:1px solid var(--line);font-size:13.5px;color:var(--brown-2)">${esc(a)} <button class="rm" data-del="${i}" style="float:right">Supprimer</button></p>`).join("") || `<p class="lead" style="margin-top:18px">Aucune adresse enregistrée.</p>`}</div>`;
        $("#a-add").addEventListener("click", async ()=>{
          const v = $("#a-new").value.trim(); if(!v) return;
          try{ await API.post("/auth/me", {adresses: (u.adresses||[]).concat([v])}); toast("Adresse ajoutée"); drawDash(); }catch(err){ toast(err.message); }
        });
        $$("[data-del]").forEach(b=> b.addEventListener("click", async ()=>{
          const list = (u.adresses||[]).filter((_,i)=> i !== parseInt(b.dataset.del,10));
          await API.post("/auth/me", {adresses: list}); drawDash();
        }));
      },
      pwd(){
        $("#acc-panel").innerHTML = `
          <h2 class="serif">Modifier mon mot de passe</h2>
          <div class="field"><label>Mot de passe actuel</label><input type="password" id="p-old"></div>
          <div class="field"><label>Nouveau mot de passe</label><input type="password" id="p-new" minlength="6"></div>
          <button class="btn" id="p-save">Mettre à jour</button>`;
        $("#p-save").addEventListener("click", async ()=>{
          try{ await API.post("/auth/password", {old: $("#p-old").value, new: $("#p-new").value});
            toast("Mot de passe mis à jour"); panels.pwd(); }catch(err){ toast(err.message); }
        });
      }
    };
    panels.infos();
  }
}

/* ---------- Contact ---------- */
function initContact(){
  const c = MS.config;
  const wa = $("#wa-link"); if(wa) wa.href = MS_UTILS.waLink();
  const ml = $("#mail-link"); if(ml){ ml.href = "mailto:" + c.email; ml.textContent = c.email; }
  const tt = $("#tel-txt"); if(tt) tt.textContent = c.telephone;
  const ig = $("#ig-link"); if(ig) ig.href = c.instagram;
  const fb = $("#fb-link"); if(fb) fb.href = c.facebook;
  const tk = $("#tt-link"); if(tk) tk.href = c.tiktok;
  const f = $("#contact-form");
  if(!f) return;
  f.addEventListener("submit", async e=>{
    e.preventDefault();
    for(const id of ["c-nom","c-mail","c-msg"]){
      const el = $("#"+id);
      if(!el.value.trim()){ el.focus(); el.style.borderColor = "#C4756A"; toast("Merci de compléter le formulaire"); return; }
      el.style.borderColor = "";
    }
    try{
      await API.post("/contact", {nom: $("#c-nom").value.trim(), contact: $("#c-mail").value.trim(),
        sujet: $("#c-sujet").value, message: $("#c-msg").value.trim()});
      f.outerHTML = `<div class="form-conf reveal visible">Merci pour votre message.<br>MARSON SENSUALITY vous répondra dans les meilleurs délais.</div>`;
    }catch(err){ toast(err.message); }
  });
}

/* ============================================================ DÉMARRAGE */
document.addEventListener("DOMContentLoaded", async ()=>{
  try{ await MS.load(); }
  catch(e){ document.body.insertAdjacentHTML("afterbegin", `<div class="announce"><span class="on">Le serveur est injoignable — lancez : python3 backend/server.py</span></div>`); return; }
  initPixel();
  mountChrome(); mountFooter(); mountSearch(); mountDrawer(); renderCart();
  bindCards(document);
  document.addEventListener("click", e=>{
    const b = e.target.closest("[data-add]");
    if(b) addToCart(b.dataset.add, parseInt(b.dataset.qty || "1", 10));
  });
  const page = document.body.dataset.page;
  if(page === "home") initHome();
  if(page === "boutique") initBoutique();
  if(page === "collections") initCollections();
  if(page === "produit") initProduit();
  if(page === "commande") initCommande();
  if(page === "compte") initCompte();
  if(page === "contact") initContact();
  const legalMail = $("#mail-legal"); if(legalMail){ legalMail.href = "mailto:" + MS.config.email; legalMail.textContent = MS.config.email; }
  const nl = $("#newsletter-form");
  if(nl) nl.addEventListener("submit", async e=>{
    e.preventDefault();
    const em = $("#newsletter-email").value.trim();
    if(!/.+@.+\..+/.test(em)){ toast("Veuillez saisir un e-mail valide"); return; }
    try{ await API.post("/newsletter", {email: em});
      nl.innerHTML = `<p class="conf">Merci — vous entrez dans l'univers MARSON SENSUALITY.</p>`;
      toast("Inscription confirmée");
    }catch(err){ toast(err.message); }
  });
  mountReveal();
  if(window.__observeReveal) window.__observeReveal();
});
})();
