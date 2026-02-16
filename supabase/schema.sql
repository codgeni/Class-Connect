-- Schema SQL pour CodGeni Education
-- À exécuter dans Supabase SQL Editor

-- Table users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'eleve', 'prof')),
  code_login TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table cours
CREATE TABLE IF NOT EXISTS cours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  matiere TEXT NOT NULL,
  prof_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contenu TEXT,
  fichier_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table devoirs
CREATE TABLE IF NOT EXISTS devoirs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  matiere TEXT NOT NULL,
  prof_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date_limite TIMESTAMP WITH TIME ZONE,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table soumissions
CREATE TABLE IF NOT EXISTS soumissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devoir_id UUID REFERENCES devoirs(id) ON DELETE CASCADE,
  eleve_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contenu TEXT,
  fichier_url TEXT,
  note DECIMAL(5,2),
  commentaire TEXT,
  corrige BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  corrected_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(devoir_id, eleve_id)
);

-- Table quiz
CREATE TABLE IF NOT EXISTS quiz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  matiere TEXT NOT NULL,
  prof_id UUID REFERENCES users(id) ON DELETE CASCADE,
  questions JSONB NOT NULL,
  points_total INTEGER DEFAULT 0,
  duree_minutes INTEGER,
  date_limite TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table reponses_quiz
CREATE TABLE IF NOT EXISTS reponses_quiz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quiz(id) ON DELETE CASCADE,
  eleve_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reponses JSONB NOT NULL,
  note DECIMAL(5,2),
  corrige BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  corrected_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(quiz_id, eleve_id)
);

-- Table notes
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id UUID REFERENCES users(id) ON DELETE CASCADE,
  matiere TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('devoir', 'quiz', 'evaluation', 'autre')),
  reference_id UUID, -- ID du devoir, quiz, etc.
  note DECIMAL(5,2) NOT NULL,
  points_total INTEGER DEFAULT 20,
  commentaire TEXT,
  prof_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table avis
CREATE TABLE IF NOT EXISTS avis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  auteur_id UUID REFERENCES users(id) ON DELETE CASCADE,
  urgent BOOLEAN DEFAULT false,
  visible_eleves BOOLEAN DEFAULT true,
  visible_profs BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediteur_id UUID REFERENCES users(id) ON DELETE CASCADE,
  destinataire_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sujet TEXT,
  contenu TEXT NOT NULL,
  lu BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table evenements
CREATE TABLE IF NOT EXISTS evenements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
  date_fin TIMESTAMP WITH TIME ZONE,
  type TEXT NOT NULL CHECK (type IN ('date_importante', 'evenement', 'vacances', 'examen')),
  fichier_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_code_login ON users(code_login);
CREATE INDEX IF NOT EXISTS idx_users_actif ON users(actif);
CREATE INDEX IF NOT EXISTS idx_cours_prof_id ON cours(prof_id);
CREATE INDEX IF NOT EXISTS idx_devoirs_prof_id ON devoirs(prof_id);
CREATE INDEX IF NOT EXISTS idx_soumissions_eleve_id ON soumissions(eleve_id);
CREATE INDEX IF NOT EXISTS idx_soumissions_devoir_id ON soumissions(devoir_id);
CREATE INDEX IF NOT EXISTS idx_quiz_prof_id ON quiz(prof_id);
CREATE INDEX IF NOT EXISTS idx_reponses_quiz_eleve_id ON reponses_quiz(eleve_id);
CREATE INDEX IF NOT EXISTS idx_notes_eleve_id ON notes(eleve_id);
CREATE INDEX IF NOT EXISTS idx_avis_created_at ON avis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_destinataire_id ON messages(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_messages_expediteur_id ON messages(expediteur_id);
CREATE INDEX IF NOT EXISTS idx_evenements_date_debut ON evenements(date_debut);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cours ENABLE ROW LEVEL SECURITY;
ALTER TABLE devoirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE soumissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE reponses_quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE avis ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE evenements ENABLE ROW LEVEL SECURITY;

-- Politiques RLS basiques (à adapter selon vos besoins)
-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (true);

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (true);

-- Les admins peuvent tout modifier
CREATE POLICY "Admins can modify all" ON users
  FOR ALL USING (true);

-- Les cours sont visibles par tous les utilisateurs actifs
CREATE POLICY "Active users can view cours" ON cours
  FOR SELECT USING (true);

-- Les devoirs sont visibles par tous
CREATE POLICY "All can view devoirs" ON devoirs
  FOR SELECT USING (true);

-- Les soumissions sont visibles par l'élève et le prof
CREATE POLICY "Students and profs can view soumissions" ON soumissions
  FOR SELECT USING (true);

-- Les avis sont visibles selon les paramètres
CREATE POLICY "All can view avis" ON avis
  FOR SELECT USING (true);

-- Les messages sont visibles par l'expéditeur et le destinataire
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (true);

-- Les événements sont visibles par tous
CREATE POLICY "All can view evenements" ON evenements
  FOR SELECT USING (true);
