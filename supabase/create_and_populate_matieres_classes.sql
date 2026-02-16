-- Script complet pour créer les tables et insérer les données de base
-- À exécuter dans Supabase SQL Editor

-- Table classes
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table matieres
CREATE TABLE IF NOT EXISTS matieres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table eleve_classes - Relation entre élèves et classes
CREATE TABLE IF NOT EXISTS eleve_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id UUID REFERENCES users(id) ON DELETE CASCADE,
  classe_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  section TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(eleve_id, classe_id)
);

-- Table prof_matieres - Relation entre professeurs et matières
CREATE TABLE IF NOT EXISTS prof_matieres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prof_id UUID REFERENCES users(id) ON DELETE CASCADE,
  matiere_id UUID REFERENCES matieres(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prof_id, matiere_id)
);

-- Table prof_classes - Relation entre professeurs et classes
CREATE TABLE IF NOT EXISTS prof_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prof_id UUID REFERENCES users(id) ON DELETE CASCADE,
  classe_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prof_id, classe_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_eleve_classes_eleve_id ON eleve_classes(eleve_id);
CREATE INDEX IF NOT EXISTS idx_eleve_classes_classe_id ON eleve_classes(classe_id);
CREATE INDEX IF NOT EXISTS idx_prof_matieres_prof_id ON prof_matieres(prof_id);
CREATE INDEX IF NOT EXISTS idx_prof_matieres_matiere_id ON prof_matieres(matiere_id);
CREATE INDEX IF NOT EXISTS idx_prof_classes_prof_id ON prof_classes(prof_id);
CREATE INDEX IF NOT EXISTS idx_prof_classes_classe_id ON prof_classes(classe_id);

-- RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleve_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prof_matieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE prof_classes ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "All can view classes" ON classes;
CREATE POLICY "All can view classes" ON classes FOR SELECT USING (true);

DROP POLICY IF EXISTS "All can view matieres" ON matieres;
CREATE POLICY "All can view matieres" ON matieres FOR SELECT USING (true);

DROP POLICY IF EXISTS "All can view eleve_classes" ON eleve_classes;
CREATE POLICY "All can view eleve_classes" ON eleve_classes FOR SELECT USING (true);

DROP POLICY IF EXISTS "All can view prof_matieres" ON prof_matieres;
CREATE POLICY "All can view prof_matieres" ON prof_matieres FOR SELECT USING (true);

DROP POLICY IF EXISTS "All can view prof_classes" ON prof_classes;
CREATE POLICY "All can view prof_classes" ON prof_classes FOR SELECT USING (true);

-- Insérer des données de base
INSERT INTO classes (nom) VALUES 
  ('Secondaire 1'),
  ('Secondaire 2'),
  ('Secondaire 3')
ON CONFLICT (nom) DO NOTHING;

INSERT INTO matieres (nom) VALUES 
  ('Mathématiques'),
  ('Physique'),
  ('Chimie'),
  ('Histoire'),
  ('Français'),
  ('Anglais'),
  ('Biologie'),
  ('Géographie')
ON CONFLICT (nom) DO NOTHING;
