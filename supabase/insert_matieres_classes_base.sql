-- Script pour insérer des matières et classes de base
-- À exécuter dans Supabase SQL Editor si les tables sont vides

-- Insérer des classes de base
INSERT INTO classes (nom) VALUES 
  ('Secondaire 1'),
  ('Secondaire 2'),
  ('Secondaire 3')
ON CONFLICT (nom) DO NOTHING;

-- Insérer des matières de base
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
