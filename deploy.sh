#!/bin/bash

echo "🚀 === DEPLOY AUTOMATIZADO - PORTAL SUB ==="
echo ""

# Verificar se está logado
echo "✅ Verificando login..."
if ! vercel whoami > /dev/null 2>&1; then
    echo "❌ Você não está logado no Vercel"
    echo "Execute: vercel login"
    exit 1
fi

echo "✅ Login OK: $(vercel whoami)"

# Fazer commit das mudanças
echo "📦 Fazendo commit..."
git add .
git commit -m "Deploy: Configuração final para produção" || true
git push origin main

echo "🔧 Configurando projeto..."

# Criar configuração do Vercel
mkdir -p .vercel
cat > .vercel/project.json << EOF
{
  "projectId": "portal-sub-api",
  "orgId": "rafaelomartins"
}
EOF

echo "🚀 Iniciando deploy..."
echo ""
echo "IMPORTANTE: Quando o Vercel perguntar, responda:"
echo "1. Set up and deploy? → Y"
echo "2. Which scope? → Rafael's projects"
echo "3. Project name? → portal-sub-api"
echo "4. Directory? → ./"
echo ""
echo "Pressione ENTER para continuar..."
read

# Fazer deploy
vercel --prod

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Acesse seu projeto em: https://portal-sub-api.vercel.app"
echo ""
echo "🔧 Não esqueça de configurar as Environment Variables:"
echo "   - DB_USER=rafa.oliveira"
echo "   - DB_HOST=bi-telco.connector.datalake.bemobi.com"
echo "   - DB_NAME=master"
echo "   - DB_PASSWORD=Inicio@1"
echo "   - DB_PORT=5439"
echo "   - NODE_ENV=production" 