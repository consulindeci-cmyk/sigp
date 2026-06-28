import { useState, useEffect } from 'react';
import { CheckCircle2, Save, Monitor, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/forms/Button';
import { Select } from '@/components/ui/forms/Select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/Card';
import {
  type UserPreferences, type Apparence, type DensiteAffichage, type FormatDate,
  LANGUES, TIMEZONES, DEVISES, FORMATS_DATE,
} from '@/mocks/settingsMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function OptionCard<T extends string>({
  value, current, onChange, label, icon, description,
}: {
  value: T;
  current: T;
  onChange: (v: T) => void;
  label: string;
  icon: React.ReactNode;
  description?: string;
}) {
  const selected = value === current;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      aria-pressed={selected}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all text-center w-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        selected
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
      )}
    >
      <div className="h-8 w-8 flex items-center justify-center" aria-hidden="true">{icon}</div>
      <span className="text-[12px] font-semibold">{label}</span>
      {description && <span className="text-[10px] text-muted-foreground">{description}</span>}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PreferencesSection
// ─────────────────────────────────────────────────────────────────────────────

interface PreferencesSectionProps {
  preferences: UserPreferences;
  onSave: (updated: UserPreferences) => void;
}

export function PreferencesSection({ preferences, onSave }: PreferencesSectionProps) {
  const [form, setForm] = useState<UserPreferences>({ ...preferences });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm({ ...preferences }); }, [preferences]);

  function set<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    setSaving(true);
    setSaved(false);
    setTimeout(() => {
      onSave(form);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 700);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Apparence */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Apparence</CardTitle>
          <CardDescription>Choisissez le thème visuel de l'interface.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 max-w-sm">
            <OptionCard<Apparence>
              value="light" current={form.apparence} onChange={(v) => set('apparence', v)}
              label="Clair" icon={<Sun className="h-5 w-5" />} description="Toujours clair"
            />
            <OptionCard<Apparence>
              value="dark" current={form.apparence} onChange={(v) => set('apparence', v)}
              label="Sombre" icon={<Moon className="h-5 w-5" />} description="Toujours sombre"
            />
            <OptionCard<Apparence>
              value="system" current={form.apparence} onChange={(v) => set('apparence', v)}
              label="Système" icon={<Monitor className="h-5 w-5" />} description="Auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Densité */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Densité d'affichage</CardTitle>
          <CardDescription>Ajustez l'espacement entre les éléments.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 max-w-sm">
            {([
              { value: 'compact', label: 'Compacte', desc: 'Plus d\'info' },
              { value: 'normal',  label: 'Normal',   desc: 'Équilibré' },
              { value: 'confortable', label: 'Aéré',  desc: 'Plus d\'espace' },
            ] as const).map(({ value, label, desc }) => (
              <OptionCard<DensiteAffichage>
                key={value}
                value={value} current={form.densiteAffichage} onChange={(v) => set('densiteAffichage', v)}
                label={label} description={desc}
                icon={
                  <div className="flex flex-col gap-0.5 w-7" aria-hidden="true">
                    {Array.from({ length: value === 'compact' ? 5 : value === 'normal' ? 4 : 3 }).map((_, i) => (
                      <div key={i} className="h-1 w-full rounded-full bg-current opacity-60" />
                    ))}
                  </div>
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Localisation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Langue et région</CardTitle>
          <CardDescription>Paramètres de localisation et de format.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="pref-langue">
                Langue de l'interface
              </label>
              <Select
                id="pref-langue"
                value={form.langue}
                onChange={(e) => set('langue', e.target.value)}
              >
                {LANGUES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="pref-tz">
                Fuseau horaire
              </label>
              <Select
                id="pref-tz"
                value={form.fuseauHoraire}
                onChange={(e) => set('fuseauHoraire', e.target.value)}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="pref-format-date">
                Format de date
              </label>
              <Select
                id="pref-format-date"
                value={form.formatDate}
                onChange={(e) => set('formatDate', e.target.value as FormatDate)}
              >
                {FORMATS_DATE.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="pref-devise">
                Devise
              </label>
              <Select
                id="pref-devise"
                value={form.devise}
                onChange={(e) => set('devise', e.target.value)}
              >
                {DEVISES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="pref-premier-jour">
                Premier jour de la semaine
              </label>
              <Select
                id="pref-premier-jour"
                value={form.premierJourSemaine}
                onChange={(e) => set('premierJourSemaine', e.target.value as 'Lundi' | 'Dimanche')}
              >
                <option value="Lundi">Lundi</option>
                <option value="Dimanche">Dimanche</option>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="pref-format-nb">
                Format des nombres
              </label>
              <Select
                id="pref-format-nb"
                value={form.formatNombre}
                onChange={(e) => set('formatNombre', e.target.value as 'FR' | 'EN')}
              >
                <option value="FR">Français — 1 234,56</option>
                <option value="EN">Anglais — 1,234.56</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-success" aria-live="polite">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Préférences appliquées
          </span>
        )}
        <Button
          variant="default"
          onClick={handleSave}
          disabled={saving}
          leftIcon={<Save className="h-4 w-4" />}
        >
          {saving ? 'Application...' : 'Appliquer'}
        </Button>
      </div>
    </div>
  );
}
