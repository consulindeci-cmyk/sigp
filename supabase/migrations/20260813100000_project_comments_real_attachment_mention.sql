-- ═══════════════════════════════════════════════════════════════════════════
-- Module Commentaires — remplacement des champs texte libre "piece_jointe"
-- et "mention" par de vraies références (cf. audit) :
-- - piece_jointe (texte libre, ex: "rapport_mars.pdf" tapé au clavier, sans
--   fichier réel derrière) -> piece_jointe_document_id, référence réelle vers
--   documents_projet (le fichier est réellement stocké dans sigp-documents
--   via documents-create + documents-upload-version, comme partout ailleurs).
-- - mention (texte libre, ex: "Amadou Diallo" tapé au clavier, sans lien vers
--   un utilisateur réel) -> mention_user_id, référence réelle vers users.
--
-- Les anciennes colonnes texte restent en base (lignes historiques), mais ne
-- sont plus alimentées par les Edge Functions comments-create/comments-update
-- à partir de cette migration.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.project_comments
  ADD COLUMN IF NOT EXISTS piece_jointe_document_id uuid REFERENCES public.documents_projet(id),
  ADD COLUMN IF NOT EXISTS mention_user_id uuid REFERENCES public.users(id);

NOTIFY pgrst, 'reload schema';
