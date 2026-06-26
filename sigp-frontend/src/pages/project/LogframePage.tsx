import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Download, ListTree, Target, TrendingUp } from 'lucide-react';
import { useLogframe, useCreateLogframe, useUpdateLogframe, useDeleteLogframe } from '@/hooks/useLogframe';
import { useProject } from '@/hooks/useProjects';
import { useUIStore } from '@/stores/uiStore';
import { LogframeMatrix } from '@/components/project/logframe/LogframeMatrix';
import { LogframeForm } from '@/components/project/logframe/LogframeForm';
import type { CadreLogique } from '@/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function LogframePage() {
  const { id: urlProjectId } = useParams();
  const { activeProjectId, activeProjectName } = useUIStore();
  const resolvedProjectId = urlProjectId || activeProjectId || '';

  const { data: project } = useProject(resolvedProjectId);
  const { data: logframeData, isLoading, error } = useLogframe(resolvedProjectId);
  const createMutation = useCreateLogframe(resolvedProjectId);
  const updateMutation = useUpdateLogframe(resolvedProjectId);
  const deleteMutation = useDeleteLogframe(resolvedProjectId);

  const elements = logframeData?.data ?? [];
  const [localData, setLocalData] = useState<CadreLogique[]>([]);

  React.useEffect(() => {
    if (elements.length > 0) {
      setLocalData(elements);
    }
  }, [elements]);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CadreLogique | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);
  const [parentLevelForNew, setParentLevelForNew] = useState<string | undefined>(undefined);

  if (!resolvedProjectId) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        <div className="es-title">Aucun projet sélectionné</div>
        <div className="es-sub">Veuillez sélectionner un projet pour afficher son Cadre Logique.</div>
      </div>
    );
  }

  const handleEdit = (item: CadreLogique) => {
    setEditingItem(item);
    setParentIdForNew(item.parent_id || null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élément et tous ses enfants ?')) {
      setLocalData(prev => prev.filter(i => i.id !== id && i.parent_id !== id));
      deleteMutation.mutate(id);
    }
  };

  const handleAddChild = (parentId: string, parentLevel: string) => {
    setEditingItem(null);
    setParentIdForNew(parentId);
    setParentLevelForNew(parentLevel);
    setIsFormOpen(true);
  };

  const handleAddImpact = () => {
    setEditingItem(null);
    setParentIdForNew(null);
    setParentLevelForNew(undefined);
    setIsFormOpen(true);
  };

  const handleSubmit = (data: Partial<CadreLogique>) => {
    if (editingItem) {
      const updated = { ...editingItem, ...data };
      setLocalData(prev => prev.map(i => i.id === editingItem.id ? updated : i));
      updateMutation.mutate({ id: editingItem.id, ...data });
    } else {
      const newItem: CadreLogique = {
        id: `lf-new-${Date.now()}`,
        projet_id: resolvedProjectId,
        parent_id: data.parent_id || null,
        niveau_intervention: data.niveau_intervention as any,
        indicateur: data.indicateur || '',
        valeur_reference: data.valeur_reference,
        cible: data.cible,
        source_verification: data.source_verification,
        hypotheses: data.hypotheses,
      };
      setLocalData(prev => [...prev, newItem]);
      createMutation.mutate(newItem);
    }
    setIsFormOpen(false);
  };

  // Exports
  const exportPDF = () => {
    const projectName = activeProjectName || project?.nom_projet || project?.code_projet || '';
    const safeFilename = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'export';
    const doc = new jsPDF();
    doc.text(`Cadre Logique - ${projectName}`, 14, 15);
    
    const tableData = localData.map(row => [
      row.niveau_intervention,
      row.indicateur,
      row.valeur_reference || '',
      row.cible || '',
      row.source_verification || '',
      row.hypotheses || ''
    ]);

    (doc as any).autoTable({
      startY: 20,
      head: [['Niveau', 'Description / Indicateur', 'Baseline', 'Cible', 'Vérification', 'Hypothèses']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [10, 22, 40] },
      styles: { fontSize: 8 }
    });
    
    doc.save(`Cadre_Logique_${safeFilename}.pdf`);
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(localData.map(row => ({
      Niveau: row.niveau_intervention,
      Description: row.indicateur,
      Baseline: row.valeur_reference || '',
      Cible: row.cible || '',
      Vérification: row.source_verification || '',
      'Hypothèses/Risques': row.hypotheses || ''
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cadre Logique");
    const projectName = activeProjectName || project?.nom_projet || project?.code_projet || '';
    const safeFilename = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'export';
    XLSX.writeFile(workbook, `Cadre_Logique_${safeFilename}.xlsx`);
  };

  const impacts = localData.filter(i => i.niveau_intervention === 'IMPACT');
  const countO = localData.filter(i => i.niveau_intervention === 'OBJECTIF').length;
  const countR = localData.filter(i => i.niveau_intervention === 'RESULTAT').length;
  const countP = localData.filter(i => i.niveau_intervention === 'PRODUIT').length;
  
  return (
    <div style={{ padding: '0 0 40px' }}>
      
      <div className="page-head" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Cadre Logique</h1>
          <p className="page-sub">Matrice de planification et de suivi des indicateurs</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={exportPDF}>
            <FileText size={15} /> PDF
          </button>
          <button className="btn" onClick={exportExcel}>
            <Download size={15} /> Excel
          </button>
          {impacts.length === 0 && (
            <button className="btn btn-primary" onClick={handleAddImpact}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Définir l'Impact
            </button>
          )}
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Objectifs & Effets</span>
            <div className="kpi-icon navy">
              <Target size={16} />
            </div>
          </div>
          <div className="kpi-value">{countO}</div>
          <div className="kpi-foot">
            <span>Orientations stratégiques</span>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Résultats Attendus</span>
            <div className="kpi-icon amber">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value">{countR}</div>
          <div className="kpi-foot">
            <span>Réalisations de moyen terme</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Produits Livrables</span>
            <div className="kpi-icon green">
              <ListTree size={16} />
            </div>
          </div>
          <div className="kpi-value">{countP}</div>
          <div className="kpi-foot">
            <span>Outputs tangibles</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Cohérence</span>
            <div className="kpi-icon" style={{ background: 'var(--canvas)', color: 'var(--slate)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
          </div>
          <div className="kpi-value">Stable</div>
          <div className="kpi-foot">
            <span>Matrice interconnectée</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">Matrice de Suivi</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="global-search" style={{ maxWidth: '240px' }}>
               <svg className="gs-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
               <input type="text" placeholder="Rechercher un indicateur..." />
            </div>
          </div>
        </div>
        <div className="panel-body tight">
          {isLoading ? (
            <div className="empty-state" style={{ padding: '60px 0' }}>
              <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--line-soft)', borderTopColor: 'var(--navy-900)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
          ) : error ? (
             <div className="empty-state">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
               <div className="es-title" style={{ color: 'var(--red)' }}>Erreur de chargement</div>
               <div className="es-sub">Impossible de charger le Cadre Logique.</div>
             </div>
          ) : (
            <LogframeMatrix 
              data={localData}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddChild={handleAddChild}
            />
          )}
        </div>
      </div>

      {isFormOpen && (
        <LogframeForm 
          initialData={editingItem || undefined}
          parentId={parentIdForNew}
          parentLevel={parentLevelForNew}
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

    </div>
  );
}
