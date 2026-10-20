"use strict";
// Demo autónoma: catálogo y precios ilustrativos. Sin procesar pagos ni pedidos.
const products=[
{id:"clasico",name:"Café Los Monchos Clásico",type:"Clásico",kind:"cafe",tag:"MÁS ELEGIDO",weight:"340 g",price:32900,color:"#43533b",ink:"#faf3df"},
{id:"origen",name:"Café de Origen",type:"Origen",kind:"cafe",tag:"DE ORIGEN",weight:"340 g",price:38900,color:"#d1ba93",ink:"#273322"},
{id:"especial",name:"Selección Especial",type:"Especial",kind:"especial",tag:"SELECCIÓN",weight:"340 g",price:45900,color:"#58472d",ink:"#fff5de"},
{id:"reserva",name:"Reserva Los Monchos",type:"Reserva",kind:"especial",tag:"EDICIÓN ESPECIAL",weight:"340 g",price:48900,color:"#283b35",ink:"#f1e3c9"},
{id:"descafeinado",name:"Café Descafeinado",type:"Suave",kind:"cafe",tag:"SUAVE",weight:"340 g",price:35900,color:"#b78d66",ink:"#fff5e7"},
{id:"intenso",name:"Café Intenso",type:"Intenso",kind:"cafe",tag:"INTENSO",weight:"340 g",price:34900,color:"#473122",ink:"#fff4df"},
{id:"kit",name:"Kit para Compartir",type:"Compartir",kind:"kit",tag:"PARA REGALAR",weight:"2 × 340 g",price:72900,color:"#607156",ink:"#fff5df"},
{id:"degustacion",name:"Kit Degustación",type:"Descubrir",kind:"kit",tag:"EDICIÓN REGALO",weight:"3 muestras",price:59900,color:"#79705e",ink:"#fff5e0"}];
const byId=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);
let cart=[],filter="todos",selected=null,toastTimer;
function bag(p){return '<div class="coffee-bag" style="--bag:'+p.color+';--bagText:'+p.ink+'" aria-hidden="true"><div class="bag-flower">✳</div><div class="bag-brand">LOS<br>MONCHOS</div><div class="bag-sub">C A F É</div><div class="bag-line"></div><div class="bag-type">'+p.type+'</div><div class="bag-weight">'+p.weight+'</div></div>'}
function toast(s){const n=byId("toast");n.textContent=s;n.classList.add("visible");clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove("visible"),3000)}
function render(){byId("productGrid").innerHTML=products.filter(p=>filter==="todos"||p.kind===filter).map(p=>'<article class="product-card"><div class="product-media" tabindex="0" role="button" data-product="'+p.id+'" aria-label="Ver '+p.name+'"><span class="product-tag">'+p.tag+'</span>'+bag(p)+'<button class="quick-add" data-add="'+p.id+'" aria-label="Agregar '+p.name+'">+</button></div><div class="product-info"><h3>'+p.name+'</h3><p class="product-meta">'+p.weight+' · Selección ilustrativa</p><div class="price">Desde '+money(p.price)+'</div></div></article>').join("")}
function setFilter(next){filter=next;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x.dataset.filter===next));render()}
function openProduct(id){const p=products.find(x=>x.id===id);if(!p)return;selected=p;
  const html='<div class="dialog-grid"><div class="dialog-photo">'+bag(p)+'</div><div class="dialog-info"><p class="eyebrow">CAFÉ LOS MONCHOS</p><h2>'+p.name+'</h2><p>Propuesta de producto de Café Los Monchos. El catálogo definitivo será definido con el cliente.</p><label for="variantSize">Presentación</label><select id="variantSize"><option value="340">340 g</option><option value="500">500 g</option><option value="1000">1.000 g</option></select><label for="variantGrind">Molienda</label><select id="variantGrind"><option value="Grano">En grano</option><option value="Fina">Fina</option><option value="Media">Media</option><option value="Gruesa">Gruesa</option></select><span class="price" id="variantPrice">'+money(p.price)+'</span><button class="btn btn-dark full" id="addSelected">Agregar al carrito <span>+</span></button><p style="font-size:11px">Demostración sin venta real.</p></div></div>';
  byId("productDialogContent").innerHTML=html;byId("productDialog").showModal();
  byId("variantSize").addEventListener("change",()=>{const v=Number(byId("variantSize").value);byId("variantPrice").textContent=money(v===340?p.price:Math.round(p.price*(v===500?1.45:2.55)))});
  byId("addSelected").addEventListener("click",()=>{const v=Number(byId("variantSize").value);add(p,v,byId("variantGrind").value);byId("productDialog").close();openCart()});
}
function add(p,size=340,grind="Grano"){const key=p.id+"-"+size+"-"+grind,price=size===340?p.price:Math.round(p.price*(size===500?1.45:2.55));const item=cart.find(i=>i.key===key);if(item)item.qty++;else cart.push({key:key,name:p.name,size:size,grind:grind,price:price,color:p.color,qty:1});renderCart();toast("Agregado al carrito de demostración")}
function renderCart(){const count=cart.reduce((s,i)=>s+i.qty,0);byId("cartCount").textContent=count;byId("drawerCount").textContent="("+count+")";byId("cartTotal").textContent=money(cart.reduce((s,i)=>s+i.price*i.qty,0));byId("cartItems").innerHTML=cart.length?cart.map(i=>'<div class="cart-item"><div class="cart-item-preview" style="color:'+i.color+'"><span>✳</span></div><div class="cart-item-info"><strong>'+i.name+'</strong><small>'+i.size+' g · '+i.grind+' · Cantidad '+i.qty+'</small><strong>'+money(i.price*i.qty)+'</strong><button data-remove="'+i.key+'">Quitar</button></div></div>').join(""):'<div class="empty-cart">Tu carrito está vacío.<br>Descubre tu próximo café favorito.</div>'}
function openCart(){byId("overlay").hidden=false;byId("cartDrawer").classList.add("open");byId("cartDrawer").setAttribute("aria-hidden","false");document.body.style.overflow="hidden"}
function closeCart(){byId("cartDrawer").classList.remove("open");byId("cartDrawer").setAttribute("aria-hidden","true");byId("overlay").hidden=true;document.body.style.overflow=""}
document.addEventListener("click",e=>{const ad=e.target.closest("[data-add]");if(ad){e.stopPropagation();const p=products.find(p=>p.id===ad.dataset.add);if(p)add(p);return}const pd=e.target.closest("[data-product]");if(pd){openProduct(pd.dataset.product);return}const rm=e.target.closest("[data-remove]");if(rm){cart=cart.filter(i=>i.key!==rm.dataset.remove);renderCart();return}const f=e.target.closest("[data-filter]");if(f){setFilter(f.dataset.filter);return}const cat=e.target.closest("[data-category]");if(cat){setFilter(cat.dataset.category);return}if(e.target.closest("[data-demo-link]")){e.preventDefault();toast("Sección pendiente de configurar con el cliente")}});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeCart();if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-product]")){e.preventDefault();openProduct(e.target.dataset.product)}});
byId("cartTrigger").addEventListener("click",openCart);byId("closeCart").addEventListener("click",closeCart);byId("overlay").addEventListener("click",closeCart);
byId("closeProduct").addEventListener("click",()=>byId("productDialog").close());
byId("productDialog").addEventListener("click",e=>{if(e.target===byId("productDialog"))byId("productDialog").close()});
byId("fakeCheckout").addEventListener("click",()=>toast("No hay pagos ni servicios Shopify activos en esta demostración"));
byId("newsletterForm").addEventListener("submit",e=>{e.preventDefault();toast("Demostración: no guardamos correos");e.target.reset()});
byId("searchTrigger").addEventListener("click",()=>{setFilter("todos");byId("cafes").scrollIntoView({behavior:"smooth"});toast("Explora el catálogo de demostración")});
byId("showAllProducts").addEventListener("click",()=>setFilter("todos"));
byId("menuTrigger").addEventListener("click",()=>document.querySelector(".desktop-nav").classList.toggle("open"));
document.querySelectorAll(".desktop-nav a").forEach(a=>a.addEventListener("click",()=>document.querySelector(".desktop-nav").classList.remove("open")));
byId("year").textContent=new Date().getFullYear();
render();renderCart();
