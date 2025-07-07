const { execSync } = require('child_process');

console.log('🚀 === DEPLOY AUTOMÁTICO - PORTAL SUB ===');
console.log('');

try {
  // Verificar login
  console.log('✅ Verificando login...');
  const whoami = execSync('vercel whoami', { encoding: 'utf8' }).trim();
  console.log(`✅ Login OK: ${whoami}`);
  
  // Commit das mudanças
  console.log('📦 Fazendo commit...');
  try {
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Deploy: Configuração final para produção"', { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });
  } catch (e) {
    console.log('ℹ️  Sem mudanças para commit');
  }
  
  // Fazer deploy
  console.log('🚀 Fazendo deploy...');
  const deployResult = execSync('vercel --prod --confirm', { encoding: 'utf8' });
  
  console.log('✅ Deploy realizado com sucesso!');
  console.log('🌐 URL do projeto:');
  console.log(deployResult);
  
} catch (error) {
  console.error('❌ Erro no deploy:', error.message);
  console.log('');
  console.log('🔧 Soluções:');
  console.log('1. Fazer deploy via interface web: https://vercel.com');
  console.log('2. Ou executar manualmente: vercel --prod');
} 