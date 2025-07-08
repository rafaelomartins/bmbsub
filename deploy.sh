#!/bin/bash

# 🚀 Script de Deploy Automatizado - Portal SUB API
# Autor: Rafael Martins
# Versão: 2.0

set -e  # Para em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}"
}

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🚀 PORTAL SUB API                        ║"
echo "║                   Script de Deploy v2.0                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar se está no diretório correto
if [ ! -f "package.json" ] || [ ! -f "vercel.json" ]; then
    error "Execute este script na raiz do projeto!"
    exit 1
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    error "Node.js não está instalado!"
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js 18+ é necessário! Versão atual: $(node -v)"
    exit 1
fi

log "✅ Node.js $(node -v) detectado"

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    warn "Vercel CLI não encontrado. Instalando..."
    npm install -g vercel
fi

log "✅ Vercel CLI $(vercel --version) detectado"

# Verificar se está logado no Vercel
if ! vercel whoami &> /dev/null; then
    warn "Não está logado no Vercel. Fazendo login..."
    vercel login
fi

log "✅ Logado no Vercel como: $(vercel whoami)"

# Limpar builds antigos
log "🧹 Limpando builds antigos..."
rm -rf frontend/dist
rm -rf backend/dist
rm -rf .vercel/output

# Instalar dependências
log "📦 Instalando dependências..."
npm run install-deps

# Testar build local
log "🔨 Testando build local..."
npm run build

if [ $? -eq 0 ]; then
    log "✅ Build local bem-sucedido!"
else
    error "❌ Erro no build local!"
    exit 1
fi

# Verificar se há mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
    warn "⚠️  Há mudanças não commitadas no Git"
    read -p "Deseja continuar mesmo assim? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Deploy cancelado pelo usuário"
        exit 0
    fi
fi

# Deploy para produção
log "🚀 Iniciando deploy para produção..."
info "Isso pode levar alguns minutos..."

vercel --prod --yes

if [ $? -eq 0 ]; then
    log "🎉 Deploy concluído com sucesso!"
    
    # Obter URL do projeto
    PROJECT_URL=$(vercel ls | grep "portal-sub-api" | awk '{print $2}' | head -1)
    
    if [ -n "$PROJECT_URL" ]; then
        echo -e "${GREEN}"
        echo "╔══════════════════════════════════════════════════════════════╗"
        echo "║                    🎉 DEPLOY CONCLUÍDO!                      ║"
        echo "╚══════════════════════════════════════════════════════════════╝"
        echo -e "${NC}"
        log "🌐 Sua aplicação está disponível em:"
        echo -e "${BLUE}   Frontend: https://$PROJECT_URL${NC}"
        echo -e "${BLUE}   API: https://$PROJECT_URL/api${NC}"
        echo ""
        log "🔍 Para verificar o status:"
        echo -e "${BLUE}   vercel ls${NC}"
        echo ""
        log "📊 Para ver logs:"
        echo -e "${BLUE}   vercel logs --prod${NC}"
        echo ""
        log "🔄 Para fazer novo deploy:"
        echo -e "${BLUE}   ./deploy.sh${NC}"
    fi
else
    error "❌ Erro no deploy!"
    log "📋 Para ver logs detalhados:"
    echo -e "${BLUE}   vercel logs --prod${NC}"
    exit 1
fi 