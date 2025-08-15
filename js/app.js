import { supabase } from './supabaseClient.js';

// --- UI helpers ---
const qs = (s) => document.querySelector(s);
const show = (id) => qs(id).classList.remove('hidden');
const hide = (id) => qs(id).classList.add('hidden');
const setActiveTab = (btnId, sectionIds) => {
  document.querySelectorAll('button.tab').forEach(b => b.classList.remove('active'));
  qs(btnId).classList.add('active');
  ['#dashboard-section','#products-section','#moves-section'].forEach(sel => hide(sel));
  sectionIds.forEach(sel => show(sel));
};

// Tabs
qs('#btn-dashboard').onclick = () => setActiveTab('#btn-dashboard', ['#dashboard-section']);
qs('#btn-products').onclick = () => setActiveTab('#btn-products', ['#products-section']);
qs('#btn-moves').onclick = () => setActiveTab('#btn-moves', ['#moves-section']);

// Auth state
let currentUser = null;
let currentWorkspace = localStorage.getItem('ws') || null;

async function init(){
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user;
  if(!user){
    show('#login-section'); return;
  }
  hide('#login-section');
  // Ver se já tem workspace do usuário (owner ou membro)
  const { data: w1 } = await supabase.from('workspaces').select('id,name').eq('owner', user.id);
  const { data: w2 } = await supabase.from('members').select('workspace_id').eq('user_id', user.id);
  let ws = currentWorkspace || (w1 && w1[0]?.id) || (w2 && w2[0]?.workspace_id);
  if(!ws){
    show('#onboarding-section'); return;
  }
  currentWorkspace = ws; localStorage.setItem('ws', ws);
  await loadDashboard();
  await loadProducts();
  await loadMoveProducts();
  show('#dashboard-section');
}

qs('#send-link').onclick = async () => {
  const email = qs('#email').value.trim();
  if(!email) return;
  const { error } = await supabase.auth.signInWithOtp({ email });
  qs('#login-info').textContent = error ? error.message : 'Link enviado! Verifique seu e-mail.';
};

qs('#create-ws').onclick = async () => {
  const name = qs('#ws-name').value.trim();
  if(!name) return;
  const u = (await supabase.auth.getUser()).data.user;
  const { data, error } = await supabase.from('workspaces').insert({ name, owner: u.id }).select().single();
  if(error){ qs('#onb-info').textContent = error.message; return; }
  localStorage.setItem('ws', data.id);
  hide('#onboarding-section');
  currentWorkspace = data.id;
  await loadDashboard(); await loadProducts(); await loadMoveProducts();
  show('#dashboard-section');
};

qs('#btn-logout').onclick = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('ws');
  location.reload();
};

// Products
async function loadProducts(){
  const ws = currentWorkspace;
  const { data: prods } = await supabase.from('products').select('*').eq('workspace_id', ws).order('created_at', { ascending:false });
  const { data: stock } = await supabase.from('v_product_stock').select('*').eq('workspace_id', ws);
  const map = new Map((stock||[]).map(s => [s.product_id, Number(s.current_qty||0)]));
  const body = qs('#products-body'); body.innerHTML='';
  (prods||[]).forEach(p => {
    const qty = map.get(p.id)||0;
    const tr = document.createElement('tr');
    if(qty <= Number(p.min_qty||0)) tr.classList.add('low');
    tr.innerHTML = `<td>${p.name}</td><td>${p.sku||''}</td><td>${qty}</td><td>${p.min_qty||0}</td>`;
    body.appendChild(tr);
  });
}

qs('#add-product').onclick = async () => {
  const ws = currentWorkspace;
  const name = qs('#p-name').value.trim();
  if(!name) return;
  const sku = qs('#p-sku').value.trim() || null;
  const cost = Number(qs('#p-cost').value||0);
  const price = Number(qs('#p-price').value||0);
  const min_qty = Number(qs('#p-min').value||0);
  await supabase.from('products').insert([{ workspace_id: ws, name, sku, cost, price, min_qty }]);
  qs('#p-name').value=''; qs('#p-sku').value=''; qs('#p-cost').value=''; qs('#p-price').value=''; qs('#p-min').value='';
  await loadProducts(); await loadDashboard(); await loadMoveProducts();
};

// Moves
async function loadMoveProducts(){
  const ws = currentWorkspace;
  const { data } = await supabase.from('products').select('id,name').eq('workspace_id', ws).order('name');
  const sel = qs('#mv-product'); sel.innerHTML = '<option value="">Selecione o produto</option>';
  (data||[]).forEach(p => {
    const opt = document.createElement('option'); opt.value=p.id; opt.textContent=p.name; sel.appendChild(opt);
  });
}

qs('#save-move').onclick = async () => {
  const ws = currentWorkspace;
  const product_id = qs('#mv-product').value;
  const kind = qs('#mv-kind').value;
  const qty = Number(qs('#mv-qty').value);
  const note = qs('#mv-note').value;
  const u = (await supabase.auth.getUser()).data.user;
  if(!product_id || qty<=0){ qs('#mv-info').textContent = 'Preencha os campos.'; return; }
  const { error } = await supabase.from('stock_moves').insert([{ workspace_id: ws, product_id, kind, qty, note, created_by: u.id }]);
  if(error){ qs('#mv-info').textContent = error.message; return; }
  qs('#mv-info').textContent = 'Lançado!';
  await loadProducts(); await loadDashboard();
};

// Dashboard
async function loadDashboard(){
  const ws = currentWorkspace;
  const { data: prods } = await supabase.from('products').select('id,name,min_qty').eq('workspace_id', ws);
  const { data: stock } = await supabase.from('v_product_stock').select('*').eq('workspace_id', ws);
  const map = new Map((stock||[]).map(s => [s.product_id, Number(s.current_qty||0)]));
  const container = qs('#low-stock'); container.innerHTML = '';
  (prods||[]).forEach(p => {
    const qty = map.get(p.id)||0;
    if(qty <= Number(p.min_qty||0)){
      const div = document.createElement('div');
      div.textContent = `${p.name} • estoque: ${qty} (mín: ${p.min_qty||0})`;
      container.appendChild(div);
    }
  });
}

init();
