-- Ajouter le champ cible_classe à la table avis
ALTER TABLE avis ADD COLUMN IF NOT EXISTS cible_classe TEXT;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_avis_cible_classe ON avis(cible_classe);
