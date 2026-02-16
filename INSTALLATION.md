# Guide d'Installation - CodGeni Education

## 📋 Prérequis

- Node.js 18+ installé
- Compte Supabase (gratuit disponible sur [supabase.com](https://supabase.com))
- npm ou yarn

## 🚀 Étapes d'Installation

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration Supabase

#### a. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre URL et vos clés API (Settings > API)

#### b. Exécuter le schéma SQL

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Ouvrez le fichier `supabase/schema.sql`
3. Copiez tout le contenu
4. Collez-le dans l'éditeur SQL de Supabase
5. Cliquez sur **Run** pour exécuter

✅ Cela créera toutes les tables nécessaires avec les politiques RLS

### 3. Configuration de l'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_ici
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role_ici

# JWT Secret (générez une chaîne aléatoire)
JWT_SECRET=votre_secret_jwt_aleatoire_ici

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Comment obtenir les clés Supabase :**
- Allez dans Settings > API de votre projet Supabase
- `NEXT_PUBLIC_SUPABASE_URL` : Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : anon public key
- `SUPABASE_SERVICE_ROLE_KEY` : service_role key (⚠️ gardez-la secrète!)

**Comment générer JWT_SECRET :**
```bash
# Sur Linux/Mac
openssl rand -base64 32

# Ou utilisez un générateur en ligne
```

### 4. Initialisation de la base de données

Exécutez le script de setup pour créer le compte administrateur :

```bash
npm run setup
```

✅ Cela créera automatiquement :
- **Code de connexion**: `admin1`
- **Mot de passe**: `admin123`

⚠️ **IMPORTANT**: Changez le mot de passe après la première connexion!

### 5. Lancer l'application

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 🧪 Test de l'installation

1. Allez sur `http://localhost:3000`
2. Vous serez redirigé vers `/login`
3. Connectez-vous avec :
   - Code: `admin1`
   - Mot de passe: `admin123`
4. Vous devriez voir le dashboard administrateur

## ✅ Vérification

Vérifiez que tout fonctionne :

- [ ] L'application démarre sans erreur
- [ ] La connexion admin fonctionne
- [ ] Le dashboard s'affiche
- [ ] Les stats sont à 0 (normal, base vide)

## 🐛 Dépannage

### Erreur "Missing Supabase environment variables"
- Vérifiez que `.env.local` existe et contient toutes les variables
- Redémarrez le serveur de développement

### Erreur "Missing JWT_SECRET"
- Ajoutez `JWT_SECRET` dans `.env.local`
- Redémarrez le serveur

### Erreur de connexion Supabase
- Vérifiez que les clés API sont correctes
- Vérifiez que le schéma SQL a été exécuté
- Vérifiez que RLS est activé sur les tables

### Le compte admin n'existe pas
- Exécutez `npm run setup` à nouveau
- Vérifiez les logs pour les erreurs

## 📝 Prochaines étapes

1. **Créer des comptes** : Utilisez le dashboard admin pour créer des élèves et professeurs
2. **Configurer les permissions** : Ajustez les politiques RLS si nécessaire
3. **Personnaliser** : Modifiez les styles et contenus selon vos besoins

## 🔒 Sécurité

- ⚠️ Ne commitez JAMAIS `.env.local` dans Git
- ⚠️ Ne partagez JAMAIS `SUPABASE_SERVICE_ROLE_KEY`
- ⚠️ Changez le mot de passe admin après la première connexion
- ✅ Utilisez des secrets forts pour `JWT_SECRET`

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
