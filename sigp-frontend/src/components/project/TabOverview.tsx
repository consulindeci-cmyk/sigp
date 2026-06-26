export default function TabOverview() {
  return (
    <div className="tab-panel active" id="tab-overview">
      <div className="row-2">
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Résumé Exécutif</span></div>
          <div className="panel-body" style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.65 }}>
            Le projet d'Électrification Rurale Phase II est actuellement <strong>achevé à 76%</strong> par rapport à une prévision de 84% à ce stade, ce qui reflète un retard sur les activités du chemin critique liées à l'acquisition des sous-stations. Sur le plan financier, le projet a décaissé <strong>16,9M$ sur son budget de 24,6M$</strong> (68,7%), ce qui est globalement conforme à l'avancement physique. L'indice de performance des coûts (0,91) indique un léger dépassement de coûts, tandis que l'indice de performance des délais (0,79) signale un risque de retard plus important que l'équipe projet traite via une procédure d'acquisition accélérée pour les lots de mini-réseaux restants.
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Jalons (Milestones)</span></div>
          <div className="panel-body tight" id="ov-milestones">
            <div className="list-row">
              <div className="list-dot" style={{ backgroundColor: 'var(--green)' }}></div>
              <div className="lr-main">
                <div className="lr-title">Approbation du financement</div>
                <div className="lr-meta">Achevé</div>
              </div>
              <div className="lr-time">Jan 2023</div>
            </div>
            <div className="list-row">
              <div className="list-dot" style={{ backgroundColor: 'var(--green)' }}></div>
              <div className="lr-main">
                <div className="lr-title">Lancement des études</div>
                <div className="lr-meta">Achevé</div>
              </div>
              <div className="lr-time">Mar 2023</div>
            </div>
            <div className="list-row">
              <div className="list-dot" style={{ backgroundColor: 'var(--amber)' }}></div>
              <div className="lr-main">
                <div className="lr-title">Livraison des sous-stations</div>
                <div className="lr-meta">En retard (Prévu Juin 2026)</div>
              </div>
              <div className="lr-time">Août 2026</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row-3">
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Tendance d'Avancement</span></div>
          <div className="panel-body" id="ov-chart-progress">
             <div className="h-32 bg-canvas flex items-center justify-center text-slate rounded">Graphe d'avancement</div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Exécution du Budget</span></div>
          <div className="panel-body" id="ov-chart-budget">
             <div className="h-32 bg-canvas flex items-center justify-center text-slate rounded">Graphe d'exécution</div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Statut des Activités</span></div>
          <div className="panel-body" id="ov-chart-activity">
             <div className="h-32 bg-canvas flex items-center justify-center text-slate rounded">Graphe d'activités</div>
          </div>
        </div>
      </div>

      <div className="row-2">
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Activités Récentes</span></div>
          <div className="panel-body tight" id="ov-recent">
             <div className="list-row">
               <div className="list-dot" style={{ backgroundColor: 'var(--navy-700)' }}></div>
               <div className="lr-main">
                 <div className="lr-title">Rapport mensuel Mai 2026 validé</div>
               </div>
               <div className="lr-time">Il y a 2 jours</div>
             </div>
             <div className="list-row">
               <div className="list-dot" style={{ backgroundColor: 'var(--navy-700)' }}></div>
               <div className="lr-main">
                 <div className="lr-title">Contrat C-014-A signé</div>
               </div>
               <div className="lr-time">Il y a 5 jours</div>
             </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Alertes</span></div>
          <div className="panel-body tight" id="ov-alerts">
             <div className="alert-row">
               <div className="alert-ico red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
               <div>
                 <div className="ar-title">Retard critique sur le Lot 3</div>
                 <div className="ar-meta">Impact potentiel de 3 mois sur la date de fin</div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
