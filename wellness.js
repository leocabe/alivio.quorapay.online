/* Perfil remoto e fotografias: dados pessoais permanecem apenas em memória. */
const cloud = { client: null, user: null, profile: null, weights: [], photos: [], busy: false, ready: false, error: '', contact: null, authMode: 'first', accessDraft: {}, pendingSession: null };
function cloudField(label, name, value, attrs = '') {
  return `<label class="well-field">${label}<input name="${name}" value="${esc(value ?? '')}" ${attrs} required></label>`;
}
function cloudPanel() {
  if (!cloud.client) return `<div class="pgroup"><h2 class="h3">Mi evolución</h2><p>La conexión con la cuenta aún está en preparación. Muy pronto podrá guardar su perfil, peso y fotos privadas.</p></div>`;
  if (!cloud.ready) return `<div class="pgroup">Cargando su cuenta…</div>`;
  if (!cloud.user || cloud.user.is_anonymous) return accessPanel();
  const p = cloud.profile || cloud.accessDraft || {};
  const current = cloud.weights[0]?.weight ?? p.initial_weight;
  return `<div class="pgroup"><div class="row"><h2 class="h3">Mi seguimiento</h2><button class="btn soft sm" data-cloud-action="logout">Salir</button></div><p class="small muted">${esc(cloud.contact?.email || cloud.user.email || '')}</p>${cloud.user.is_anonymous ? `<p class="small muted" style="margin:12px 0">Acceso guardado en este navegador mientras mantenga la sesión.</p>` : ''}<p role="status">${esc(cloud.error)}</p>
  ${passwordPanel()}
  <form data-cloud="profile">${cloudField('Nombre','name', p.name, 'maxlength="80" autocomplete="name"')}
  ${cloudField('Edad','age', p.age, 'type="number" min="18" max="120" step="1"')}
  <div class="two">${cloudField('Peso inicial (kg)', 'initial_weight', p.initial_weight, 'type="number" min="30" max="400" step="0.1"')}${cloudField('Quiero perder (kg)', 'target_loss', p.target_loss, 'type="number" min="0" max="399" step="0.1"')}</div>
  <p class="small muted">Elija sus objetivos, gustos y restricciones abajo y guárdelos con este botón.</p><button class="btn olive" ${cloud.busy ? 'disabled' : ''}>Guardar perfil y preferencias</button></form>
  ${p.initial_weight ? `<div class="well-summary"><b>${Number(current).toFixed(1)} kg ahora</b><span>Inicial: ${p.initial_weight} kg · Objetivo: ${(p.initial_weight - p.target_loss).toFixed(1)} kg</span><span>Variación:${(current - p.initial_weight).toFixed(1)} kg</span></div>
  <form data-cloud="weight"><div class="two">${cloudField('Peso actual (kg)', 'weight', '', 'type="number" min="30" max="400" step="0.1"')}${cloudField('Fecha','date', localDate(), `type="date" max="${localDate()}"`)}</div><button class="btn soft" ${cloud.busy ? 'disabled' : ''}>Registrar peso</button></form><details><summary>Historial de peso</summary>${cloud.weights.map(w => `<p>${esc(w.recorded_on)} · ${w.weight} kg</p>`).join('') || '<p>Aún no hay registros.</p>'}</details>` : ''}
  <h3 class="h3" style="margin-top:24px">Mi espejo</h3><p class="small muted">Fotos privadas, visibles solo en su cuenta. Compare fotos con una pose y una luz similares.</p>
  <form data-cloud="photo">${cloudField('Fecha de la foto', 'date', localDate(), `type="date" max="${localDate()}"`)}<label class="well-field">Foto (JPEG, PNG o WebP, hasta 8 MB)<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required></label><button class="btn olive" ${cloud.busy ? 'disabled' : ''}>Guardar foto</button></form>
  ${cloud.photos.length > 1 ? `<div class="two">${['left','right'].map((side, i) => `<label class="well-field">${i ? 'Comparar con' : 'Primera foto'}<select data-compare="${side}">${cloud.photos.map((f, j) => `<option value="${j}" ${j === (i ? cloud.photos.length - 1 : 0) ? 'selected' : ''}>${esc(f.name.slice(0,10))} · ${j + 1}</option>`).join('')}</select></label>`).join('')}</div><div class="well-photos">${[cloud.photos[0], cloud.photos.at(-1)].map((f,i) => `<img id="compare-${i ? 'right' : 'left'}" src="${esc(f.url)}" alt="Foto para comparar${i+1}">`).join('')}</div>` : ''}
  <div class="well-photos">${cloud.photos.map(f => `<figure><img src="${esc(f.url)}" alt="Evolución el${esc(f.name.slice(0,10))}" loading="lazy"><figcaption>${esc(f.name.slice(0,10))}</figcaption><button class="btn soft sm" data-cloud-action="delete" data-path="${esc(f.name)}">Eliminar foto</button></figure>`).join('') || '<p>Aún no hay fotos.</p>'}</div></div>`;
}
function accessPanel() {
 const login = cloud.authMode === 'login' && !cloud.user;
 const d = {...(cloud.profile || {}), ...cloud.accessDraft};
 const email = cloud.contact?.email || cloud.user?.user_metadata?.lead_email || d.email || '';
 return `<section class="access-card" aria-labelledby="access-title"><div class="access-intro"><span class="access-symbol">${ic('leaf')}</span><p class="eyebrow">Su espacio de bienestar</p><h1 id="access-title">Cada paso suyo<br><em>merece ser guardado.</em></h1><p>Inicie sesión con el email que usó en la compra. En el primer acceso, elija una contraseña para guardar su progreso y volver cuando quiera.</p><div class="access-benefits"><span>${ic('user')}Su perfil</span><span>${ic('camera')}Sus fotos</span><span>${ic('target')}Su evolución</span></div></div><div class="access-body">
 ${!cloud.user ? `<div class="access-tabs" aria-label="Tipo de acceso"><button type="button" data-cloud-mode="first" aria-pressed="${!login}" ${cloud.busy ? 'disabled' : ''}>Primer acceso</button><button type="button" data-cloud-mode="login" aria-pressed="${login}" ${cloud.busy ? 'disabled' : ''}>Ya tengo contraseña</button></div>` : '<p class="access-existing">Complete su acceso. Se mantendrá el progreso de esta sesión.</p>'}
 <h2 class="h3">${login ? '¡Qué bueno tenerla de vuelta!' : 'Empecemos por usted.'}</h2><p class="small muted">${login ? 'Entre con su email y la contraseña que eligió.' : 'Complételo una sola vez. Su acceso y su perfil se guardan automáticamente.'}</p>
 <form data-cloud="${login ? 'login' : 'access'}">
 ${!login ? cloudField('Nombre completo', 'name', d.name || st.name || '', 'autocomplete="name" maxlength="80"') : ''}
 ${cloudField('Email usado en la compra', 'email', email, `type="email" autocomplete="email" maxlength="254" ${cloud.user ? 'readonly' : ''}`)}
 ${cloudField(login ? 'Su contraseña' : 'Elija una contraseña', 'password', '', `type="password" minlength="${login ? 1 : 8}" autocomplete="${login ? 'current-password' : 'new-password'}"`)}
 ${!login ? `${cloudField('Confirme la contraseña', 'confirmation', '', 'type="password" minlength="8" autocomplete="new-password"')}<p class="small muted">Use al menos 8 caracteres.</p><div class="access-divider"><span>Su punto de partida</span></div>${cloudField('Edad','age', d.age, 'type="number" min="18" max="120" step="1"')}<div class="two">${cloudField('Peso actual (kg)', 'initial_weight', d.initial_weight, 'type="number" min="30" max="400" step="0.1"')}${cloudField('Quiero perder (kg)', 'target_loss', d.target_loss, 'type="number" min="0" max="399" step="0.1"')}</div>` : ''}
 ${cloud.error ? `<p class="access-error" role="alert">${esc(cloud.error)}</p>` : ''}
 <button class="btn olive block access-submit" ${cloud.busy ? 'disabled' : ''}>${cloud.busy ? 'Guardando…' : login ? 'Entrar a mi perfil' : 'Entrar y guardar mi progreso'}${ic('chev')}</button>
 <p class="access-footnote">${ic('lock')}La contraseña protege el acceso a sus datos y fotos.</p>
 </form></div></section>`;
}
function passwordPanel() { return ''; }
function localDate() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function vForYou() {
 const list = forYou().slice(0,24);
 return `<div class="pad" style="padding-top:28px"><h1 class="h1">Para usted</h1><p>Ideas según sus gustos y objetivos, respetando las restricciones seleccionadas.</p><div class="chips" style="margin:16px 0">${[...st.goals,...st.prefs,...st.restr].map(x => `<span class="chip on">${esc(x)}</span>`).join('')}</div><button class="btn soft sm" data-a="tab" data-tab="perfil">Ajustar mi perfil</button><p class="small muted" style="margin:16px 0">Las sugerencias no garantizan pérdida de peso, reducción de la hinchazón ni tratamiento de la inflamación. Los valores nutricionales son estimaciones.</p></div><div class="grid2">${list.map(card).join('') || '<p>No hay recetas para estas restricciones.</p>'}</div>`;
}
async function checked(promise) { const result = await promise; if (result.error) throw result.error; return result.data; }
async function loadCloud() {
 const uid = cloud.user.id;
 const [profile, weights, files, contact] = await Promise.all([
  checked(cloud.client.from('alivio_profiles').select('*').eq('user_id',uid).maybeSingle()),
  checked(cloud.client.from('alivio_weights').select('*').eq('user_id',uid).order('recorded_on',{ascending:false})),
  checked(cloud.client.storage.from('alivio-progress').list(uid,{limit:1000,sortBy:{column:'name',order:'asc'}})),
  checked(cloud.client.from('alivio_contacts').select('email').eq('user_id',uid).maybeSingle())
 ]);
 const photos = await Promise.all(files.map(async f => ({name:f.name,url:(await checked(cloud.client.storage.from('alivio-progress').createSignedUrl(`${uid}/${f.name}`,3600))).signedUrl})));
 if (cloud.user?.id !== uid) return;
 Object.assign(cloud,{profile,weights,photos,contact});
 if (profile) Object.assign(st,{goals:profile.goals,prefs:profile.prefs,restr:profile.restr});
}
function authError(error) {
 return ({invalid_credentials:'Email o contraseña incorrectos.',email_exists:'Este email ya tiene acceso. Entre con la contraseña que eligió antes. Se mantuvieron los datos de esta sesión.',user_already_exists:'Este email ya tiene acceso. Seleccione «Ya tengo contraseña» para entrar.',weak_password:'Elija una contraseña más segura, de al menos 8 caracteres.',email_not_confirmed:'Esta cuenta aún está pendiente de activación. Contacte con soporte.',email_provider_disabled:'El acceso con contraseña está en preparación. Inténtelo de nuevo más tarde.',manual_linking_disabled:'La creación de contraseña está en preparación. Inténtelo de nuevo más tarde.',over_request_rate_limit:'Espere un momento antes de volver a intentarlo.'})[error?.code] || 'No se pudo completar. Inténtelo de nuevo.';
}
async function enterWithPassword(email, password) {
 const result = await cloud.client.auth.signInWithPassword({email:email.trim(),password});
 if (result.error) { cloud.error = authError(result.error); return false; }
 if (!result.data?.session) { cloud.error = 'No se pudo iniciar la sesión.'; return false; }
 return true;
}
async function createPassword(password, confirmation) {
 if (!cloud.user) { cloud.error = 'Primero entre con su email.'; return false; }
 if (password.length < 8) { cloud.error = 'Use al menos 8 caracteres.'; return false; }
 if (password !== confirmation) { cloud.error = 'Las contraseñas no coinciden.'; return false; }
 const uid = cloud.user.id;
 const email = cloud.user.email || cloud.contact?.email || cloud.user.user_metadata?.lead_email;
 if (!email) { cloud.error = 'No se pudo cargar su email. Recargue la página.'; return false; }
 const cfg = window.ALIVIO_SUPABASE;
 const response = await fetch(cfg.url + '/auth/v1/settings', {headers:{apikey:cfg.publicKey}});
 if (!response.ok) throw Error('Configuración no disponible');
 const settings = await response.json();
 // Preserve the requested no-email-confirmation flow.
 if (!settings.external?.email || (cloud.user.is_anonymous && settings.mailer_autoconfirm !== true)) {
  cloud.error = 'La creación de contraseña está en preparación. Su progreso sigue guardado en esta sesión.';
  return false;
 }
 const result = await cloud.client.auth.updateUser(cloud.user.is_anonymous ? {email,password} : {password});
 if (result.error) { cloud.error = authError(result.error); return false; }
 const user = result.data?.user;
 if (!user || user.id !== uid || user.is_anonymous || !user.email_confirmed_at) {
  cloud.error = 'No se pudo confirmar la activación. Mantenga esta sesión abierta e inténtelo de nuevo.';
  return false;
 }
 // Same user ID: profile, weight records and storage paths keep their owner.
 cloud.user = user;
 cloud.contact = {email:user.email};
 return true;
}
async function activateAccess(data) {
 const p = {name:String(data.get('name') || '').trim(),email:String(data.get('email') || '').trim(),age:Number(data.get('age')),initial_weight:Number(data.get('initial_weight')),target_loss:Number(data.get('target_loss'))};
 cloud.accessDraft = p; // No passwords in state or local storage.
 const password = String(data.get('password') || '');
 if (!p.name || p.name.length > 80 || p.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) || !Number.isInteger(p.age) || p.age < 18 || p.age > 120 || !Number.isFinite(p.initial_weight) || p.initial_weight < 30 || p.initial_weight > 400 || !Number.isFinite(p.target_loss) || p.target_loss < 0 || p.target_loss >= p.initial_weight) { cloud.error = 'Revise los datos. Los kg a perder deben ser menos que el peso actual.'; return false; }
 if (password.length < 8 || password !== String(data.get('confirmation'))) { cloud.error = 'Elija una contraseña de al menos 8 caracteres y repítala en los dos campos.'; return false; }
 const choices = {goals:[...st.goals],prefs:[...st.prefs],restr:[...st.restr]};
 if (cloud.user?.is_anonymous) {
  if (!await createPassword(password, password)) return false;
 } else if (!cloud.user) {
  const cfg = window.ALIVIO_SUPABASE;
  const response = await fetch(cfg.url + '/auth/v1/settings',{headers:{apikey:cfg.publicKey}});
  if (!response.ok) throw Error('Configuración no disponible');
  const settings = await response.json();
  if (!settings.external?.email || !settings.mailer_autoconfirm) { cloud.error = 'El acceso está en preparación. Inténtelo de nuevo más tarde.'; return false; }
  const result = await cloud.client.auth.signUp({email:p.email,password,options:{data:{full_name:p.name}}});
  if (result.error) { cloud.error = authError(result.error); return false; }
  const user = result.data?.session?.user;
  if (!user) { cloud.error = 'No se pudo activar el acceso. Si ya entró antes, use «Ya tengo contraseña».'; return false; }
  cloud.user = user;
  cloud.contact = {email:user.email};
 }
 const profile = {...p,...choices,user_id:cloud.user.id,email:cloud.user.email};
 try { await checked(cloud.client.from('alivio_profiles').upsert(profile)); }
 catch (_) { cloud.error = 'Su acceso se activó, pero el perfil no se guardó. Confirme los datos de abajo y toque Guardar perfil.'; return false; }
 cloud.profile = profile; cloud.accessDraft = {};
 return true;
}
async function cloudRun(fn) {
 if (cloud.busy) return;
 cloud.busy = true; cloud.error = '';
 document.querySelectorAll('[data-cloud] button').forEach(b => b.disabled = true);
 try { await fn(); } catch(e) { cloud.error = 'No se pudo completar. Revise su conexión e inténtelo de nuevo.'; toast(cloud.error,'alert'); }
 finally { cloud.busy = false; if (cloud.pendingSession) { const pending = cloud.pendingSession; cloud.pendingSession = null; await applyCloudSession(pending.session); } render(); }
}
document.addEventListener('submit', e => {
 const form = e.target.closest('form[data-cloud]'); if (!form) return; e.preventDefault();
 const data = new FormData(form);
 cloudRun(async () => {
  const kind = form.dataset.cloud;
  if (kind === 'access') { if (await activateAccess(data)) toast('Su perfil está listo. ¡Bienvenida!'); return; }
  if (kind === 'login') { if (await enterWithPassword(String(data.get('email')), String(data.get('password')))) toast('Sesión iniciada.'); return; }
  if (kind === 'password') { if (await createPassword(String(data.get('password')), String(data.get('confirmation')))) toast('Contraseña creada. Ya puede entrar desde otros dispositivos.'); return; }
  if (!cloud.user) throw Error('Sin sesión');
  const uid = cloud.user.id;
  if (kind === 'profile') {
   const p = {user_id:uid,email:cloud.contact?.email || cloud.user.email,name:String(data.get('name')).trim(),age:Number(data.get('age')),initial_weight:Number(data.get('initial_weight')),target_loss:Number(data.get('target_loss')),goals:[...st.goals],prefs:[...st.prefs],restr:[...st.restr]};
   if (!p.name || !Number.isInteger(p.age) || p.age < 18 || p.age > 120 || p.initial_weight < 30 || p.initial_weight > 400 || p.target_loss < 0 || p.target_loss >= p.initial_weight) { cloud.error = 'Revise los datos: los kg a perder deben ser menos que el peso inicial.'; return; }
   await checked(cloud.client.from('alivio_profiles').upsert(p));
  }
  if (kind === 'weight' || kind === 'photo') {
   const date = String(data.get('date')); if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > localDate()) throw Error('Fecha no válida');
   if (kind === 'weight') await checked(cloud.client.from('alivio_weights').upsert({user_id:uid,weight:Number(data.get('weight')),recorded_on:date},{onConflict:'user_id,recorded_on'}));
   else {
    const file = data.get('photo'); const ext = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
    if (!ext || file.size > 8388608 || !file.size) { cloud.error = 'Elija JPEG, PNG o WebP de hasta 8 MB.'; return; }
    await checked(cloud.client.storage.from('alivio-progress').upload(`${uid}/${date}_${crypto.randomUUID()}.${ext}`,file,{contentType:file.type,upsert:false}));
   }
  }
  await loadCloud(); toast('Guardado en su cuenta.');
 });
});
document.addEventListener('click', e => {
 const mode = e.target.closest('[data-cloud-mode]');
 if (mode && !cloud.busy) { cloud.authMode = mode.dataset.cloudMode; cloud.error = ''; render(); return; }
 const b = e.target.closest('[data-cloud-action]'); if (!b) return;
 if (b.dataset.cloudAction === 'logout' && (!cloud.user?.is_anonymous || confirm('Aún no creó una contraseña. Si sale, perderá el acceso al progreso de esta sesión. ¿Quiere salir de todos modos?'))) cloudRun(async () => { await checked(cloud.client.auth.signOut()); clearCloud(); });
 if (b.dataset.cloudAction === 'delete' && confirm('¿Eliminar esta foto de forma permanente?')) cloudRun(async () => { await checked(cloud.client.storage.from('alivio-progress').remove([`${cloud.user.id}/${b.dataset.path}`])); await loadCloud(); toast('Foto eliminada.'); });
});
document.addEventListener('change', e => {
 if (e.target.dataset.compare) { const photo = cloud.photos[Number(e.target.value)]; if (photo) document.getElementById('compare-'+e.target.dataset.compare).src = photo.url; }
});
function clearCloud() { Object.assign(cloud,{user:null,profile:null,weights:[],photos:[],contact:null,accessDraft:{}}); const d = defaults(); Object.assign(st,{goals:d.goals,prefs:d.prefs,restr:d.restr}); }
async function applyCloudSession(session) {
 if (cloud.user?.id !== session?.user?.id) clearCloud();
 cloud.user = session?.user || null; cloud.ready = false;
 try { if (cloud.user) await loadCloud(); } catch (_) { cloud.error = cloud.error || 'No se pudieron cargar los datos. Recargue la página para intentarlo de nuevo.'; }
 cloud.ready = true;
}
async function startCloud() {
 const cfg = window.ALIVIO_SUPABASE;
 if (!cfg?.url || !cfg?.publicKey || !window.supabase) return;
 try {
 cloud.client = window.supabase.createClient(cfg.url,cfg.publicKey);
 cloud.client.auth.onAuthStateChange((event,session) => {
  if (event === 'TOKEN_REFRESHED') return;
  if (cloud.busy) { cloud.pendingSession = {session}; return; }
  setTimeout(async () => { await applyCloudSession(session); render(); },0);
 });
 } catch (_) { cloud.error = 'Conexión con la cuenta no disponible.'; cloud.ready = true; }
}
startCloud();
