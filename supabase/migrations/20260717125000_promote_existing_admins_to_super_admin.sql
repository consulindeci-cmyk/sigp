-- Multi-tenant Phase 1, étape "charnière" — doit s'exécuter APRÈS l'ajout de
-- la valeur d'enum SUPER_ADMIN (20260717110000) et AVANT la bascule de
-- is_admin() (20260717130000), pour qu'il n'y ait jamais un instant où aucun
-- compte ne passe is_admin().
--
-- Décision validée avec l'utilisateur : les comptes ADMIN existants gardent
-- leur comportement actuel (voient toutes les organisations) — ils sont donc
-- promus SUPER_ADMIN. Le rôle ADMIN devient le nouveau rôle scopé
-- ("org_admin") pour l'avenir.

UPDATE public.users SET role = 'SUPER_ADMIN' WHERE role = 'ADMIN';
