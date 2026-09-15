const state = { data: null, page: "dashboard" };

const $ = s => document.querySelector(s);
const money = n => new Intl.NumberFormat("es-UY", {style:"currency", currency:"UYU", maximumFractionDigits:0}).format(n);
const dateFmt = s => new Date(s + "T12:00:00").toLocaleDateString("es-UY", {day:"2-digit",month:"2-digit",year:"numeric"});
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

async function api(action, options={}) {
  const r = await fetch(`api.php?action=${action}${options.query||""}`, {
    method: options.method || "GET",
    headers: {"Content-Type":"application/json"},
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "No se pudo completar la operación.");
  return j;
}
async function refresh() { state.data = await api("state"); render(); }

function status(p) {
  if (p.stock <= 0) return ["danger","Sin stock"];
  if (p.stock <= p.minStock) return ["warning","Stock bajo"];
  return ["ok","Stock OK"];
}
function metrics() {
  const d=state.data, active=d.products.filter(p=>p.active), low=d.products.filter(p=>p.active&&p.stock>0&&p.stock<=p.minStock);
  const out=d.products.filter(p=>p.active&&p.stock===0);
  const today="2026-09-15";
  return {
    products:active.length, revenue:d.sales.filter(s=>s.date===today).reduce((a,s)=>a+s.total,0),
    low:low.length, out:out.length, pending:d.orders.filter(o=>o.status!=="Recibido").length
  };
}
function shell(title, number, content) {
  $("#section-number").textContent=`${number} / CONTROL`;
  $("#page-title").textContent=title;
  return content;
}
function render() {
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===state.page));
  const pages={dashboard:["Inicio","01"],products:["Productos","02"],sales:["Ventas","03"],orders:["Órdenes de compra","04"],alerts:["Alertas","05"]};
  const [title,num]=pages[state.page];
  let html = state.page==="dashboard"?dashboard():state.page==="products"?products():state.page==="sales"?sales():state.page==="orders"?orders():alerts();
  $("#app").innerHTML=shell(title,num,html);
  bindPage();
}

function dashboard(){
  const d=state.data,m=metrics();
  const latest=d.sales.slice(0,5);
  const revenue={};
  d.sales.forEach(s=>revenue[s.product]=(revenue[s.product]||0)+s.total);
  const top=Object.entries(revenue).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const max=top[0]?.[1]||1;
  const alert=m.low+m.out;
  return `<div class="metrics">
    ${metric("Productos activos",m.products,"cat")}
    ${metric("Ventas del día",money(m.revenue),"money")}
    ${metric("Stock bajo",m.low,"warn")}
    ${metric("Sin stock",m.out,"danger")}
    ${metric("Órdenes pendientes",m.pending,"pending")}
  </div>
  <div class="dashboard-grid">
    <section class="panel">
      <div class="panel-head"><div><span class="eyebrow">ACTIVIDAD</span><h2>Últimas ventas</h2></div><button class="text-btn" data-go="sales">Ver historial →</button></div>
      ${saleTable(latest,false)}
    </section>
    <aside class="panel top-products"><div class="panel-head"><div><span class="eyebrow">REVENUE</span><h2>Más vendidos</h2></div></div>
      ${top.map(([name,val],i)=>`<div class="top-row"><div class="rank">${String(i+1).padStart(2,"0")}</div><div class="top-info"><div><strong>${esc(name)}</strong><span>${money(val)}</span></div><div class="progress"><i style="width:${Math.round(val/max*100)}%"></i></div></div></div>`).join("")}
    </aside>
  </div>
  ${alert?`<button class="alert-strip" data-go="alerts"><span>!</span><strong>Atención:</strong> hay ${m.out?m.out+" producto(s) sin stock":""}${m.out&&m.low?" y ":""}${m.low?m.low+" producto(s) con stock bajo":""}. <u>Revisar alertas →</u></button>`:""}
  `;
}
function metric(label,val,kind){return `<div class="metric"><span class="eyebrow">${label}</span><strong class="${kind}">${val}</strong></div>`}
function saleTable(rows, full=true){
  if(!rows.length)return `<div class="empty">No hay ventas para mostrar.</div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Producto</th>${full?"<th>Cajero</th>":""}<th>Cantidad</th><th>Total</th><th>Fecha</th></tr></thead><tbody>${rows.map(s=>`<tr><td><strong>${esc(s.product)}</strong></td>${full?`<td>${esc(s.cashier)}</td>`:""}<td class="mono">${s.quantity}</td><td class="mono">${money(s.total)}</td><td class="mono">${dateFmt(s.date)}</td></tr>`).join("")}</tbody></table></div>`;
}

