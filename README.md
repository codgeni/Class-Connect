# CodGeni Education

**Plateforme de gestion scolaire complète** pour l'Institution Nouvelle Source.  
Application full-stack construite avec Next.js 14, React 18, Tailwind CSS et Supabase (PostgreSQL).

---

## Table des matières

- [Apercu](#apercu)
- [Fonctionnalites](#fonctionnalites)
- [Technologies](#technologies)
- [Architecture](#architecture)
- [Structure du projet](#structure-du-projet)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Base de donnees](#base-de-donnees)
- [API](#api)
- [Securite](#securite)
- [Depannage](#depannage)
- [Licence](#licence)

---

## Apercu

CodGeni Education est une plateforme scolaire multi-roles permettant aux administrateurs, professeurs et eleves de gerer l'ensemble de la vie scolaire : cours, devoirs, evaluations, notes, avis, calendrier et messagerie.

Chaque utilisateur se connecte via un **code unique** (genere par l'admin) et un mot de passe. L'acces aux fonctionnalites est strictement controle par role.

---

## Fonctionnalites

### Administrateur

| Fonctionnalite | Description |
|---|---|
| Dashboard | Vue d'ensemble avec statistiques globales |
| Gestion des eleves | Creer, modifier, bloquer/debloquer les comptes eleves |
| Gestion des professeurs | Creer, modifier, bloquer/debloquer les comptes professeurs |
| Creation de comptes | Generer des comptes avec codes uniques (`ELV-XXXXXX`, `PRF-XXXXXX`) |
| Identifiants | Consulter et regenerer les codes de connexion |
| Avis | Publier des annonces (urgentes ou non) visibles par role/classe |
| Dates importantes | Gerer le calendrier scolaire et les evenements |
| Programme de l'annee | Definir et partager le programme annuel |

### Professeur

| Fonctionnalite | Description |
|---|---|
| Dashboard | Vue d'ensemble des cours, devoirs et quiz |
| Fiches de cours | Creer et publier des cours avec fichiers joints |
| Devoirs | Assigner des devoirs avec date limite et bareme |
| Quiz & Evaluations | Creer des quiz avec questions (JSONB), duree, bareme |
| Correction & Notes | Corriger les soumissions et attribuer des notes |
| Avis | Publier des annonces pour les eleves |
| Messages | Communiquer avec les eleves et l'administration |

### Eleve

| Fonctionnalite | Description |
|---|---|
| Vue d'ensemble | Dashboard avec recap des cours, devoirs et notes |
| Fiches de cours | Consulter les cours publies par les professeurs |
| Devoirs | Voir les devoirs, soumettre des reponses et fichiers |
| Evaluations | Passer les quiz et consulter les resultats |
| Avis importants | Lire les annonces de l'administration et des professeurs |
| Dates importantes | Consulter le calendrier scolaire |
| Programme de l'annee | Voir le programme annuel |
| Carnet | Consulter ses notes et son parcours |

---

## Technologies

| Categorie | Technologie | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.2+ |
| Frontend | React | 18.3+ |
| Styles | Tailwind CSS | 3.4+ |
| Base de donnees | Supabase (PostgreSQL) | - |
| Authentification | JWT (`jose`) + bcrypt (`bcryptjs`) | - |
| Langage | TypeScript | 5.3+ |
| Gestion cookies | `cookie` | 0.6+ |
| Linting | ESLint + eslint-config-next | 8.56+ |

---

## Architecture

```
┌─────────────────────────────┐
│      Client (React/Next.js) │
│      Tailwind CSS           │
└──────────┬──────────────────┘
           │ HTTP
┌──────────▼──────────────────┐
│   Next.js API Routes        │
│   Middleware (auth + roles)  │
│   JWT / bcrypt               │
└──────────┬──────────────────┘
           │ Supabase SDK
┌──────────▼──────────────────┐
│   Supabase (PostgreSQL)     │
│   Row Level Security (RLS)  │
│   Storage (fichiers)        │
└─────────────────────────────┘
```

---

## Structure du projet

```
CodGeni-Education/
├── app/
│   ├── layout.tsx                # Layout racine
│   ├── page.tsx                  # Page d'accueil (redirect)
│   ├── globals.css               # Styles globaux
│   ├── login/                    # Page de connexion
│   ├── admin/                    # Pages administrateur
│   │   ├── dashboard/
│   │   ├── eleves/
│   │   ├── professeurs/
│   │   ├── comptes/
│   │   ├── identifiants/
│   │   ├── avis/
│   │   ├── dates-importantes/
│   │   └── programme-annee/
│   ├── prof/                     # Pages professeur
│   │   ├── dashboard/
│   │   ├── fiches-cours/
│   │   ├── devoirs/
│   │   ├── quiz/
│   │   ├── correction/
│   │   ├── avis/
│   │   ├── messages/
│   │   └── programme-annee/
│   ├── eleve/                    # Pages eleve
│   │   ├── dashboard/
│   │   ├── fiches-cours/
│   │   ├── devoirs/
│   │   ├── evaluations/
│   │   ├── avis/
│   │   ├── dates-importantes/
│   │   ├── programme-annee/
│   │   ├── carnet/
│   │   └── chat/
│   └── api/                      # Routes API
│       ├── auth/                 #   login, logout, me
│       ├── users/                #   CRUD utilisateurs
│       ├── cours/                #   Gestion des cours
│       ├── devoirs/              #   Gestion des devoirs
│       ├── soumissions/          #   Soumissions eleves
│       ├── quiz/                 #   Gestion des quiz
│       ├── avis/                 #   Annonces
│       ├── evenements/           #   Dates importantes
│       ├── messages/             #   Messagerie
│       ├── classes/              #   Classes
│       ├── matieres/             #   Matieres
│       ├── stats/                #   Statistiques
│       ├── upload/               #   Upload de fichiers
│       ├── prof/                 #   Endpoints specifiques profs
│       └── eleve/                #   Endpoints specifiques eleves
├── components/
│   ├── Sidebar.tsx               # Barre laterale (navigation par role)
│   ├── DashboardStats.tsx        # Composant statistiques
│   ├── NotificationDot.tsx       # Indicateur notification
│   └── NotificationSeen.tsx      # Marqueur de lecture
├── lib/
│   ├── supabase.ts               # Clients Supabase (public + admin)
│   ├── auth.ts                   # JWT, bcrypt, gestion sessions
│   ├── codes.ts                  # Generation de codes (INS-XXXXXX)
│   └── utils.ts                  # Utilitaires
├── supabase/
│   ├── schema.sql                # Schema principal de la BDD
│   ├── tables_classes_matieres.sql
│   └── add_*.sql                 # Scripts de migration
├── scripts/
│   ├── setup.js                  # Creation du compte admin
│   └── reset-password.js         # Reinitialisation mot de passe
├── middleware.ts                  # Protection des routes par role
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── postcss.config.js
└── package.json
```

---

## Installation

### Prerequis

- **Node.js** 18 ou superieur
- **npm** ou **yarn**
- Un compte [Supabase](https://supabase.com) (offre gratuite disponible)

### Etape 1 - Cloner et installer les dependances

```bash
git clone <url-du-repo>
cd CodGeni-Education
npm install
```

### Etape 2 - Creer le projet Supabase

1. Rendez-vous sur [supabase.com](https://supabase.com) et creez un nouveau projet
2. Dans le projet, allez dans **SQL Editor**
3. Copiez le contenu de `supabase/schema.sql` et executez-le
4. (Optionnel) Executez `supabase/tables_classes_matieres.sql` et les autres scripts `add_*.sql`
5. Recuperez vos cles API depuis **Settings > API**

### Etape 3 - Configurer l'environnement

Creez un fichier `.env.local` a la racine du projet :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role

# Authentification
JWT_SECRET=votre_secret_jwt_aleatoire

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Ou trouver les cles Supabase :**
- `NEXT_PUBLIC_SUPABASE_URL` : Project URL (Settings > API)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : anon / public key
- `SUPABASE_SERVICE_ROLE_KEY` : service_role key (ne jamais exposer cote client)

**Generer le JWT_SECRET :**

```bash
# Linux / macOS
openssl rand -base64 32

# Ou utilisez n'importe quel generateur de chaine aleatoire
```

### Etape 4 - Initialiser la base de donnees

```bash
npm run setup
```

Cela cree automatiquement le compte administrateur :

| Champ | Valeur |
|---|---|
| Code de connexion | `admin1` |
| Mot de passe | `admin123` |

> **Changez le mot de passe apres la premiere connexion.**

### Etape 5 - Lancer l'application

```bash
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## Configuration

### Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Demarre le serveur de developpement |
| `npm run build` | Compile pour la production |
| `npm start` | Demarre le serveur de production |
| `npm run lint` | Analyse le code avec ESLint |
| `npm run setup` | Cree le compte administrateur initial |

### Deploiement en production

```bash
npm run build
npm start
```

Pensez a definir les variables d'environnement sur votre plateforme d'hebergement (Vercel, Railway, etc.).

---

## Utilisation

### Premiere connexion

1. Accedez a `http://localhost:3000`
2. Vous etes redirige vers `/login`
3. Connectez-vous avec le code `admin1` et le mot de passe `admin123`
4. Vous arrivez sur le dashboard administrateur

### Creer des comptes

1. Depuis le dashboard admin, allez dans **Creer des comptes**
2. Remplissez les informations de l'eleve ou du professeur
3. Un code unique est genere automatiquement (format `ELV-XXXXXX` ou `PRF-XXXXXX`)
4. Communiquez le code et le mot de passe a l'utilisateur

### Flux de travail type

```
Admin cree les comptes
       ↓
Professeur se connecte
       ↓
Professeur publie des cours, devoirs et quiz
       ↓
Eleve consulte les cours et soumet ses devoirs/quiz
       ↓
Professeur corrige et attribue les notes
       ↓
Eleve consulte ses resultats dans son carnet
```

---

## Base de donnees

### Tables principales

| Table | Description |
|---|---|
| `users` | Utilisateurs (admin, eleve, prof) avec code_login, password_hash, role, actif |
| `cours` | Cours publies par les professeurs (titre, contenu, matiere, classe, fichier) |
| `devoirs` | Devoirs assignes (titre, description, date_limite, points, classe) |
| `soumissions` | Travaux soumis par les eleves (contenu, fichier, note, commentaire) |
| `quiz` | Quiz et evaluations (questions JSONB, duree, points_total, date_limite) |
| `reponses_quiz` | Reponses des eleves aux quiz (reponses JSONB, note) |
| `notes` | Notes des eleves par matiere et type |
| `avis` | Annonces et avis (urgent, cible par role/classe) |
| `messages` | Messagerie interne (expediteur, destinataire, sujet, contenu) |
| `evenements` | Dates importantes et evenements du calendrier |
| `classes` | Liste des classes |
| `matieres` | Liste des matieres |
| `eleve_classes` | Association eleves-classes |
| `prof_matieres` | Association professeurs-matieres |
| `prof_classes` | Association professeurs-classes |

### Schema

Le schema complet se trouve dans `supabase/schema.sql`. Les tables de liaison (classes, matieres) sont dans `supabase/tables_classes_matieres.sql`.

---

## API

### Authentification

| Methode | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Connexion (code + mot de passe) |
| POST | `/api/auth/logout` | Deconnexion |
| GET | `/api/auth/me` | Utilisateur courant (depuis le JWT) |

### Utilisateurs

| Methode | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | Liste des utilisateurs |
| POST | `/api/users` | Creer un utilisateur |
| PUT | `/api/users/[id]` | Modifier un utilisateur |
| DELETE | `/api/users/[id]` | Supprimer un utilisateur |
| POST | `/api/users/[id]/regenerate` | Regenerer le code de connexion |

### Ressources pedagogiques

| Methode | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/cours` | Cours |
| GET/POST | `/api/devoirs` | Devoirs |
| GET/POST | `/api/soumissions` | Soumissions |
| GET/POST | `/api/quiz` | Quiz |
| GET/POST | `/api/avis` | Avis |
| GET/POST | `/api/evenements` | Evenements |
| GET/POST | `/api/messages` | Messages |

### Autres

| Methode | Endpoint | Description |
|---|---|---|
| GET | `/api/classes` | Liste des classes |
| GET | `/api/matieres` | Liste des matieres |
| GET | `/api/stats` | Statistiques globales |
| POST | `/api/upload` | Upload de fichiers |
| GET | `/api/prof/[id]/matieres` | Matieres d'un professeur |
| GET | `/api/prof/[id]/eleves` | Eleves d'un professeur |
| GET | `/api/eleve/notifications` | Notifications d'un eleve |

---

## Securite

### Authentification

- Les mots de passe sont hashes avec **bcrypt** (12 rounds)
- Les sessions utilisent des **JWT** signes avec `jose`
- Le token est stocke dans un cookie **httpOnly** (non accessible par JavaScript)
- Duree de session : **7 jours**

### Autorisation

- Le **middleware** Next.js intercepte chaque requete et verifie le JWT
- Acces base sur le **role** : `/admin/*`, `/prof/*`, `/eleve/*`
- Les API Routes verifient egalement le role avant traitement

### Base de donnees

- **Row Level Security (RLS)** active sur toutes les tables Supabase
- Le `SUPABASE_SERVICE_ROLE_KEY` n'est utilise que cote serveur
- Toute la logique sensible est executee cote serveur uniquement

### Bonnes pratiques

- Ne commitez **jamais** `.env.local` dans Git
- Ne partagez **jamais** `SUPABASE_SERVICE_ROLE_KEY`
- Utilisez un `JWT_SECRET` fort (minimum 32 caracteres)
- Changez le mot de passe admin apres la premiere connexion

---

## Depannage

### "Missing Supabase environment variables"

Verifiez que `.env.local` existe a la racine et contient toutes les variables. Redemarrez le serveur (`npm run dev`).

### "Missing JWT_SECRET"

Ajoutez `JWT_SECRET` dans `.env.local` et redemarrez le serveur.

### Erreur de connexion Supabase

- Verifiez que les cles API sont correctes (Settings > API dans Supabase)
- Verifiez que le schema SQL a ete execute
- Verifiez que RLS est active sur les tables

### Le compte admin n'existe pas

Executez `npm run setup` et verifiez les logs pour d'eventuelles erreurs.

### Erreur 401 / Acces refuse

- Verifiez que le cookie de session est present
- Reconnectez-vous si la session a expire (7 jours)
- Verifiez que votre role correspond a la page demandee

---

## Licence

Developpe par **CodGeni**.
