// js/auth.js (ESM)
import { supabase } from './supabaseClient.js';

const $ = (id) => document.getElementById(id);

// === Ações ===
async function signInPassword() {
  const email = $('auth-email').value.trim();
  const password = $('auth-password').value;
  $('auth-msg').textContent = 'Entrando...';
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  $('auth-msg').textContent = error ? ('Erro: ' + error.message) : 'Logado!';
  if (!error) onLoggedIn();
}

async function signUpPassword() {
  const email = $('auth-email').value.trim();
  const password = $('auth-password').value;
  $('auth-msg').textContent = 'Criando conta...';
  const { error } = await supabase.auth.signUp({ email, password });
  $('auth-msg').textContent = error ? ('Erro: ' + error.message) : 'Conta criada! Faça login.';
}

async function sendResetEmail() {
  const email = $('auth-email').value.trim();
  $('auth-msg').textContent = 'Enviando e-mail de recuperação...';
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin
  });
  $('auth-msg').textContent = error ? ('Erro: ' + error.message) : 'Verifique seu e-mail para redefinir a senha.';
}

async function submitNewPassword() {
  const newPassword = $('new-password').value;
  $('reset-msg').textContent = 'Atualizando senha...';
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  $('reset-msg').textContent = error ? ('Erro: ' + error.message) : 'Senha atualizada! Você já está logado.';
  if (!error) onLoggedIn();
}

async function signOut() {
  await supabase.auth.signOut();
  $('btn-logout').style.display = 'none';
  showLoggedOutUI();
}

// === Fluxos de tela ===
function showLoggedOutUI() {
  $('login-section').style.display = 'block';
  $('reset-section').style.display = 'none';
}

async function onLoggedIn() {
  $('login-section').style.display = 'none';
  $('reset-section').style.display = 'none';
  $('btn-logout').style.display = 'inline-block';
  // aqui você chama suas funções de dados (ex.: loadDashboard, loadProducts, etc.)
}

// Se chegou via link de recovery (reset de senha)
async function handleRecoveryFlowIfNeeded() {
  const params = new URLSearchParams(window.location.hash.replace('#', '?'));
  if (params.get('type') === 'recovery') {
    $('login-section').style.display = 'none';
    $('reset-section').style.display = 'block';
  }
}

// === Eventos ===
window.addEventListener('DOMContentLoaded', async () => {
  $('btn-login')?.addEventListener('click', signInPassword);
  $('btn-register')?.addEventListener('click', signUpPassword);
  $('btn-forgot')?.addEventListener('click', sendResetEmail);
  $('btn-logout')?.addEventListener('click', signOut);
  $('btn-reset-submit')?.addEventListener('click', submitNewPassword);

  await handleRecoveryFlowIfNeeded();

  const { data: { session } } = await supabase.auth.getSession();
  if (session) onLoggedIn(); else showLoggedOutUI();
});