function products(){
  const cats=[...new Set(state.data.products.map(p=>p.category))];
  return `<div class="toolbar"><div class="filters"><input id="p-search" placeholder="Buscar producto…"><select id="p-cat"><option value="">Todas las categorías</option>${cats.map(c=>`<option>${esc(c)}</option>`).join("")}</select><select id="p-active"><option value="all">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select></div><button class="primary" id="new-product-inline">+ Nuevo producto</button></div>
  <section class="panel"><div class="table-wrap"><table id="products-table"><thead><tr><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock actual</th><th>Stock mínimo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody></tbody></table></div></section>`;
}
function renderProductRows(){
  const q=($("#p-search")?.value||"").toLowerCase(), cat=$("#p-cat")?.value||"", act=$("#p-active")?.value||"all";
  const rows=state.data.products.filter(p=>(!q||p.name.toLowerCase().includes(q))&&(!cat||p.category===cat)&&(act==="all"||(act==="active"&&p.active)||(act==="inactive"&&!p.active)));
  $("#products-table tbody").innerHTML=rows.map(p=>{const [cl,tx]=status(p);return `<tr class="${p.active?"":"muted"}"><td><strong>${esc(p.name)}</strong>${!p.active?'<small>Inactivo</small>':""}</td><td>${esc(p.category)}</td><td class="mono">${money(p.price)}</td><td class="mono">${p.stock}</td><td class="mono">${p.minStock}</td><td><span class="badge ${cl}">${tx}</span></td><td><div class="row-actions"><button class="small primary" data-sell="${p.id}" ${!p.active||p.stock===0?"disabled":""}>Vender</button><button class="small" data-edit="${p.id}">Editar</button><button class="small ghost" data-toggle="${p.id}">${p.active?"Desactivar":"Activar"}</button></div></td></tr>`}).join("")||`<tr><td colspan="7"><div class="empty">No se encontraron productos.</div></td></tr>`;
}
function sales(){
  return `<div class="toolbar"><div class="filters"><label>Desde <input type="date" id="s-from" value="2026-09-05"></label><label>Hasta <input type="date" id="s-to" value="2026-09-15"></label><input id="s-search" placeholder="Producto o cajero…"></div></div>
  <div id="sales-content"></div>`;
}
function renderSales(){
  const from=$("#s-from")?.value||"",to=$("#s-to")?.value||"",q=($("#s-search")?.value||"").toLowerCase();
  const rows=state.data.sales.filter(s=>(!from||s.date>=from)&&(!to||s.date<=to)&&(!q||s.product.toLowerCase().includes(q)||s.cashier.toLowerCase().includes(q)));
  const revenue=rows.reduce((a,s)=>a+s.total,0), units=rows.reduce((a,s)=>a+s.quantity,0);
  const grouped={}; rows.forEach(s=>(grouped[s.date]??=[]).push(s));
  $("#sales-content").innerHTML=`<div class="metrics compact">${metric("Total recaudado",money(revenue),"money")}${metric("Transacciones",rows.length,"cat")}${metric("Unidades vendidas",units,"cat")}</div><section class="panel">${Object.keys(grouped).sort().reverse().map(day=>`<div class="date-group"><h3>${dateFmt(day)}</h3>${saleTable(grouped[day],true)}</div>`).join("")||'<div class="empty">No hay ventas en este período.</div>'}</section>`;
}
function orders(){
  const received=state.data.orders.filter(o=>o.status==="Recibido"),pending=state.data.orders.filter(o=>o.status!=="Recibido");
  return `<div class="metrics compact">${metric("Total invertido",money(received.reduce((a,o)=>a+o.total,0)),"money")}${metric("Pendientes",pending.length,"warn")}${metric("Total órdenes",state.data.orders.length,"cat")}</div><div class="orders-list">${state.data.orders.map(o=>`<section class="order-card"><button class="order-head" data-expand="${o.id}"><div><span class="eyebrow">${esc(o.number)}</span><h2>${esc(o.supplier)}</h2></div><div class="order-meta"><span>${o.items.length} productos</span><span>${dateFmt(o.date)}</span><strong class="mono">${money(o.total)}</strong><span class="badge ${o.status==="Recibido"?"ok":o.status==="Parcial"?"warning":"danger"}">${o.status}</span><b>⌄</b></div></button><div class="order-body" id="order-${o.id}"><div class="table-wrap"><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Costo unitario</th><th>Subtotal</th></tr></thead><tbody>${o.items.map(i=>`<tr><td><strong>${esc(i.product)}</strong></td><td class="mono">${i.quantity}</td><td class="mono">${money(i.unitCost)}</td><td class="mono">${money(i.quantity*i.unitCost)}</td></tr>`).join("")}</tbody></table></div>${o.status!=="Recibido"?`<button class="primary receive" data-receive="${o.id}">Marcar como recibido</button>`:"<span class='received-note'>✓ Stock actualizado al recibir esta orden</span>"}</div></section>`).join("")}</div>`;
}
function alerts(){
  const ps=state.data.products.filter(p=>p.active);
  const out=ps.filter(p=>p.stock===0), low=ps.filter(p=>p.stock>0&&p.stock<=p.minStock), ok=ps.filter(p=>p.stock>p.minStock);
  return `<div class="metrics compact">${metric("Sin stock",out.length,"danger")}${metric("Stock bajo",low.length,"warn")}${metric("Stock OK",ok.length,"ok")}</div><div class="alerts-grid"><section><div class="section-label danger-text">SIN STOCK</div>${out.map(alertCard).join("")||emptyAlert("No hay productos sin stock.")}</section><section><div class="section-label warning-text">STOCK BAJO</div>${low.map(alertCard).join("")||emptyAlert("No hay productos con stock bajo.")}</section></div>${(!out.length&&!low.length)?'<div class="all-good">✓ Todo en orden. No hay alertas de stock.</div>':""}`;
}
function alertCard(p){const pct=Math.min(100,Math.round(p.stock/Math.max(p.minStock,1)*100));return `<div class="alert-card"><div><strong>${esc(p.name)}</strong><span>${esc(p.category)}</span></div><div class="level"><div><span>${p.stock} / ${p.minStock}</span><span>${pct}%</span></div><div class="progress"><i style="width:${pct}%"></i></div></div><button class="small" data-go="orders">Ordenar compra</button></div>`}
function emptyAlert(t){return `<div class="empty small-empty">${t}</div>`}

