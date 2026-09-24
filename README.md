# Alívio em Cada Prato

Aplicativo HTML com catálogo local e integração opcional com Supabase.

## Ativar a conta

1. Criar um projeto Supabase e aplicar `supabase/migrations/20260924140000_initial_alivio.sql` pela integração GitHub ou pela CLI. Não executar novamente se as tabelas já existirem; nesse caso, reconciliar primeiro o histórico de migrações.
2. Preencher `supabase-config.js` com o URL e a chave pública publishable/anon. Nunca usar service_role.
3. Em Authentication > URL Configuration, configurar Site URL e permitir o endereço completo de `alivio-em-cada-prato.html` como redirect.
4. Servir a pasta por HTTP/HTTPS (por exemplo, `python3 -m http.server 8080`). Não usar file:// para autenticação.
5. Aplicar também `supabase/migrations/20260924160000_email_leads_google.sql` uma vez. A tabela `alivio_contacts` guarda o email logo no primeiro acesso, através de um trigger no utilizador Auth, mesmo sem completar o perfil.
6. Em Authentication > Sign In / Providers, ativar **Allow anonymous sign-ins**. Ativar também o método **Email** e **Allow manual linking**; manter **Confirm email** desligado para criar palavra-passe sem links. Não é necessário configurar Google.
7. No Perfil, usar **Continuar com email**. Opcionalmente, abrir **Criar uma palavra-passe** e preencher a palavra-passe e a confirmação (mínimo 8 caracteres). O aplicativo atualiza o utilizador Auth existente, mantendo o mesmo UUID e o seu perfil, pesos e fotos. Noutra sessão, escolher **Já tenho palavra-passe** e entrar com email e palavra-passe.

O SDK Supabase v2 é carregado por CDN. O esquema inclui perfil com email da conta, idade, peso inicial, kg a perder, objetivos, gostos e restrições; histórico de peso; bucket privado com limite de 8 MB e políticas por utilizador. Fotos são agrupadas por data no caminho, com URLs assinados válidos por uma hora. Reabrir a conta renova as URLs. A galeria apresenta até 1000 fotos. Um novo peso na mesma data substitui o registo anterior.

A comparação permite escolher duas fotografias. O peso inicial pode ser corrigido no perfil. A configuração atual aceita perfis adultos (18+). As sugestões classificam receitas existentes por gostos, objetivos e restrições; não prescrevem metas de calorias ou prazos de emagrecimento. Guardar preferências no botão do formulário do perfil para sincronizar entre dispositivos.

Os favoritos, listas, avatar e restantes funcionalidades originais continuam locais. «Repor dados» limpa apenas esses dados locais, não elimina a conta remota.

## Verificação

`node tests/check.cjs` verifica carregamento dos scripts, vistas, restrições veganas, cálculo do progresso, escape de campos, comparação e limpeza da sessão. `node --check wellness.js` verifica sintaxe.

Antes de publicar: testar autenticação e upload no projeto real; criar duas contas e verificar isolamento de perfis, pesos e fotos; testar exclusão, entrada anónima com email, sessão após recarregar e falhas de rede. Estes testes remotos dependem da ligação ao projeto.

Referências: https://supabase.com/docs/guides/auth/auth-anonymous e https://supabase.com/docs/guides/storage/buckets/fundamentals

## Integração Supabase–GitHub

1. Colocar esta pasta num repositório GitHub.
2. No projeto Supabase, abrir **Project Settings > Integrations > GitHub Integration > Authorize GitHub**.
3. Autorizar o Supabase no GitHub e selecionar apenas o repositório do aplicativo.
4. Definir o diretório de trabalho como `.` porque a pasta `supabase/` está na raiz.
5. Escolher a branch de produção e rever as opções de implantação automática antes de ativar **Enable integration**.
6. Confirmar nos logs que a migração inicial foi aplicada e testar duas contas antes de publicar o aplicativo.

A integração gere alterações da base de dados; o HTML precisa de alojamento próprio. O ficheiro `supabase-config.js` continua a precisar do URL e da chave pública do projeto. Dados pessoais e fotografias ficam no Supabase, não no repositório.

Documentação: https://supabase.com/docs/guides/deployment/branching/github-integration

## Acesso simples e leads

O email digitado é contacto não verificado, não prova de identidade. O Supabase cria um utilizador anónimo com UUID próprio e sessão persistente. As políticas continuam a isolar todos os dados pelo UUID autenticado. Nunca se procura nem se recupera uma conta por email digitado; o mesmo email pode existir em várias sessões. O trigger guarda contactos associados ao utilizador Auth; não envia mensagens nem inscreve o utilizador em campanhas.

Antes de criar uma palavra-passe, sair, limpar o armazenamento do navegador ou trocar de dispositivo perde o acesso à sessão anterior. O aplicativo indica que o acesso depende deste navegador e confirma antes de sair. Introduzir novamente o mesmo email não recupera dados anteriores. Depois de criar uma palavra-passe, pode recuperar a conta através da opção **Já tenho palavra-passe**. Não há entrada por Google. As sessões existentes são mantidas; nenhuma conta ou dado foi eliminado. A configuração remota do provider Google não é alterada pela remoção dos botões.

A migração mantém os dados existentes e atualiza a política de perfil para validar o email contra o contacto da própria sessão. Não executar novamente a migração inicial. A configuração do acesso anónimo exige acesso ao painel. Antes de abrir captação pública em escala, configurar proteção anti-abuso de entradas anónimas conforme a documentação Supabase.

## Palavra-passe opcional

A conversão usa `auth.updateUser({ email, password })` na sessão anónima atual; não cria outra conta, não transfere registos e não junta históricos por email. A UI só confirma sucesso quando o Supabase devolve o mesmo UUID, um utilizador permanente e email confirmado. O email vem do contacto da própria sessão. Um email já utilizado devolve um erro e mantém a sessão e os dados atuais. A palavra-passe é enviada exclusivamente ao Supabase Auth, nunca para as tabelas do aplicativo ou armazenamento local próprio.

Os testes locais cobrem validação, método Email desligado, confirmação ativa, conversão mantendo perfil/pesos/fotos, conflito de email e login. O teste real de conversão e novo login depende de ativar o método Email no painel. Favoritos e receitas vistas continuam locais, como antes. A recuperação de palavra-passe esquecida ainda não tem interface nesta versão.

## Aba Premium

A aba **Premium** mostra cinco produtos bloqueados com cadeado (capas em `products/`, dados em `PRODUCTS` no HTML). Os preços vão de $10 a $30 conforme a importância: Cocina una Vez $30, Freidora de Aire $25, Panadería sin Gluten $20, Postre sin Culpa $15, Tu Vaso de Alivio $10. Ainda não há pagamento: «Quero desbloquear» apenas regista o interesse localmente, no campo `wants`.
