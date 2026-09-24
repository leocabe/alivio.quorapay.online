const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const html = fs.readFileSync('alivio-em-cada-prato.html','utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(s=>s.trim()!=='boot();');
const context = vm.createContext({console, localStorage:{getItem:()=>null}, document:{addEventListener(){},querySelector(){return null}},window:{},setTimeout(){},clearTimeout(){},Date,URL,Blob});
vm.runInContext(scripts.join('\n')+'\n'+fs.readFileSync('wellness.js','utf8'),context);
vm.runInContext(`
 if (!vProfile().includes('conexión con la cuenta')) throw Error('Estado sem configuração');
 if (!vForYou().includes('Para usted')) throw Error('Aba sugestões');
 st.restr = ['Vegana'];
 if (!forYou().every(r => r.tags.includes('vegana'))) throw Error('Restrições');
 cloud.client = {}; cloud.ready = true;
 if (!cloudPanel().includes('Continuar com email') || cloudPanel().includes('Google') || cloudPanel().includes('type="password"')) throw Error('Entrada simples');
 cloud.authMode = 'login';
 if (!cloudPanel().includes('current-password') || !cloudPanel().includes('Entrar na minha conta')) throw Error('Login com palavra-passe');
 cloud.authMode = 'email';
 cloud.user = {id:'test',email:'pessoa@example.com'};
 cloud.profile = {name:'<script>',age:30,initial_weight:80,target_loss:10};
 cloud.weights = [{weight:78,recorded_on:'2026-09-24'}];
 if (!cloudPanel().includes('70.0 kg') || !cloudPanel().includes('-2.0 kg')) throw Error('Cálculo do progresso');
 if (cloudPanel().includes('value="<script>"')) throw Error('Escape');
 cloud.photos = [{name:'2026-09-01_a.jpg',url:'https://example.com/a'},{name:'2026-09-24_b.jpg',url:'https://example.com/b'}];
 if (!cloudPanel().includes('compare-left') || !cloudPanel().includes('compare-right')) throw Error('Comparação');
 clearCloud();
 if (cloud.photos.length || cloud.profile || cloud.user) throw Error('Limpeza de sessão');
`,context);
assert(!html.includes("'parasi'") && html.includes("['premium', 'lock', 'Premium']"));
console.log('OK: scripts, perfil, sugestões, restrições, progresso, comparação e limpeza de sessão.');

vm.runInContext(`(async () => {
 let guests = 0;
 globalThis.location = {origin:'https://example.com',pathname:'/app.html'};
 cloud.client = {auth:{
  signInAnonymously: async (args) => { guests++; if(args.options.data.lead_email !== 'user@example.com') throw Error('Lead'); return {data:{session:{user:{id:'guest-'+guests}}},error:null}; },

 }};
 if (await enterWithEmail('invalid') || guests) throw Error('Email inválido');
 if (!await enterWithEmail(' user@example.com ') || guests !== 1) throw Error('Entrada sem confirmação');
 if (!await enterWithEmail('user@example.com') || guests !== 2) throw Error('Reutilizou identidade por email');
 cloud.user = {id:'guest',is_anonymous:true};
 if (cloudPanel().includes('Google') || !cloudPanel().includes('Acceso guardado en este navegador')) throw Error('Perfil sem Google');
 if (typeof enterWithGoogle !== 'undefined') throw Error('OAuth ainda presente');
 cloud.client.auth.signInAnonymously = async () => ({error:{code:'anonymous_provider_disabled'}});
 if (await enterWithEmail('user@example.com') || !cloud.error.includes('preparación')) throw Error('Provider desligado');
 cloud.client.auth.signInAnonymously = async () => ({data:{session:null},error:null});
 if (await enterWithEmail('user@example.com')) throw Error('Sucesso sem sessão');

 window.ALIVIO_SUPABASE = {url:'https://example.com',publicKey:'public'};
 cloud.user = {id:'guest',is_anonymous:true}; cloud.contact = {email:'user@example.com'};
 cloud.profile = {user_id:'guest',name:'Teste'}; cloud.weights = [{user_id:'guest',weight:80}]; cloud.photos = [{name:'saved.jpg',url:'photo'}];
 const profileBefore = cloud.profile, photosBefore = cloud.photos, weightsBefore = cloud.weights;
 if (!passwordPanel().includes('Criar uma palavra-passe') || !passwordPanel().includes('new-password')) throw Error('Criar palavra-passe UI');
 let updates = 0;
 cloud.client.auth.updateUser = async attrs => {
  updates++; if(attrs.email !== 'user@example.com' || attrs.password !== 'testPassword123') throw Error('Credenciais de conversão');
  return {data:{user:{id:'guest',email:attrs.email,is_anonymous:false,email_confirmed_at:'2026-09-24',identities:[{provider:'email'}]}},error:null};
 };
 globalThis.fetch = async () => ({ok:true,json:async()=>({external:{email:true},mailer_autoconfirm:true})});
 if (await createPassword('short','short') || updates) throw Error('Palavra-passe curta');
 if (await createPassword('testPassword123','otherPassword') || updates) throw Error('Confirmação incorreta');
 globalThis.fetch = async () => ({ok:true,json:async()=>({external:{email:false},mailer_autoconfirm:true})});
 if (await createPassword('testPassword123','testPassword123') || updates) throw Error('Email desligado');
 globalThis.fetch = async () => ({ok:true,json:async()=>({external:{email:true},mailer_autoconfirm:false})});
 if (await createPassword('testPassword123','testPassword123') || updates) throw Error('Não deve enviar confirmação');
 globalThis.fetch = async () => ({ok:true,json:async()=>({external:{email:true},mailer_autoconfirm:true})});
 if (!await createPassword('testPassword123','testPassword123') || updates !== 1) throw Error('Conversão');
 if (cloud.user.id !== 'guest' || cloud.profile !== profileBefore || cloud.weights !== weightsBefore || cloud.photos !== photosBefore) throw Error('Histórico alterado');
 if (passwordPanel() !== '') throw Error('Criação repetida');
 cloud.user = {id:'guest',is_anonymous:true};
 cloud.client.auth.updateUser = async () => ({error:{code:'email_exists'}});
 if (await createPassword('testPassword123','testPassword123') || cloud.user.id !== 'guest' || cloud.profile !== profileBefore) throw Error('Conflito perdeu dados');
 cloud.client.auth.signInWithPassword = async () => ({error:{code:'invalid_credentials'}});
 if (await enterWithPassword('user@example.com','wrong') || !cloud.error.includes('incorrectos')) throw Error('Login inválido');
 cloud.client.auth.signInWithPassword = async args => { if(args.email !== 'user@example.com') throw Error('Normalização'); return {data:{session:{user:{id:'guest'}}},error:null}; };
 if (!await enterWithPassword(' user@example.com ','testPassword123')) throw Error('Login');
 console.log('OK: email simples, criação de palavra-passe, preservação do histórico, conflitos e login.');
})()`,context).catch(error => {console.error(error);process.exitCode = 1;});