function openProduct(id=null){
  const p=id?state.data.products.find(x=>x.id===id):{name:"",category:"Bebidas",price:0,stock:0,minStock:5,active:true};
  const cats=["Bebidas","Snacks","Limpieza","Lácteos","Panadería","Golosinas","Higiene"];
  $("#modal").innerHTML=`<div class="modal-head"><div><span class="eyebrow">${id?"EDITAR":"ALTA"}</span><h2>${id?"Editar producto":"Nuevo producto"}</h2></div><button class="close">×</button></div><form id="product-form"><input type="hidden" name="id" value="${id||""}"><label>Nombre<input name="name" required value="${esc(p.name)}"></label><label>Categoría<select name="category">${cats.map(c=>`<option ${c===p.category?"selected":""}>${c}</option>`).join("")}</select></label><div class="form-grid"><label>Precio<input name="price" type="number" min="0" step="1" required value="${p.price}"></label><label>Stock inicial<input name="stock" type="number" min="0" required value="${p.stock}"></label></div><label>Stock mínimo<input name="minStock" type="number" min="0" required value="${p.minStock}"></label><div class="modal-actions"><button type="button" class="small close">Cancelar</button><button class="primary">Guardar producto</button></div></form>`;
  showModal();
  $("#product-form").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{state.data=await api("save_product",{method:"POST",body:Object.fromEntries(f)});hideModal();toast("Producto guardado.");render();}catch(err){toast(err.message,true)}};
}
function openSell(id){
  const p=state.data.products.find(x=>x.id===id);
  $("#modal").innerHTML=`<div class="modal-head"><div><span class="eyebrow">VENTA</span><h2>${esc(p.name)}</h2></div><button class="close">×</button></div><form id="sell-form"><div class="stock-callout"><span>Disponible</span><strong class="mono">${p.stock} unidades</strong></div><label>Cantidad<input id="sell-qty" name="quantity" type="number" min="1" max="${p.stock}" value="1" required></label><label>Cajero<select name="cashier"><option>Laura M.</option><option>Carlos R.</option></select></label><div class="sale-total">Total <strong id="sell-total">${money(p.price)}</strong></div><div class="modal-actions"><button type="button" class="small close">Cancelar</button><button class="primary">Confirmar venta</button></div></form>`;
  showModal();
  const q=$("#sell-qty"), total=$("#sell-total"); q.oninput=()=>{q.value=Math.min(p.stock,Math.max(1,+q.value||1));total.textContent=money(p.price*q.value)};
  $("#sell-form").onsubmit=async e=>{e.preventDefault();try{state.data=await api("sell",{method:"POST",body:{productId:id,quantity:+q.value,cashier:e.target.cashier.value}});hideModal();toast("Venta registrada.");render();}catch(err){toast(err.message,true)}};
}
function showModal(){$("#modal-backdrop").classList.remove("hidden")}
function hideModal(){$("#modal-backdrop").classList.add("hidden")}
function toast(msg,error=false){const t=$("#toast");t.textContent=msg;t.className="toast show"+(error?" error":"");setTimeout(()=>t.className="toast",2600)}

