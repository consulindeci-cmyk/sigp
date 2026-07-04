import { useEffect, useState } from 'react';
import { X, Copy } from 'lucide-react';
import type { ConfigurationProjet, CategorieParametre, StatutParametre } from '@/types';
import {
  CATEGORIE_PARAM_OPTIONS, STATUT_PARAM_OPTIONS, TYPE_VALEUR_OPTIONS,
  STATUT_PARAM_LABEL, AUTEURS_PARAM,
} from '@/mocks/settingsMocks';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import { Button }   from '@/components/ui/forms/Button';
import { Input }    from '@/components/ui/forms/Input';
import { Textarea } from '@/components/ui/forms/Textarea';
import { Select }   from '@/components/ui/forms/Select';
import { Badge }    from '@/components/ui/data-display/Badge';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  categorie:     CategorieParametre;
  nom:           string;
  description:   string;
  valeur:        string;
  valeur_defaut: string;
  type_valeur:   ConfigurationProjet['type_valeur'];
  requis:        string;
  modifiable:    string;
  statut:        StatutParametre;
  modifie_par:   string;
}

export interface SettingSavePayload {
  categorie:      CategorieParametre;
  nom:            string;
  description:    string;
  valeur:         string;
  valeur_defaut:  string;
  type_valeur:    ConfigurationProjet['type_valeur'];
  requis:         boolean;
  modifiable:     boolean;
  statut:         StatutParametre;
  date_modification: string;
  modifie_par:    string;
}

export interface SettingSlideOverProps {
  open:         boolean;
  onOpenChange: (v: boolean) => void;
  mode:         'new' | 'edit' | 'view';
  setting?:     ConfigurationProjet | null;
  onSave:       (payload: SettingSavePayload, id?: string) => void;
  onDelete?:    (id: string) => void;
  onDuplicate?: (setting: ConfigurationProjet) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statutVariant(s: StatutParametre): 'default' | 'success' | 'warning' | 'secondary' | 'destructive' | 'info' {
  if (s === 'ACTIF')      return 'success';
  if (s === 'INACTIF')    return 'secondary';
  if (s === 'EN_ATTENTE') return 'warning';
  if (s === 'OBSOLETE')   return 'destructive';
  return 'default';
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return iso; }
}

