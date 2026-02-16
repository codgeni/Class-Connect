-- Ajouter la colonne classe à la table quiz
ALTER TABLE quiz ADD COLUMN IF NOT EXISTS classe TEXT;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_quiz_classe ON quiz(classe);
