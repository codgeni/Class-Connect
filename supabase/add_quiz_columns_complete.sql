-- Ajouter toutes les colonnes nécessaires pour la table quiz

-- Colonne pour la durée par question en secondes
ALTER TABLE quiz ADD COLUMN IF NOT EXISTS duree_par_question_secondes INTEGER;

-- Colonne pour les types de questions (tableau de textes)
ALTER TABLE quiz ADD COLUMN IF NOT EXISTS type_questions TEXT[];

-- Colonne pour la notation automatique
ALTER TABLE quiz ADD COLUMN IF NOT EXISTS note_automatique BOOLEAN DEFAULT TRUE;

-- Colonne pour la classe (si pas déjà ajoutée)
ALTER TABLE quiz ADD COLUMN IF NOT EXISTS classe TEXT;

-- Colonne pour les questions (JSONB pour stocker les questions)
-- Si la colonne existe déjà en TEXT, on peut la laisser ou la convertir
DO $$
BEGIN
    -- Vérifier si la colonne questions existe et son type
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'quiz' 
        AND column_name = 'questions'
    ) THEN
        ALTER TABLE quiz ADD COLUMN questions JSONB;
    ELSIF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'quiz' 
        AND column_name = 'questions'
        AND data_type = 'text'
    ) THEN
        -- Convertir TEXT en JSONB si nécessaire
        ALTER TABLE quiz ALTER COLUMN questions TYPE JSONB USING questions::jsonb;
    END IF;
END $$;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_quiz_classe ON quiz(classe);
CREATE INDEX IF NOT EXISTS idx_quiz_type_questions ON quiz USING GIN(type_questions);
CREATE INDEX IF NOT EXISTS idx_quiz_note_automatique ON quiz(note_automatique);

-- Commentaires pour documentation
COMMENT ON COLUMN quiz.duree_par_question_secondes IS 'Durée limite par question en secondes (optionnel)';
COMMENT ON COLUMN quiz.type_questions IS 'Tableau des types de questions autorisées (qcm, vrai_faux, ouverte)';
COMMENT ON COLUMN quiz.note_automatique IS 'Indique si la notation est automatique (pour QCM et Vrai/Faux)';
COMMENT ON COLUMN quiz.classe IS 'Classe ciblée par le quiz';
COMMENT ON COLUMN quiz.questions IS 'Questions du quiz au format JSON';
