-- Script simple pour ajouter la colonne email à la table users
-- À exécuter dans Supabase SQL Editor

-- Ajouter la colonne email
ALTER TABLE users ADD COLUMN email TEXT;

-- Ajouter un index
CREATE INDEX idx_users_email ON users(email);
