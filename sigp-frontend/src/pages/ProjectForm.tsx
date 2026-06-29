import { PageHeader } from '@/components/layout/PageHeader';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateProject } from '@/hooks/useProjects';
import { Button } from '@/components/ui/forms/Button';
import type { Projet } from '@/types';

type CreateProjectFormData = Pick<
  Projet,
  'code_projet' | 'nom_projet' | 'description' | 'bailleur_principal' | 'date_debut' | 'date_fin' | 'budget_total' | 'devise'
> & { statut: Projet['statut'] };

const STEPS = ['Généralités', 'Gouvernance', 'Zone & Dates', 'Budget & EVM'];

const FIELD_CLASS = 'w-full h-9 px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors placeholder:text-muted-foreground'
const TEXTAREA_CLASS = 'w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors placeholder:text-muted-foreground min-h-[80px] resize-y'
const LABEL_CLASS = 'block text-[13px] font-medium mb-1.5 text-foreground'

export default function ProjectForm() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const createProject = useCreateProject();

  const [formData, setFormData] = useState<Partial<CreateProjectFormData>>({
    devise: 'USD',
    statut: 'PREPARATION',
  });

  const update = (field: keyof CreateProjectFormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newProject = await createProject.mutateAsync({
        code_projet: formData.code_projet,
        nom_projet: formData.nom_projet,
        description: formData.description,
        bailleur_principal: formData.bailleur_principal ?? '',
        date_debut: formData.date_debut ?? '',
        date_fin: formData.date_fin ?? '',
        budget_total: formData.budget_total ?? '0',
        devise: formData.devise ?? 'USD',
        statut: formData.statut ?? 'PREPARATION',
      });
      navigate(`/projects/${newProject.id}`);
    } catch {
      // error exposed via createProject.isError / createProject.error
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
        <div>
          <PageHeader 
            title="Créer un Nouveau Projet" 
            description="Assistant d'initialisation du projet" 
          />
        </div>
        <Link to="/projects">
          <Button variant="outline" size="sm" className="h-8 text-xs">Annuler</Button>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">

          {/* Stepper Header */}
          <div className="flex justify-between relative">
            <div className="absolute top-[15px] left-0 right-0 h-0.5 bg-border z-0" />
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex flex-col items-center z-[1] relative bg-background px-2.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold mb-2 transition-all duration-300 text-sm ${
                    step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step > s ? '✓' : s}
                </div>
                <span
                  className={`text-[13px] ${
                    step >= s ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground'
                  }`}
                >
                  {STEPS[s - 1]}
                </span>
              </div>
            ))}
          </div>

          {/* Form Body */}
          <div className="bg-card border border-border rounded-lg p-6 sm:p-8">
            {createProject.isError && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                Une erreur est survenue lors de la création du projet. Veuillez réessayer.
              </div>
            )}

            <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>

              {/* ── STEP 1 — Informations Générales ── */}
              {step === 1 && (
                <div className="flex flex-col gap-5">
                  <h3 className="text-lg font-semibold text-foreground mb-2.5">Informations Générales</h3>
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="flex-1">
                      <label className={LABEL_CLASS}>Code Projet *</label>
                      <input
                        type="text" className={FIELD_CLASS}
                        placeholder="Ex: PROJ-055" required
                        value={formData.code_projet ?? ''} onChange={(e) => update('code_projet', e.target.value)}
                      />
                    </div>
                    <div className="flex-[2]">
                      <label className={LABEL_CLASS}>Nom du Projet *</label>
                      <input
                        type="text" className={FIELD_CLASS}
                        placeholder="Saisir le nom complet du projet" required
                        value={formData.nom_projet ?? ''} onChange={(e) => update('nom_projet', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="flex-1">
                      <label className={LABEL_CLASS}>Secteur *</label>
                      <select className={FIELD_CLASS} required>
                        <option value="">Sélectionner</option>
                        <option value="sante">Santé</option>
                        <option value="education">Éducation</option>
                        <option value="infrastructure">Infrastructures</option>
                        <option value="energie">Énergie</option>
                        <option value="agriculture">Agriculture</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className={LABEL_CLASS}>Type de Projet *</label>
                      <select className={FIELD_CLASS} required>
                        <option value="">Sélectionner</option>
                        <option value="don">Don</option>
                        <option value="pret">Prêt souverain</option>
                        <option value="assistance">Assistance technique</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="flex-1">
                      <label className={LABEL_CLASS}>Priorité *</label>
                      <select className={FIELD_CLASS} required>
                        <option value="normale">Normale</option>
                        <option value="haute">Haute</option>
                        <option value="critique">Critique</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className={LABEL_CLASS}>Statut initial *</label>
                      <select
                        className={FIELD_CLASS} required
                        value={formData.statut ?? 'PREPARATION'} onChange={(e) => update('statut', e.target.value as Projet['statut'])}
                      >
                        <option value="PREPARATION">Brouillon</option>
                        <option value="ACTIF">En instruction</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Description</label>
                    <textarea
                      className={TEXTAREA_CLASS}
                      placeholder="Contexte et justification du projet..."
                      value={formData.description ?? ''} onChange={(e) => update('description', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* ── STEP 2 — Gouvernance & Partenariats ── */}
              {step === 2 && (
                <div className="flex flex-col gap-5">
                  <h3 className="text-lg font-semibold text-foreground mb-2.5">Gouvernance &amp; Partenariats</h3>
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="flex-1">
                      <label className={LABEL_CLASS}>Bailleur Principal *</label>
                      <select
                        className={FIELD_CLASS} required
                        value={formData.bailleur_principal ?? ''} onChange={(e) => update('bailleur_principal', e.target.value)}
                      >
                        <option value="">Sélectionner</option>
                        <option value="bm">Banque Mondiale</option>
                        <option value="ue">Union Européenne</option>
                        <option value="usaid">USAID</option>
                        <option value="afd">AFD</option>
                        <option value="pnud">PNUD</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className={LABEL_CLASS}>Co-financeurs</label>
                      <input type="text" className={FIELD_CLASS} placeholder="Saisir les co-financeurs (optionnel)" />
                    </div>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Institution de tutelle *</label>
                    <input type="text" className={FIELD_CLASS} placeholder="Ex: Ministère de l'Énergie, Ministère de la Santé..." required />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Agence d'exécution</label>
                    <input type="text" className={FIELD_CLASS} placeholder="ONG, Société nationale..." />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Chef de Projet Assigné</label>
                    <select className={FIELD_CLASS}>
                      <option value="">Non assigné pour le moment</option>
                      <option value="1">Hassan Diallo</option>
                      <option value="2">Mariam N'Diaye</option>
                    </select>
                  </div>
                </div>
              )}

              {/* ── STEP 3 — Zone Géographique & Planification ── */}
              {step === 3 && (
                <div className="flex flex-col gap-5">
                  <h3 className="text-lg font-semibold text-foreground mb-2.5">Zone Géographique &amp; Planification</h3>
                  <div>
                    <label className={LABEL_CLASS}>Pays d'intervention *</label>
                    <select className={FIELD_CLASS} required>
                      <option value="">Sélectionner un pays</option>
                      <option value="senegal">Sénégal</option>
                      <option value="civ">Côte d'Ivoire</option>
                      <option value="mali">Mali</option>
                      <option value="niger">Niger</option>
                    </select>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="flex-1">
                      <label className={LABEL_CLASS}>Régions Cibles</label>
                      <input type="text" className={FIELD_CLASS} placeholder="Ex: Dakar, Thiès" />
                    </div>
                    <div className="flex-1">
                      <label className={LABEL_CLASS}>Communes / Départements</label>
                      <input type="text" className={FIELD_CLASS} placeholder="Précisez les communes" />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="flex-1">
                      <label className={LABEL_CLASS}>Date de Début Prévue *</label>
                      <input
                        type="date" className={FIELD_CLASS} required
                        value={formData.date_debut ?? ''} onChange={(e) => update('date_debut', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className={LABEL_CLASS}>Date de Fin Prévue *</label>
                      <input
                        type="date" className={FIELD_CLASS} required
                        value={formData.date_fin ?? ''} onChange={(e) => update('date_fin', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 4 — Budget Initial & Validation ── */}
              {step === 4 && (
                <div className="flex flex-col gap-5">
                  <h3 className="text-lg font-semibold text-foreground mb-2.5">Budget Initial &amp; Validation</h3>
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="flex-[2]">
                      <label className={LABEL_CLASS}>Budget Global Initial (BAC) *</label>
                      <input
                        type="number" className={FIELD_CLASS}
                        placeholder="Montant total prévu" required
                        value={formData.budget_total ?? ''} onChange={(e) => update('budget_total', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className={LABEL_CLASS}>Devise *</label>
                      <select
                        className={FIELD_CLASS} required
                        value={formData.devise ?? 'USD'} onChange={(e) => update('devise', e.target.value)}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="XOF">XOF (FCFA)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={LABEL_CLASS}>Méthode de calcul EVM par défaut *</label>
                    <select className={FIELD_CLASS} required>
                      <option value="proportional">Proportionnelle (au coût réel)</option>
                      <option value="milestones">Par Jalons pondérés</option>
                      <option value="physical">Avancement physique (0-100%)</option>
                    </select>
                  </div>

                  <div className="mt-2 p-4 bg-primary/5 border border-primary/20 rounded-md text-[13px] text-foreground">
                    <strong>Note importante :</strong> Vous créez la structure de base du projet. Une fois créé, vous accéderez à la Fiche Projet pour renseigner le Cadre Logique, la WBS, les risques et autres métadonnées d'exécution.
                  </div>
                </div>
              )}

              {/* Stepper Controls */}
              <div className="flex justify-between mt-10 pt-5 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={step === 1}
                  className="h-9"
                >
                  Précédent
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={createProject.isPending}
                  className="h-9"
                >
                  {step === 4
                    ? createProject.isPending ? 'Création en cours…' : 'Créer la coquille du Projet'
                    : 'Suivant'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
