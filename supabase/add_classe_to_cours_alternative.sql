-- Version alternative si IF NOT EXISTS ne fonctionne pas
-- Vérifier d'abord si la colonne existe, puis l'ajouter si nécessaire

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'cours'
        AND column_name = 'classe'
    ) THEN
        ALTER TABLE cours ADD COLUMN classe TEXT;
    END IF;
END $$;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_cours_classe ON cours(classe);
