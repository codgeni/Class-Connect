-- Script pour vérifier les utilisateurs et leurs codes de connexion
-- À exécuter dans Supabase SQL Editor pour déboguer les problèmes de connexion

-- Voir tous les utilisateurs avec leurs codes de connexion
SELECT 
  id,
  nom,
  prenom,
  role,
  code_login,
  actif,
  created_at
FROM users
ORDER BY created_at DESC;

-- Chercher un utilisateur spécifique par code
-- Remplacez 'INS-413494' par le code que vous cherchez
SELECT 
  id,
  nom,
  prenom,
  role,
  code_login,
  actif,
  password_hash IS NOT NULL as has_password
FROM users
WHERE code_login = 'INS-413494';

-- Voir tous les codes de connexion qui commencent par INS-
SELECT 
  code_login,
  nom,
  role,
  actif
FROM users
WHERE code_login LIKE 'INS-%'
ORDER BY code_login;

-- Vérifier les utilisateurs inactifs
SELECT 
  code_login,
  nom,
  role,
  actif
FROM users
WHERE actif = false;