function bindPage(){
  if(state.page==="products"){renderProductRows();["p-search","p-cat","p-active"].forEach(id=>$("#"+id)?.addEventListener("input",renderProductRows));$("#new-product-inline")?.addEventListener("click",()=>openProduct());}
  if(state.page==="sales"){["s-from","s-to","s-search"].forEach(id=>$("#"+id)?.addEventListener("input",renderSales));renderSales();}
  document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{state.page=b.dataset.go;render()});
  document.querySelectorAll("[data-sell]").forEach(b=>b.onclick=()=>openSell(+b.dataset.sell));
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>openProduct(+b.dataset.edit));
  document.querySelectorAll("[data-toggle]").forEach(b=>b.onclick=async()=>{try{state.data=await api("toggle_product",{query:`&id=${b.dataset.toggle}`});toast("Estado actualizado.");render()}catch(e){toast(e.message,true)}});
  document.querySelectorAll("[data-expand]").forEach(b=>b.onclick=()=>$("#order-"+b.dataset.expand).classList.toggle("open"));
  document.querySelectorAll("[data-receive]").forEach(b=>b.onclick=async()=>{if(!confirm("¿Marcar esta orden como recibida y sumar sus cantidades al stock?"))return;try{state.data=await api("receive_order",{query:`&id=${b.dataset.receive}`});toast("Orden recibida y stock actualizado.");render()}catch(e){toast(e.message,true)}});
}
document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>{state.page=b.dataset.page;render()});
$("#new-product").onclick=()=>openProduct();
$("#modal-backdrop").onclick=e=>{if(e.target.id==="modal-backdrop")hideModal()};
document.addEventListener("click",e=>{if(e.target.classList.contains("close"))hideModal()});
$("#today").textContent=new Date().toLocaleDateString("es-UY",{weekday:"short",day:"2-digit",month:"short"});
refresh();
