import { useState } from 'react';
import { Download, Upload, CheckCircle2, History, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { Badge } from '@/components/ui/data-display/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/Card';
import type { ChangeHistory } from '@/mocks/settingsMocks';

interface SystemSectionProps {
  changeHistory: ChangeHistory[];
}

export function SystemSection({ changeHistory }: SystemSectionProps) {
  const [exportDone, setExportDone] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importDone, setImportDone] = useState(false);

  function handleExport() {
    setExporting(true);
    setExportDone(false);
    setTimeout(() => {
      setExporting(false);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 4000);
    }, 1500);
  }

  function handleImport() {
    setImportDone(true);
    setTimeout(() => setImportDone(false), 4000);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Data export */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0" aria-hidden="true">
              <Download className="h-3.5 w-3.5" />
            </div>
            <div>
              <CardTitle className="text-base">Exporter mes données</CardTitle>
              <CardDescription className="text-[11px]">Téléchargez l'intégralité de vos données personnelles et paramètres.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="text-[12px] text-muted-foreground bg-muted/40 rounded-md p-3 leading-relaxed">
              L'export inclut : profil, préférences, historique des activités, rapports générés et configurations.
              Le fichier sera au format <strong className="text-foreground">JSON</strong> avec une version de sauvegarde <strong className="text-foreground">CSV</strong>.
            </div>
            <div className="flex items-center gap-2">
              {exportDone && (
                <span className="flex items-center gap-1.5 text-sm text-success" aria-live="polite">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Export téléchargé
                </span>
              )}
              <Button
                variant="default"
                onClick={handleExport}
                disabled={exporting}
                leftIcon={<Download className="h-4 w-4" />}
              >
                {exporting ? 'Préparation...' : 'Exporter mes données'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data import */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-info/10 text-info flex items-center justify-center shrink-0" aria-hidden="true">
              <Upload className="h-3.5 w-3.5" />
            </div>
            <div>
              <CardTitle className="text-base">Importer des paramètres</CardTitle>
              <CardDescription className="text-[11px]">Restaurez vos paramètres depuis un fichier de sauvegarde précédent.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-8 w-8 opacity-40" aria-hidden="true" />
              <p className="text-[12px] text-center">Glissez-déposez un fichier JSON ici ou cliquez pour sélectionner</p>
              <p className="text-[10px] text-muted-foreground">Format attendu : .json · Max 5 Mo</p>
            </div>
            <div className="flex items-center gap-2">
              {importDone && (
                <span className="flex items-center gap-1.5 text-sm text-success" aria-live="polite">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Paramètres importés (simulation)
                </span>
              )}
              <Button variant="outline" onClick={handleImport} leftIcon={<Upload className="h-4 w-4" />}>
                Sélectionner un fichier
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change history */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0" aria-hidden="true">
              <History className="h-3.5 w-3.5" />
            </div>
            <div>
              <CardTitle className="text-base">Historique des modifications</CardTitle>
              <CardDescription className="text-[11px]">Dernières modifications apportées à votre compte.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {changeHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune modification enregistrée.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {changeHistory.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 py-3">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] font-mono">{entry.champ}</Badge>
                      <span className="text-[11px] text-muted-foreground line-through truncate max-w-[100px]">
                        {entry.ancienneValeur}
                      </span>
                      <span className="text-muted-foreground" aria-hidden="true">→</span>
                      <span className="text-[11px] text-foreground font-medium truncate max-w-[120px]">
                        {entry.nouvelleValeur}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">{entry.date}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
