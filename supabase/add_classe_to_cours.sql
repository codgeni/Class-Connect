-- Ajouter la colonne classe à la table cours
ALTER TABLE cours ADD COLUMN IF NOT EXISTS classe TEXT;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_cours_classe ON cours(classe);
