import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';

export interface TimelineStep {
  id: string;
  label: string;
  status: 'COMPLETED' | 'CURRENT' | 'PENDING' | 'REJECTED';
  date?: string;
  user?: string;
  role?: string;
  comment?: string;
}

interface WorkflowTimelineProps {
  steps: TimelineStep[];
}

export const WorkflowTimeline = React.memo(({ steps }: WorkflowTimelineProps) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Parcours de validation</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 relative pb-6">
        {/* Ligne verticale de fond */}
        <div className="absolute left-9 top-6 bottom-6 w-0.5 bg-border z-0" />

        <div className="flex flex-col gap-8">
          {steps.map((step) => {
            const isCompleted = step.status === 'COMPLETED';
            const isCurrent = step.status === 'CURRENT';
            const isRejected = step.status === 'REJECTED';
            
            let Icon = Clock;
            let iconColor = 'text-muted-foreground';
            let iconBg = 'bg-muted';
            
            if (isCompleted) {
              Icon = CheckCircle2;
              iconColor = 'text-white';
              iconBg = 'bg-success';
            } else if (isCurrent) {
              Icon = AlertCircle;
              iconColor = 'text-white';
              iconBg = 'bg-primary';
            } else if (isRejected) {
              Icon = XCircle;
              iconColor = 'text-white';
              iconBg = 'bg-destructive';
            }

            return (
              <div key={step.id} className="flex gap-4 relative z-10">
                
                {/* Icône du statut */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${isCurrent ? 'ring-4 ring-primary/20' : ''} ${!isCompleted && !isCurrent && !isRejected ? 'border-2 border-border' : ''}`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>

                {/* Contenu de l'étape */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-1">
                    <h4 className={`text-sm m-0 ${isCurrent ? 'font-bold text-foreground' : 'font-semibold text-foreground/80'}`}>
                      {step.label}
                    </h4>
                    {step.date && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {format(new Date(step.date), 'dd MMM yyyy, HH:mm', { locale: fr })}
                      </span>
                    )}
                  </div>
                  
                  {step.user && (
                    <div className="text-xs text-muted-foreground mb-2">
                      Par <span className="font-semibold text-foreground">{step.user}</span> {step.role && `(${step.role})`}
                    </div>
                  )}

                  {step.comment && (
                    <div className={`bg-muted/50 p-3 rounded-md text-sm text-foreground border-l-4 ${isRejected ? 'border-destructive' : 'border-border'}`}>
                      "{step.comment}"
                    </div>
                  )}
                </div>
                
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

WorkflowTimeline.displayName = 'WorkflowTimeline';
