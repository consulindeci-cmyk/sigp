import React from 'react';

interface ProjectHeaderProps {
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
}

export default function ProjectHeader({ isEditing, setIsEditing }: ProjectHeaderProps) {
  // Mock data for the header
  const completeness = 35;
  const physicalProgress = 76;
  const financialProgress = 68.7;
  
  return (
    <div className="panel" style={{ marginBottom: '20px', borderTop: '4px solid var(--navy-700)', borderRadius: '8px' }}>
      <div className="panel-body" style={{ padding: '24px' }}>
        
        {/* Top Row: Title & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span className="cell-mono" style={{ fontSize: '14px', background: 'var(--navy-100)', padding: '4px 8px', borderRadius: '4px', color: 'var(--navy-900)' }}>PROJ-014</span>
              <span className="chip" style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}>En retard</span>
              <span className="chip" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>Priorité: Critique</span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--navy-900)', margin: 0 }}>Électrification Rurale Phase II</h1>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className={`btn ${isEditing ? 'btn-primary' : ''}`} onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? '✓ Terminer l\'édition' : '✏️ Éditer la coquille'}
            </button>
            <button className="btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 3v13m0 0 4-4m-4 4-4-4"/><path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>
              Exporter
            </button>
          </div>
        </div>

        {/* Middle Row: Meta info */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--line-soft)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--slate)' }}>Bailleur Principal</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>Agence Française de Développement (AFD)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--slate)' }}>Chef de Projet</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>Hassan Diallo</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--slate)' }}>Budget Initial (BAC)</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy-700)' }}>$24,600,000.00</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--slate)' }}>Calendrier</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>Jan 2023 – Déc 2026</span>
          </div>
        </div>

        {/* Bottom Row: Jauges & Alertes */}
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          
          <div style={{ flex: 1, display: 'flex', gap: '30px' }}>
            {/* Jauge 1: Complétude */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)' }}>Complétude du Dossier</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--amber)' }}>{completeness}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--line-soft)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${completeness}%`, height: '100%', background: 'var(--amber)' }}></div>
              </div>
            </div>

            {/* Jauge 2: Physique */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)' }}>Progression Physique (EVM)</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--red)' }}>{physicalProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--line-soft)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${physicalProgress}%`, height: '100%', background: 'var(--red)' }}></div>
              </div>
            </div>

            {/* Jauge 3: Financière */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)' }}>Progression Financière</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green)' }}>{financialProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--line-soft)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${financialProgress}%`, height: '100%', background: 'var(--green)' }}></div>
              </div>
            </div>
          </div>

          {/* Alertes */}
          <div style={{ background: 'var(--red-bg)', padding: '12px 16px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '300px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(194, 59, 46, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--red)' }}>2 Alertes Critiques</div>
              <div style={{ fontSize: '12px', color: 'var(--red)', opacity: 0.8 }}>CPI en baisse (0.79), 3 risques majeurs.</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
