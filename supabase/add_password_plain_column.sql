-- Script pour ajouter la colonne password_plain à la table users
-- À exécuter dans Supabase SQL Editor
-- Cette colonne stocke le mot de passe en clair pour que l'admin puisse le voir

ALTER TABLE users ADD COLUMN password_plain TEXT;
