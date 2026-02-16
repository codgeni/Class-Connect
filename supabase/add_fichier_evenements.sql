-- Ajouter une colonne pour stocker l'URL d'un fichier lié à un événement
ALTER TABLE evenements ADD COLUMN IF NOT EXISTS fichier_url TEXT;

-- Index optionnel pour les recherches par fichier
CREATE INDEX IF NOT EXISTS idx_evenements_fichier_url ON evenements(fichier_url);

