// js/auth.js (ESM)
import { supabase } from './supabaseClient.js';

// ---------------------- helpers de UI ----------------------
const $ = (id) => document.getElementById(id);
const show = (el) => (el.style.display = '');
const hide = (el) => (el.style.display = 'none');

function setText(el, msg) {
  el.textContent = msg || '';
}

function showLoggedOutUI() {
  // telas
  show($('login-section'));
  hide($('reset-section'));
  // se quiser, esconda as áreas internas até logar
  hide($('dashboard-section'));
  hide($('products-section'));
  hide($('moves-section'));
  // botão sair
  show($('btn-logout')); // manter visível? se preferir, pode esconder.
  // dica: se quiser esconder o sair quando deslogado, troque por: hide($('btn-logout'))
}

function showLoggedInUI() {
  hide($('login-section'));
  hide($('reset-section'));
  show($('dashboard-section'));
  // você decide o que mostrar por padrão
  // show($('products-section')); show($('moves-section'));
  show($('btn-logout'));
}

// ---------------------- ações de auth ----------------------
async function signInPassword() {
  const email = $('auth-email').value.trim();
  const password = $('auth-password').value;
  setText($('auth-msg'), 'Entrando...');

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    setText($('auth-msg'), `Erro: ${error.message}`);
    return;
  }
  setText($('auth-msg'), 'Logado!');
  showLoggedInUI();
}

async function signUpPassword() {
  const email = $('auth-email').value.trim();
  const password = $('auth-password').value;
  setText($('auth-msg'), 'Criando conta...');

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    setText($('auth-msg'), `Erro: ${error.message}`);
    return;
  }
  // Se "Confirm email" estiver ligado no Supabase, o usuário precisa confirmar o e-mail.
  setText($('auth-msg'), 'Conta criada! Agora entre com seu e-mail e senha.');
}

async function sendResetEmail() {
  const email = $('auth-email').value.trim();
  if (!email) {
    setText($('auth-msg'), 'Digite seu e-mail para recuperar a senha.');
    return;
  }
  setText($('auth-msg'), 'Enviando e-mail de recuperação...');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // quando o usuário clicar no link do e-mail, vai voltar para seu site
    // o Supabase acrescenta #type=recovery no hash
    redirectTo: window.location.origin,
  });
  setText($('auth-msg'), error ? `Erro: ${error.message}` : 'Verifique seu e-mail para redefinir a senha.');
}

async function submitNewPassword() {
  const newPassword = $('new-password').value;
  if (!newPassword) {
    setText($('reset-msg'), 'Digite a nova senha.');
    return;
  }
  setText($('reset-msg'), 'Atualizando senha...');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    setText($('reset-msg'), `Erro: ${error.message}`);
    return;
  }
  setText($('reset-msg'), 'Senha atualizada! Você já está logado.');
  showLoggedInUI();
}

async function signOut() {
  await supabase.auth.signOut();
  showLoggedOutUI();
}

// ---------------------- fluxo de recovery ----------------------
async function handleRecoveryFlowIfNeeded() {
  // o supabase retorna os parâmetros no hash (#)
  // ex: #access_token=...&type=recovery
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  const params = new URLSearchParams(hash);
  if (params.get('type') === 'recovery') {
    // Mostra tela para definir nova senha
    hide($('login-section'));
    show($('reset-section'));
  }
}

// ---------------------- boot ----------------------
window.addEventListener('DOMContentLoaded', async () => {
  // eventos
  $('btn-login')?.addEventListener('click', signInPassword);
  $('btn-register')?.addEventListener('click', signUpPassword);
  $('btn-forgot')?.addEventListener('click', sendResetEmail);
  $('btn-reset-submit')?.addEventListener('click', submitNewPassword);
  $('btn-logout')?.addEventListener('click', signOut);

  // se chegou via link de recovery
  await handleRecoveryFlowIfNeeded();

  // estado inicial baseado na sessão
  const { data: { session } } = await supabase.auth.getSession();
  if (session) showLoggedInUI();
  else showLoggedOutUI();

  // reage a mudanças de sessão (login/logout)
  supabase.auth.onAuthStateChange((_event, currentSession) => {
    if (currentSession) showLoggedInUI();
    else showLoggedOutUI();
  });
});
