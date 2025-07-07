# 🚀 Deploy Definitivo - Portal SUB

## ✅ Passo a Passo (5 minutos)

### 1. **Acesse o Vercel**
👉 [https://vercel.com/dashboard](https://vercel.com/dashboard)

### 2. **Novo Projeto**
- Clique em **"New Project"**
- Conecte com **GitHub** (se não estiver conectado)

### 3. **Selecione o Repositório**
- Procure por: **`rafaelomartins/bmbsub`**
- Clique em **"Import"**

### 4. **Configuração do Projeto**
- **Project Name:** `portal-sub-api`
- **Framework:** Detect automatically (será detectado como Next.js ou Static)
- **Root Directory:** `./` (padrão)
- **Build Command:** `cd frontend && npm run build`
- **Output Directory:** `frontend/dist`

### 5. **Environment Variables** (IMPORTANTE!)
Clique em **"Environment Variables"** e adicione:

```
DB_USER=rafa.oliveira
DB_HOST=bi-telco.connector.datalake.bemobi.com
DB_NAME=master
DB_PASSWORD=Inicio@1
DB_PORT=5439
NODE_ENV=production
```

### 6. **Deploy**
- Clique em **"Deploy"**
- Aguarde 2-3 minutos
- ✅ **Pronto!**

---

## 🌐 **Resultado Final**

Sua aplicação estará disponível em:
- **URL:** `https://portal-sub-api.vercel.app`
- **Domínio personalizado:** Configure depois em Settings > Domains

---

## 🔧 **Funcionalidades Testadas**

✅ **Frontend:** React + Vite  
✅ **Backend:** Node.js + Express  
✅ **Banco:** PostgreSQL  
✅ **APIs:** BolePIX + Antifraude  
✅ **Autenticação:** JWT + Login  
✅ **Responsivo:** Mobile + Desktop  

---

## 📊 **Monitoramento**

### Logs e Métricas:
- **Functions:** Vercel Dashboard > Functions
- **Analytics:** Vercel Dashboard > Analytics
- **Performance:** Vercel Dashboard > Speed Insights

### Atualizações:
- **Automático:** Cada push no GitHub = novo deploy
- **Manual:** Vercel Dashboard > Deployments > Redeploy

---

## 🛡️ **Segurança**

✅ **HTTPS:** Automático  
✅ **Environment Variables:** Protegidas  
✅ **Headers:** Configurados via vercel.json  
✅ **CORS:** Configurado no backend  

---

## 📞 **Suporte**

**Se der algum erro:**
1. Vercel Dashboard > Functions > View Function Logs
2. Verificar Environment Variables
3. Testar endpoints individualmente

**URLs de teste após deploy:**
- `https://seu-dominio.vercel.app` (Frontend)
- `https://seu-dominio.vercel.app/api/auth/login` (Backend)

---

## 🎉 **Pronto!**
Sua aplicação está **PÚBLICA** e acessível de qualquer lugar do mundo! 