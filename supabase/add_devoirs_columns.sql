-- Ajouter les colonnes manquantes aux tables devoirs et cours
-- À exécuter dans Supabase SQL Editor

-- ============================================
-- Table DEVOIRS
-- ============================================

-- Ajouter la colonne classe
ALTER TABLE devoirs 
ADD COLUMN IF NOT EXISTS classe TEXT;

-- Ajouter la colonne type_rendu (fichier, texte, fichier_texte)
ALTER TABLE devoirs 
ADD COLUMN IF NOT EXISTS type_rendu TEXT CHECK (type_rendu IN ('fichier', 'texte', 'fichier_texte'));

-- Ajouter la colonne fichiers_joints (tableau JSON)
ALTER TABLE devoirs 
ADD COLUMN IF NOT EXISTS fichiers_joints TEXT[];

-- Ajouter un index sur la colonne classe pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_devoirs_classe ON devoirs(classe);

-- Ajouter un index sur la colonne matiere pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_devoirs_matiere ON devoirs(matiere);

-- ============================================
-- Table COURS
-- ============================================

-- Ajouter la colonne classe
ALTER TABLE cours 
ADD COLUMN IF NOT EXISTS classe TEXT;

-- Ajouter un index sur la colonne classe pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_cours_classe ON cours(classe);

-- Ajouter un index sur la colonne matiere pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_cours_matiere ON cours(matiere);

-- ============================================
-- Table QUIZ
-- ============================================

-- Ajouter la colonne classe
ALTER TABLE quiz 
ADD COLUMN IF NOT EXISTS classe TEXT;

-- Ajouter la colonne date_debut (pour le début du quiz)
ALTER TABLE quiz 
ADD COLUMN IF NOT EXISTS date_debut TIMESTAMP WITH TIME ZONE;

-- Ajouter la colonne duree_par_question_secondes
ALTER TABLE quiz 
ADD COLUMN IF NOT EXISTS duree_par_question_secondes INTEGER;

-- Ajouter la colonne type_questions (tableau JSON)
ALTER TABLE quiz 
ADD COLUMN IF NOT EXISTS type_questions TEXT[];

-- Ajouter la colonne note_automatique
ALTER TABLE quiz 
ADD COLUMN IF NOT EXISTS note_automatique BOOLEAN DEFAULT false;

-- Ajouter un index sur la colonne classe pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_quiz_classe ON quiz(classe);

-- Ajouter un index sur la colonne matiere pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_quiz_matiere ON quiz(matiere);
