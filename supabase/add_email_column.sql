-- Script pour ajouter la colonne email à la table users
-- À exécuter dans Supabase SQL Editor

-- Vérifier et ajouter la colonne email si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'users' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE users ADD COLUMN email TEXT;
    END IF;
END $$;

-- Ajouter un index pour améliorer les performances des requêtes par email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
