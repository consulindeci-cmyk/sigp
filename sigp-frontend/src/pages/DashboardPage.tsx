import { Link } from 'react-router-dom';

export default function DashboardPage() {
  return (
    <section className="screen active" id="screen-dashboard">
      <div className="page-head">
        <div>
          <div className="page-title">Tableau de bord du portefeuille</div>
          <div className="page-sub">Vue d'ensemble multi-projets — 24 juin 2026</div>
        </div>
        <div className="page-actions">
          <button className="btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v13m0 0 4-4m-4 4-4-4"/><path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>
            Exporter
          </button>
          <Link to="/projects/new" className="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Nouveau Projet
          </Link>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Total des Projets</span>
            <span className="kpi-icon navy">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/></svg>
            </span>
          </div>
          <div className="kpi-value">42</div>
          <div className="kpi-foot"><span className="kpi-delta up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12 12 5l7 7M12 5v14"/></svg>+3</span> vs trimestre précédent</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Projets Actifs</span>
            <span className="kpi-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12.5 9.5 17 19 7"/></svg>
            </span>
          </div>
          <div className="kpi-value">31</div>
          <div className="kpi-foot">73.8% du portefeuille</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Projets Terminés</span>
            <span className="kpi-icon navy">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.5 2.5L16 9.5"/></svg>
            </span>
          </div>
          <div className="kpi-value">7</div>
          <div className="kpi-foot">16.7% du portefeuille</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Projets en Retard</span>
            <span className="kpi-icon red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l3.5 2"/></svg>
            </span>
          </div>
          <div className="kpi-value">4</div>
          <div className="kpi-foot"><span className="kpi-delta down"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12 12 19l-7-7M12 19V5"/></svg>+1</span> nécessite une attention</div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Budget Global</span>
            <span className="kpi-icon navy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2v20M17 6.5c0-1.7-2-3-5-3s-5 1.3-5 3 2 2.7 5 3 5 1.5 5 3.2-2 3-5 3-5-1.3-5-3"/></svg></span>
          </div>
          <div className="kpi-value">$284.6M</div>
          <div className="kpi-foot">réparti sur 9 bailleurs</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Budget Décaissé</span>
            <span className="kpi-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12h18M3 12a9 9 0 0 1 9-9M3 12a9 9 0 0 0 9 9"/></svg></span>
          </div>
          <div className="kpi-value">$176.2M</div>
          <div className="kpi-foot">61.9% taux de décaissement</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Contrats de Marchés</span>
            <span className="kpi-icon navy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 3h10l1 4H6l1-4Z"/><path d="M6 7h12l-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7Z"/></svg></span>
          </div>
          <div className="kpi-value">118</div>
          <div className="kpi-foot">23 en circuit d'approbation</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Risques Critiques</span>
            <span className="kpi-icon red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17v.1"/></svg></span>
          </div>
          <div className="kpi-value">9</div>
          <div className="kpi-foot">sur 6 projets</div>
        </div>
      </div>

      <div className="row-2">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Tendances de Décaissement<span className="muted">Cumul, 12 derniers mois</span></span>
            <button className="panel-link bg-transparent border-none">Voir le rapport</button>
          </div>
          <div className="panel-body" id="chart-disbursement">
            {/* Chart placeholder */}
            <div className="h-48 bg-canvas flex items-center justify-center text-slate rounded">Graphique des décaissements</div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Aperçu du Statut des Projets</span>
          </div>
          <div className="panel-body" id="chart-status">
            <div className="h-48 bg-canvas flex items-center justify-center text-slate rounded">Graphique des statuts</div>
          </div>
        </div>
      </div>

      <div className="row-2">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Répartition du Budget<span className="muted">Par bailleur</span></span>
          </div>
          <div className="panel-body tight">
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                  <span>Banque Mondiale</span><span>$96.4M</span>
                </div>
                <div className="progress-track"><div className="progress-fill navy" style={{ width: '80%' }}></div></div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                  <span>Union Européenne</span><span>$71.2M</span>
                </div>
                <div className="progress-track"><div className="progress-fill navy" style={{ width: '60%' }}></div></div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                  <span>USAID</span><span>$48.9M</span>
                </div>
                <div className="progress-track"><div className="progress-fill navy" style={{ width: '40%' }}></div></div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                  <span>AFD</span><span>$33.6M</span>
                </div>
                <div className="progress-track"><div className="progress-fill navy" style={{ width: '30%' }}></div></div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                  <span>PNUD</span><span>$21.1M</span>
                </div>
                <div className="progress-track"><div className="progress-fill navy" style={{ width: '20%' }}></div></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                  <span>Autres bailleurs</span><span>$13.4M</span>
                </div>
                <div className="progress-track"><div className="progress-fill slate" style={{ width: '15%' }}></div></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Répartition des Risques<span className="muted">Par catégorie</span></span>
          </div>
          <div className="panel-body tight">
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                  <span>Financiers</span><span>14</span>
                </div>
                <div className="progress-track"><div className="progress-fill red" style={{ width: '70%' }}></div></div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                  <span>Opérationnels</span><span>11</span>
                </div>
                <div className="progress-track"><div className="progress-fill amber" style={{ width: '55%' }}></div></div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                  <span>Passation des marchés</span><span>9</span>
                </div>
                <div className="progress-track"><div className="progress-fill navy" style={{ width: '45%' }}></div></div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                  <span>Environnementaux & Sociaux</span><span>6</span>
                </div>
                <div className="progress-track"><div className="progress-fill green" style={{ width: '30%' }}></div></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                  <span>Politiques / Gouvernance</span><span>5</span>
                </div>
                <div className="progress-track"><div className="progress-fill slate" style={{ width: '25%' }}></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row-2">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Activités Récentes</span>
            <button className="panel-link bg-transparent border-none">Voir tout</button>
          </div>
          <div className="panel-body tight">
             <div className="list-row">
               <div className="list-dot" style={{ backgroundColor: 'var(--green)' }}></div>
               <div className="lr-main">
                 <div className="lr-title">PTBA T2 2026 validé</div>
                 <div className="lr-meta">PROJ-014 - Électrification Rurale Phase II</div>
               </div>
               <div className="lr-time">Il y a 2h</div>
             </div>
             <div className="list-row">
               <div className="list-dot" style={{ backgroundColor: 'var(--navy-500)' }}></div>
               <div className="lr-main">
                 <div className="lr-title">Contrat signé — Travaux publics lot 3</div>
                 <div className="lr-meta">PROJ-009 - Approvisionnement en Eau Urbaine</div>
               </div>
               <div className="lr-time">Il y a 5h</div>
             </div>
             <div className="list-row">
               <div className="list-dot" style={{ backgroundColor: 'var(--amber)' }}></div>
               <div className="lr-main">
                 <div className="lr-title">Révision budgétaire soumise au bailleur</div>
                 <div className="lr-meta">PROJ-021 - Renforcement des Systèmes de Santé</div>
               </div>
               <div className="lr-time">Il y a 1j</div>
             </div>
             <div className="list-row">
               <div className="list-dot" style={{ backgroundColor: 'var(--navy-500)' }}></div>
               <div className="lr-main">
                 <div className="lr-title">Nouveau risque enregistré : exposition aux devises</div>
                 <div className="lr-meta">PROJ-014 - Électrification Rurale Phase II</div>
               </div>
               <div className="lr-time">Il y a 1j</div>
             </div>
             <div className="list-row">
               <div className="list-dot" style={{ backgroundColor: 'var(--green)' }}></div>
               <div className="lr-main">
                 <div className="lr-title">Rapport trimestriel bailleur exporté (PDF)</div>
                 <div className="lr-meta">PROJ-003 - Chaînes de Valeur Agricoles</div>
               </div>
               <div className="lr-time">Il y a 2j</div>
             </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Échéances à Venir</span>
            <button className="panel-link bg-transparent border-none">Calendrier</button>
          </div>
          <div className="panel-body tight">
             <div className="list-row">
               <div className="list-dot" style={{ backgroundColor: 'var(--red)' }}></div>
               <div className="lr-main">
                 <div className="lr-title">Ouverture des offres — Mini-réseaux solaires lot 1</div>
                 <div className="lr-meta">PROJ-014</div>
               </div>
               <div className="lr-time">Demain</div>
             </div>
             <div className="list-row">
               <div className="list-dot" style={{ backgroundColor: 'var(--amber)' }}></div>
               <div className="lr-main">
                 <div className="lr-title">Rapport financier T2 dû à la délégation UE</div>
                 <div className="lr-meta">PROJ-021</div>
               </div>
               <div className="lr-time">Dans 3 jours</div>
             </div>
             <div className="list-row">
               <div className="list-dot" style={{ backgroundColor: 'var(--navy-500)' }}></div>
               <div className="lr-main">
                 <div className="lr-title">Début de la mission de revue à mi-parcours</div>
                 <div className="lr-meta">PROJ-009</div>
               </div>
               <div className="lr-time">Dans 6 jours</div>
             </div>
             <div className="list-row">
               <div className="list-dot" style={{ backgroundColor: 'var(--slate)' }}></div>
               <div className="lr-main">
                 <div className="lr-title">Audit annuel — Début des travaux sur le terrain</div>
                 <div className="lr-meta">PROJ-003</div>
               </div>
               <div className="lr-time">Dans 11 jours</div>
             </div>
             <div className="list-row">
               <div className="list-dot" style={{ backgroundColor: 'var(--slate)' }}></div>
               <div className="lr-main">
                 <div className="lr-title">Atelier de préparation PTBA 2027</div>
                 <div className="lr-meta">Tout le portefeuille</div>
               </div>
               <div className="lr-time">Dans 18 jours</div>
             </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Alertes <span className="muted">Nécessitant une action</span></span>
          <button className="panel-link bg-transparent border-none">Voir tout</button>
        </div>
        <div className="panel-body tight">
           <div className="alert-row" style={{ padding: '16px', borderBottom: '1px solid var(--line-soft)', display: 'flex', gap: '12px' }}>
             <div className="alert-ico" style={{ backgroundColor: 'var(--red-bg)', color: 'var(--red)', padding: '6px', borderRadius: '4px' }}>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
             </div>
             <div>
               <div className="ar-title" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '2px' }}>IPC sous le seuil (0.84) — Approvisionnement en Eau Urbaine</div>
               <div className="ar-meta" style={{ fontSize: '12px', color: 'var(--slate)' }}>Dépassement des coûts en hausse sur 3 mois consécutifs</div>
             </div>
           </div>
           
           <div className="alert-row" style={{ padding: '16px', borderBottom: '1px solid var(--line-soft)', display: 'flex', gap: '12px' }}>
             <div className="alert-ico" style={{ backgroundColor: 'var(--red-bg)', color: 'var(--red)', padding: '6px', borderRadius: '4px' }}>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
             </div>
             <div>
               <div className="ar-title" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '2px' }}>IPD sous le seuil (0.79) — Électrification Rurale Phase II</div>
               <div className="ar-meta" style={{ fontSize: '12px', color: 'var(--slate)' }}>Retard de calendrier sur les activités du chemin critique</div>
             </div>
           </div>

           <div className="alert-row" style={{ padding: '16px', borderBottom: '1px solid var(--line-soft)', display: 'flex', gap: '12px' }}>
             <div className="alert-ico" style={{ backgroundColor: 'var(--amber-bg)', color: 'var(--amber)', padding: '6px', borderRadius: '4px' }}>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
             </div>
             <div>
               <div className="ar-title" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '2px' }}>3 contrats de passation en attente d'approbation &gt; 14 jours</div>
               <div className="ar-meta" style={{ fontSize: '12px', color: 'var(--slate)' }}>Goulot d'étranglement dans le flux d'approbation — Examen du Responsable Financier nécessaire</div>
             </div>
           </div>

           <div className="alert-row" style={{ padding: '16px', display: 'flex', gap: '12px' }}>
             <div className="alert-ico" style={{ backgroundColor: 'var(--amber-bg)', color: 'var(--amber)', padding: '6px', borderRadius: '4px' }}>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
             </div>
             <div>
               <div className="ar-title" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '2px' }}>Taux de décaissement sous la cible annuelle</div>
               <div className="ar-meta" style={{ fontSize: '12px', color: 'var(--slate)' }}>Renforcement des Systèmes de Santé — 41% décaissé à la mi-année</div>
             </div>
           </div>
        </div>
      </div>

    </section>
  );
}