const INIT: FormState = {
  categorie:     'Général',
  nom:           '',
  description:   '',
  valeur:        '',
  valeur_defaut: '',
  type_valeur:   'TEXTE',
  requis:        'false',
  modifiable:    'true',
  statut:        'ACTIF',
  modifie_par:   'Amadou Diallo',
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 items-start text-sm py-2 border-b border-border last:border-b-0">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-0.5">{label}</span>
      <span className="text-sm text-foreground font-medium leading-relaxed">{value}</span>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SettingSlideOver({
  open, onOpenChange, mode, setting, onSave, onDelete, onDuplicate,
}: SettingSlideOverProps) {
  const [form, setForm]               = useState<FormState>(INIT);
  const [errors, setErrors]           = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const readOnly = mode === 'view';

  useEffect(() => {
    if (!open) { setConfirmDelete(false); return; }
    if ((mode === 'edit' || mode === 'view') && setting) {
      setForm({
        categorie:     setting.categorie,
        nom:           setting.nom,
        description:   setting.description,
        valeur:        setting.valeur,
        valeur_defaut: setting.valeur_defaut,
        type_valeur:   setting.type_valeur,
        requis:        setting.requis    ? 'true' : 'false',
        modifiable:    setting.modifiable ? 'true' : 'false',
        statut:        setting.statut,
        modifie_par:   setting.modifie_par,
      });
    } else {
      setForm(INIT);
    }
    setErrors({});
    setConfirmDelete(false);
  }, [open, mode, setting]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.nom.trim())         e.nom         = 'Le nom est requis.';
    if (!form.description.trim()) e.description = 'La description est requise.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const today = new Date().toISOString().slice(0, 10);
    onSave(
      {
        categorie:        form.categorie,
        nom:              form.nom.trim(),
        description:      form.description.trim(),
        valeur:           form.valeur.trim(),
        valeur_defaut:    form.valeur_defaut.trim(),
        type_valeur:      form.type_valeur,
        requis:           form.requis    === 'true',
        modifiable:       form.modifiable === 'true',
        statut:           form.statut,
        date_modification: today,
        modifie_par:      form.modifie_par.trim() || 'Amadou Diallo',
      },
      setting?.id,
    );
    onOpenChange(false);
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    if (setting?.id) onDelete?.(setting.id);
    onOpenChange(false);
  }

  const title =
    mode === 'new'  ? 'Nouveau paramètre' :
    mode === 'edit' ? 'Modifier le paramètre' :
    'Détail du paramètre';

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>

        {/* ── Header ── */}
        <SlideOverHeader>
          <div>
            <SlideOverTitle>{title}</SlideOverTitle>
            {setting && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {setting.code_param} · modifié le {fmtDate(setting.date_modification)}
              </p>
            )}
          </div>
          <SlideOverClose asChild>
            <Button variant="ghost" size="icon" aria-label="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </SlideOverClose>
        </SlideOverHeader>

        {/* ── Body ── */}
        <SlideOverBody className="space-y-5">

          {/* Résumé visuel (view/edit) */}
          {setting && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <Badge variant="outline" className="text-[10px]">{setting.categorie}</Badge>
                  <Badge variant={statutVariant(setting.statut)} className="text-[10px]">
                    {STATUT_PARAM_LABEL[setting.statut]}
                  </Badge>
                  {setting.requis && (
                    <Badge variant="info" className="text-[10px]">Requis</Badge>
                  )}
                  {!setting.modifiable && (
                    <Badge variant="secondary" className="text-[10px]">Non modifiable</Badge>
                  )}
                </div>
                <p className="text-[13px] font-semibold text-foreground leading-snug">{setting.nom}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{setting.code_param}</p>
              </div>
              {onDuplicate && mode === 'view' && (
                <Button
                  variant="outline" size="sm"
                  onClick={() => { onDuplicate(setting); onOpenChange(false); }}
                  aria-label="Dupliquer"
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Dupliquer
                </Button>
              )}
            </div>
          )}

          {/* Section: Identification */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Identification
            </p>

            {readOnly ? (
              <div className="rounded-lg border border-border bg-card p-3 divide-y divide-border">
                <Row label="Catégorie" value={<Badge variant="outline" className="text-[10px]">{setting?.categorie}</Badge>} />
                <Row label="Nom" value={setting?.nom} />
                <Row label="Description" value={
                  <span className="text-[12px] leading-relaxed whitespace-pre-wrap">{setting?.description}</span>
                } />
                <Row label="Type" value={
                  <span className="font-mono text-[11px]">{setting?.type_valeur}</span>
                } />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="prm-categorie">Catégorie</label>
                  <Select
                    id="prm-categorie"
                    value={form.categorie}
                    onChange={e => set('categorie', e.target.value as CategorieParametre)}
                  >
                    {CATEGORIE_PARAM_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="prm-nom">
                    Nom <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="prm-nom"
                    value={form.nom}
                    onChange={e => set('nom', e.target.value)}
                    placeholder="Ex : Seuil alerte budget"
                    error={!!errors.nom}
                  />
                  {errors.nom && <p className="text-xs text-destructive">{errors.nom}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="prm-description">
                    Description <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    id="prm-description"
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    placeholder="Description détaillée de ce paramètre…"
                    rows={3}
                    className="resize-none"
                  />
                  {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="prm-type">Type de valeur</label>
                  <Select
                    id="prm-type"
                    value={form.type_valeur}
                    onChange={e => set('type_valeur', e.target.value as ConfigurationProjet['type_valeur'])}
                  >
                    {TYPE_VALEUR_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Section: Valeur */}
          <div className="space-y-4 pt-1 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">
              Valeur
            </p>

            {readOnly ? (
              <div className="rounded-lg border border-border bg-card p-3 divide-y divide-border">
                <Row label="Valeur actuelle" value={
                  <span className="font-mono text-[12px] bg-muted px-2 py-0.5 rounded">
                    {setting?.valeur || '—'}
                  </span>
                } />
                <Row label="Valeur par défaut" value={
                  <span className="font-mono text-[12px] text-muted-foreground">
                    {setting?.valeur_defaut || '—'}
                  </span>
                } />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="prm-valeur">Valeur actuelle</label>
                  <Input
                    id="prm-valeur"
                    value={form.valeur}
                    onChange={e => set('valeur', e.target.value)}
                    placeholder="Valeur du paramètre"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="prm-defaut">Valeur par défaut</label>
                  <Input
                    id="prm-defaut"
                    value={form.valeur_defaut}
                    onChange={e => set('valeur_defaut', e.target.value)}
                    placeholder="Valeur par défaut"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section: Configuration */}
          <div className="space-y-4 pt-1 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">
              Configuration
            </p>

            {readOnly ? (
              <div className="rounded-lg border border-border bg-card p-3 divide-y divide-border">
                <Row label="Statut" value={
                  <Badge variant={statutVariant(setting?.statut ?? 'ACTIF')} className="text-[10px]">
                    {STATUT_PARAM_LABEL[setting?.statut ?? 'ACTIF']}
                  </Badge>
                } />
                <Row label="Requis" value={setting?.requis ? 'Oui' : 'Non'} />
                <Row label="Modifiable" value={setting?.modifiable ? 'Oui' : 'Non'} />
                <Row label="Modifié par" value={setting?.modifie_par} />
                <Row label="Dernière modification" value={fmtDate(setting?.date_modification ?? '')} />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground" htmlFor="prm-statut">Statut</label>
                    <Select
                      id="prm-statut"
                      value={form.statut}
                      onChange={e => set('statut', e.target.value as StatutParametre)}
                    >
                      {STATUT_PARAM_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground" htmlFor="prm-modifie-par">Modifié par</label>
                    <Select
                      id="prm-modifie-par"
                      value={form.modifie_par}
                      onChange={e => set('modifie_par', e.target.value)}
                    >
                      {AUTEURS_PARAM.map(a => <option key={a} value={a}>{a}</option>)}
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground" htmlFor="prm-requis">Requis</label>
                    <Select
                      id="prm-requis"
                      value={form.requis}
                      onChange={e => set('requis', e.target.value)}
                    >
                      <option value="true">Oui</option>
                      <option value="false">Non</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground" htmlFor="prm-modifiable">Modifiable</label>
                    <Select
                      id="prm-modifiable"
                      value={form.modifiable}
                      onChange={e => set('modifiable', e.target.value)}
                    >
                      <option value="true">Oui</option>
                      <option value="false">Non</option>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Supprimer (edit) */}
          {mode === 'edit' && setting && onDelete && (
            <div className="pt-2 border-t border-border">
              {confirmDelete ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                  <p className="text-xs text-destructive font-medium">
                    Confirmer la suppression de « {setting.nom} » ?
                  </p>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                      Supprimer définitivement
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost" size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  Supprimer ce paramètre
                </Button>
              )}
            </div>
          )}
        </SlideOverBody>

        {/* ── Footer ── */}
        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">Fermer</Button>
          </SlideOverClose>
          {!readOnly && (
            <Button onClick={handleSave}>
              {mode === 'new' ? 'Créer le paramètre' : 'Enregistrer'}
            </Button>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}
