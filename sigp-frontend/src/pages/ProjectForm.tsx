import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function ProjectForm() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate save and redirect to project detail (using id 14 which is the mocked project PROJ-014)
    navigate('/projects/14');
  };

  return (
    <section className="screen active" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="page-head">
        <div>
          <div className="page-title">Créer un Nouveau Projet</div>
          <div className="page-sub">Assistant d'initialisation du projet</div>
        </div>
        <div className="page-actions">
           <Link to="/projects" className="btn">Annuler</Link>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {/* Stepper Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '15px', left: '0', right: '0', height: '2px', backgroundColor: 'var(--line)', zIndex: 0 }}></div>
          
          {[1, 2, 3, 4].map((s) => (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative', background: 'var(--canvas)', padding: '0 10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: step >= s ? 'var(--navy-700)' : 'var(--line)', color: step >= s ? '#fff' : 'var(--slate)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, marginBottom: '8px', transition: 'all 0.3s' }}>
                {step > s ? '✓' : s}
              </div>
              <span style={{ fontSize: '13px', fontWeight: step >= s ? 600 : 400, color: step >= s ? 'var(--ink)' : 'var(--slate)' }}>
                {s === 1 ? 'Généralités' : s === 2 ? 'Gouvernance' : s === 3 ? 'Zone & Dates' : 'Budget & EVM'}
              </span>
            </div>
          ))}
        </div>

        {/* Form Body */}
        <div className="panel" style={{ padding: '30px' }}>
          <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '18px', color: 'var(--navy-900)' }}>Informations Générales</h3>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Code Projet *</label>
                    <input type="text" className="filter-select" style={{ width: '100%', padding: '8px 12px' }} placeholder="Ex: PROJ-055" required />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Nom du Projet *</label>
                    <input type="text" className="filter-select" style={{ width: '100%', padding: '8px 12px' }} placeholder="Saisir le nom complet du projet" required />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Secteur *</label>
                    <select className="filter-select" style={{ width: '100%', padding: '8px 12px' }} required>
                      <option value="">Sélectionner</option>
                      <option value="sante">Santé</option>
                      <option value="education">Éducation</option>
                      <option value="infrastructure">Infrastructures</option>
                      <option value="energie">Énergie</option>
                      <option value="agriculture">Agriculture</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Type de Projet *</label>
                    <select className="filter-select" style={{ width: '100%', padding: '8px 12px' }} required>
                      <option value="">Sélectionner</option>
                      <option value="don">Don</option>
                      <option value="pret">Prêt souverain</option>
                      <option value="assistance">Assistance technique</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Priorité *</label>
                    <select className="filter-select" style={{ width: '100%', padding: '8px 12px' }} required>
                      <option value="normale">Normale</option>
                      <option value="haute">Haute</option>
                      <option value="critique">Critique</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Statut initial *</label>
                    <select className="filter-select" style={{ width: '100%', padding: '8px 12px' }} required>
                      <option value="brouillon">Brouillon</option>
                      <option value="instruction">En instruction</option>
                      <option value="soumis">Soumis pour validation</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Description</label>
                  <textarea className="filter-select" style={{ width: '100%', padding: '8px 12px', minHeight: '80px', resize: 'vertical' }} placeholder="Contexte et justification du projet..."></textarea>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '18px', color: 'var(--navy-900)' }}>Gouvernance & Partenariats</h3>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Bailleur Principal *</label>
                    <select className="filter-select" style={{ width: '100%', padding: '8px 12px' }} required>
                      <option value="">Sélectionner</option>
                      <option value="bm">Banque Mondiale</option>
                      <option value="ue">Union Européenne</option>
                      <option value="usaid">USAID</option>
                      <option value="afd">AFD</option>
                      <option value="pnud">PNUD</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Co-financeurs</label>
                    <input type="text" className="filter-select" style={{ width: '100%', padding: '8px 12px' }} placeholder="Saisir les co-financeurs (optionnel)" />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Institution de tutelle *</label>
                  <input type="text" className="filter-select" style={{ width: '100%', padding: '8px 12px' }} placeholder="Ex: Ministère de l'Énergie, Ministère de la Santé..." required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Agence d'exécution</label>
                  <input type="text" className="filter-select" style={{ width: '100%', padding: '8px 12px' }} placeholder="ONG, Société nationale..." />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Chef de Projet Assigné</label>
                  <select className="filter-select" style={{ width: '100%', padding: '8px 12px' }}>
                    <option value="">Non assigné pour le moment</option>
                    <option value="1">Hassan Diallo</option>
                    <option value="2">Mariam N'Diaye</option>
                  </select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '18px', color: 'var(--navy-900)' }}>Zone Géographique & Planification</h3>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Pays d'intervention *</label>
                  <select className="filter-select" style={{ width: '100%', padding: '8px 12px' }} required>
                    <option value="">Sélectionner un pays</option>
                    <option value="senegal">Sénégal</option>
                    <option value="civ">Côte d'Ivoire</option>
                    <option value="mali">Mali</option>
                    <option value="niger">Niger</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Régions Cibles</label>
                    <input type="text" className="filter-select" style={{ width: '100%', padding: '8px 12px' }} placeholder="Ex: Dakar, Thiès" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Communes / Départements</label>
                    <input type="text" className="filter-select" style={{ width: '100%', padding: '8px 12px' }} placeholder="Précisez les communes" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Date de Début Prévue *</label>
                    <input type="date" className="filter-select" style={{ width: '100%', padding: '8px 12px' }} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Date de Fin Prévue *</label>
                    <input type="date" className="filter-select" style={{ width: '100%', padding: '8px 12px' }} required />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '18px', color: 'var(--navy-900)' }}>Budget Initial & Validation</h3>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Budget Global Initial (BAC) *</label>
                    <input type="number" className="filter-select" style={{ width: '100%', padding: '8px 12px' }} placeholder="Montant total prévu" required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Devise *</label>
                    <select className="filter-select" style={{ width: '100%', padding: '8px 12px' }} required>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="XOF">XOF (FCFA)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Méthode de calcul EVM par défaut *</label>
                  <select className="filter-select" style={{ width: '100%', padding: '8px 12px' }} required>
                    <option value="proportional">Proportionnelle (au coût réel)</option>
                    <option value="milestones">Par Jalons pondérés</option>
                    <option value="physical">Avancement physique (0-100%)</option>
                  </select>
                </div>

                <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--navy-100)', borderRadius: '6px', fontSize: '13px', color: 'var(--navy-900)' }}>
                  <strong>Note importante :</strong> Vous créez la structure de base du projet. Une fois créé, vous accéderez à la Fiche Projet pour renseigner le Cadre Logique, la WBS, les risques et autres métadonnées d'exécution.
                </div>
              </div>
            )}

            {/* Stepper Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--line-soft)' }}>
              <button 
                type="button" 
                className="btn" 
                onClick={handlePrev} 
                disabled={step === 1}
                style={{ opacity: step === 1 ? 0.5 : 1 }}
              >
                Précédent
              </button>
              
              <button type="submit" className="btn btn-primary">
                {step === 4 ? 'Créer la coquille du Projet' : 'Suivant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
