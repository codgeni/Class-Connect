-- Ajouter le champ cible_classe à la table avis (version sécurisée)
-- Ce script vérifie d'abord si la colonne existe avant de l'ajouter

DO $$
BEGIN
    -- Vérifier si la colonne existe déjà
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'avis'
        AND column_name = 'cible_classe'
    ) THEN
        -- Ajouter la colonne si elle n'existe pas
        ALTER TABLE avis ADD COLUMN cible_classe TEXT;
        
        -- Créer l'index pour améliorer les performances
        CREATE INDEX IF NOT EXISTS idx_avis_cible_classe ON avis(cible_classe);
        
        RAISE NOTICE 'Colonne cible_classe ajoutée à la table avis avec succès';
    ELSE
        RAISE NOTICE 'La colonne cible_classe existe déjà dans la table avis';
    END IF;
END $$;
