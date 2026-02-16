-- Script pour réinitialiser le mot de passe d'un utilisateur
-- Remplacez 'INS-413494' par le code de connexion de l'utilisateur
-- Remplacez 'NOUVEAU_MOT_DE_PASSE' par le nouveau mot de passe souhaité

-- IMPORTANT: Ce script nécessite bcrypt. 
-- Pour générer un hash bcrypt, utilisez un outil en ligne ou Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('NOUVEAU_MOT_DE_PASSE', 12);
-- console.log(hash);

-- Exemple: Si le nouveau mot de passe est "INS-AbC123XyZ"
-- Le hash pourrait être: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5KvK5KvK5KvK5K

-- Mettre à jour le mot de passe (remplacez le hash ci-dessous)
-- UPDATE users 
-- SET password_hash = '$2a$12$VOTRE_HASH_BCRYPT_ICI'
-- WHERE code_login = 'INS-413494';

-- Vérifier l'utilisateur après mise à jour
SELECT 
  code_login,
  nom,
  role,
  actif,
  password_hash IS NOT NULL as has_password,
  LENGTH(password_hash) as password_hash_length
FROM users
WHERE code_login = 'INS-413494';
