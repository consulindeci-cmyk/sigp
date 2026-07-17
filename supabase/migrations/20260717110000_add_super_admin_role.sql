-- Multi-tenant Phase 1, étape 1/5 : ajoute SUPER_ADMIN comme valeur valide de
-- l'enum public."UserRole" (confirmé via information_schema : type ENUM natif,
-- pas de contrainte CHECK). Cette valeur n'est PAS encore utilisée par aucune
-- fonction/policy à ce stade — ajout pur, sans changement de comportement.
--
-- ALTER TYPE ... ADD VALUE ne doit jamais être suivi, dans la même transaction/
-- le même fichier de migration, d'une utilisation de cette nouvelle valeur —
-- d'où ce fichier dédié, ne contenant que cette seule instruction.

ALTER TYPE public."UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
