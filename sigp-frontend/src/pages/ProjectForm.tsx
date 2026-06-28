import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateProject } from '@/hooks/useProjects';
import type { Projet } from '@/types';

type CreateProjectFormData = Pick<
  Projet,
  'code_projet' | 'nom_projet' | 'description' | 'bailleur_principal' | 'date_debut' | 'date_fin' | 'budget_total' | 'devise'
> & { statut: Projet['statut'] };

const STEPS = ['Généralités', 'Gouvernance', 'Zone & Dates', 'Budget & EVM'];

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
    <section className="screen active flex flex-col">
      <div className="page-head">
        <div>
          <div className="page-title">Créer un Nouveau Projet</div>
          <div className="page-sub">Assistant d'initialisation du projet</div>
        </div>
        <div className="page-actions">
          <Link to="/projects" className="btn">Annuler</Link>
        </div>
      </div>

      <div className="flex-1 p-5 max-w-3xl mx-auto w-full">
        {/* Stepper Header */}
        <div className="flex justify-between mb-10 relative">
          <div className="absolute top-[15px] left-0 right-0 h-0.5 bg-[var(--line)] z-0" />
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex flex-col items-center z-[1] relative bg-[var(--canvas)] px-2.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold mb-2 transition-all duration-300 ${
                  step >= s ? 'bg-[var(--navy-700)] text-white' : 'bg-[var(--line)] text-[var(--slate)]'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
              <span
                className={`text-[13px] ${
                  step >= s ? 'font-semibold text-[var(--ink)]' : 'font-normal text-[var(--slate)]'
                }`}
              >
                {STEPS[s - 1]}
              </span>
            </div>
          ))}
        </div>

        {/* Form Body */}
        <div className="panel p-4 sm:p-[30px]">
          {createProject.isError && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              Une erreur est survenue lors de la création du projet. Veuillez réessayer.
            </div>
          )}

          <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>

            {/* ── STEP 1 — Informations Générales ── */}
            {step === 1 && (
              <div className="flex flex-col gap-5">
                <h3 className="text-lg font-semibold text-[var(--navy-900)] mb-2.5">Informations Générales</h3>
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="flex-1">
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Code Projet *</label>
                    <input
                      type="text" className="filter-select w-full px-3 py-2"
                      placeholder="Ex: PROJ-055" required
                      value={formData.code_projet ?? ''} onChange={(e) => update('code_projet', e.target.value)}
                    />
                  </div>
                  <div className="flex-[2]">
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Nom du Projet *</label>
                    <input
                      type="text" className="filter-select w-full px-3 py-2"
                      placeholder="Saisir le nom complet du projet" required
                      value={formData.nom_projet ?? ''} onChange={(e) => update('nom_projet', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="flex-1">
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Secteur *</label>
                    <select className="filter-select w-full px-3 py-2" required>
                      <option value="">Sélectionner</option>
                      <option value="sante">Santé</option>
                      <option value="education">Éducation</option>
                      <option value="infrastructure">Infrastructures</option>
                      <option value="energie">Énergie</option>
                      <option value="agriculture">Agriculture</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Type de Projet *</label>
                    <select className="filter-select w-full px-3 py-2" required>
                      <option value="">Sélectionner</option>
                      <option value="don">Don</option>
                      <option value="pret">Prêt souverain</option>
                      <option value="assistance">Assistance technique</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="flex-1">
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Priorité *</label>
                    <select className="filter-select w-full px-3 py-2" required>
                      <option value="normale">Normale</option>
                      <option value="haute">Haute</option>
                      <option value="critique">Critique</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Statut initial *</label>
                    <select
                      className="filter-select w-full px-3 py-2" required
                      value={formData.statut ?? 'PREPARATION'} onChange={(e) => update('statut', e.target.value as Projet['statut'])}
                    >
                      <option value="PREPARATION">Brouillon</option>
                      <option value="ACTIF">En instruction</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Description</label>
                  <textarea
                    className="filter-select w-full px-3 py-2 min-h-[80px] resize-y"
                    placeholder="Contexte et justification du projet..."
                    value={formData.description ?? ''} onChange={(e) => update('description', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* ── STEP 2 — Gouvernance & Partenariats ── */}
            {step === 2 && (
              <div className="flex flex-col gap-5">
                <h3 className="text-lg font-semibold text-[var(--navy-900)] mb-2.5">Gouvernance & Partenariats</h3>
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="flex-1">
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Bailleur Principal *</label>
                    <select
                      className="filter-select w-full px-3 py-2" required
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
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Co-financeurs</label>
                    <input type="text" className="filter-select w-full px-3 py-2" placeholder="Saisir les co-financeurs (optionnel)" />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Institution de tutelle *</label>
                  <input type="text" className="filter-select w-full px-3 py-2" placeholder="Ex: Ministère de l'Énergie, Ministère de la Santé..." required />
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Agence d'exécution</label>
                  <input type="text" className="filter-select w-full px-3 py-2" placeholder="ONG, Société nationale..." />
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Chef de Projet Assigné</label>
                  <select className="filter-select w-full px-3 py-2">
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
                <h3 className="text-lg font-semibold text-[var(--navy-900)] mb-2.5">Zone Géographique & Planification</h3>
                <div>
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Pays d'intervention *</label>
                  <select className="filter-select w-full px-3 py-2" required>
                    <option value="">Sélectionner un pays</option>
                    <option value="senegal">Sénégal</option>
                    <option value="civ">Côte d'Ivoire</option>
                    <option value="mali">Mali</option>
                    <option value="niger">Niger</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="flex-1">
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Régions Cibles</label>
                    <input type="text" className="filter-select w-full px-3 py-2" placeholder="Ex: Dakar, Thiès" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Communes / Départements</label>
                    <input type="text" className="filter-select w-full px-3 py-2" placeholder="Précisez les communes" />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="flex-1">
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Date de Début Prévue *</label>
                    <input
                      type="date" className="filter-select w-full px-3 py-2" required
                      value={formData.date_debut ?? ''} onChange={(e) => update('date_debut', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Date de Fin Prévue *</label>
                    <input
                      type="date" className="filter-select w-full px-3 py-2" required
                      value={formData.date_fin ?? ''} onChange={(e) => update('date_fin', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4 — Budget Initial & Validation ── */}
            {step === 4 && (
              <div className="flex flex-col gap-5">
                <h3 className="text-lg font-semibold text-[var(--navy-900)] mb-2.5">Budget Initial & Validation</h3>
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="flex-[2]">
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Budget Global Initial (BAC) *</label>
                    <input
                      type="number" className="filter-select w-full px-3 py-2"
                      placeholder="Montant total prévu" required
                      value={formData.budget_total ?? ''} onChange={(e) => update('budget_total', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Devise *</label>
                    <select
                      className="filter-select w-full px-3 py-2" required
                      value={formData.devise ?? 'USD'} onChange={(e) => update('devise', e.target.value)}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="XOF">XOF (FCFA)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--ink)]">Méthode de calcul EVM par défaut *</label>
                  <select className="filter-select w-full px-3 py-2" required>
                    <option value="proportional">Proportionnelle (au coût réel)</option>
                    <option value="milestones">Par Jalons pondérés</option>
                    <option value="physical">Avancement physique (0-100%)</option>
                  </select>
                </div>

                <div className="mt-5 p-4 bg-[var(--navy-100)] rounded-md text-[13px] text-[var(--navy-900)]">
                  <strong>Note importante :</strong> Vous créez la structure de base du projet. Une fois créé, vous accéderez à la Fiche Projet pour renseigner le Cadre Logique, la WBS, les risques et autres métadonnées d'exécution.
                </div>
              </div>
            )}

            {/* Stepper Controls */}
            <div className="flex justify-between mt-10 pt-5 border-t border-[var(--line-soft)]">
              <button
                type="button" className="btn" onClick={handlePrev}
                disabled={step === 1}
                style={{ opacity: step === 1 ? 0.5 : 1 }}
              >
                Précédent
              </button>
              <button type="submit" className="btn btn-primary" disabled={createProject.isPending}>
                {step === 4
                  ? createProject.isPending ? 'Création en cours…' : 'Créer la coquille du Projet'
                  : 'Suivant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
