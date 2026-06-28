import React from 'react';
import { Button } from '@/components/ui/forms/Button';
import { Badge } from '@/components/ui/data-display/Badge';
import { Card, CardContent } from '@/components/ui/data-display/Card';
import { AlertTriangle, Download, Edit2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <Card className="mb-6 border-t-4 border-t-primary rounded-t-lg">
      <CardContent className="p-6">
        
        {/* Top Row: Title & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="font-mono text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">PROJ-014</span>
              <Badge variant="warning">En retard</Badge>
              <Badge variant="destructive">Priorité: Critique</Badge>
            </div>
            <h1 className="text-2xl font-bold text-foreground m-0 tracking-tight">Électrification Rurale Phase II</h1>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button 
              variant={isEditing ? "default" : "outline"} 
              onClick={() => setIsEditing(!isEditing)}
              className="flex-1 md:flex-none"
              leftIcon={isEditing ? <CheckCircle className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            >
              {isEditing ? 'Terminer l\'édition' : 'Éditer la coquille'}
            </Button>
            <Button variant="secondary" className="flex-1 md:flex-none" leftIcon={<Download className="w-4 h-4" />}>
              Exporter
            </Button>
          </div>
        </div>

        {/* Middle Row: Meta info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 pb-6 border-b border-border">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bailleur Principal</span>
            <span className="text-sm font-semibold text-foreground">Agence Française de Développement (AFD)</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chef de Projet</span>
            <span className="text-sm font-semibold text-foreground">Hassan Diallo</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Budget Initial (BAC)</span>
            <span className="text-sm font-bold text-primary">$24,600,000.00</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Calendrier</span>
            <span className="text-sm font-semibold text-foreground">Jan 2023 – Déc 2026</span>
          </div>
        </div>

        {/* Bottom Row: Jauges & Alertes */}
        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {/* Jauge 1: Complétude */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-muted-foreground">Complétude du Dossier</span>
                <span className="text-xs font-bold text-warning">{completeness}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-warning transition-all duration-500" style={{ width: `${completeness}%` }} />
              </div>
            </div>

            {/* Jauge 2: Physique */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-muted-foreground">Progression Physique (EVM)</span>
                <span className="text-xs font-bold text-destructive">{physicalProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-destructive transition-all duration-500" style={{ width: `${physicalProgress}%` }} />
              </div>
            </div>

            {/* Jauge 3: Financière */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-muted-foreground">Progression Financière</span>
                <span className="text-xs font-bold text-success">{financialProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-success transition-all duration-500" style={{ width: `${financialProgress}%` }} />
              </div>
            </div>
          </div>

          {/* Alertes */}
          <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md flex items-start gap-3 min-w-0 lg:min-w-[300px] w-full lg:w-auto">
            <div className="shrink-0 p-1 bg-destructive/10 text-destructive rounded-full mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-destructive">2 Alertes Critiques</div>
              <div className="text-xs text-destructive/80 mt-0.5">CPI en baisse (0.79), 3 risques majeurs.</div>
            </div>
          </div>

        </div>

      </CardContent>
    </Card>
  );
}
