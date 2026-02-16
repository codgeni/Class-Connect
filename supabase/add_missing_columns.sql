-- Script pour ajouter toutes les colonnes manquantes à la table users
-- À exécuter dans Supabase SQL Editor
-- Si vous obtenez une erreur "column already exists", c'est normal, la colonne existe déjà

-- Ajouter la colonne prenom
ALTER TABLE users ADD COLUMN prenom TEXT;

-- Ajouter la colonne email (si pas déjà fait)
ALTER TABLE users ADD COLUMN email TEXT;

-- Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_prenom ON users(prenom);
