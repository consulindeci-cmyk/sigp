import { Loader2, AlertCircle } from 'lucide-react';
import WidgetWrapper from '../common/WidgetWrapper';
import { useProjectEvmSummary } from '../../hooks/useEvm';

interface Props {
  projectId: string;
}

export default function EVMSummaryCard({ projectId }: Props) {
  const { data, isLoading, isError } = useProjectEvmSummary(projectId);

  if (isLoading) {
    return (
      <WidgetWrapper title="Indicateurs EVM (Temps Réel)" state="loading">
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
        </div>
      </WidgetWrapper>
    );
  }

  if (isError || !data) {
    return (
      <WidgetWrapper title="Indicateurs EVM (Temps Réel)" state="error">
        <div className="flex justify-center items-center h-40 flex-col text-destructive">
          <AlertCircle className="h-6 w-6 mb-2" />
          <p className="text-sm">Erreur lors du chargement des données EVM</p>
        </div>
      </WidgetWrapper>
    );
  }

  const formatDevise = (val: number) => new Intl.NumberFormat('fr-FR').format(val) + ' XOF';
  
  const getBadgeColor = (val: number, type: 'index' | 'variance') => {
    if (type === 'index') {
      if (val >= 1) return 'bg-success/20 text-success';
      if (val >= 0.9) return 'bg-warning/20 text-warning';
      return 'bg-destructive/20 text-destructive';
    } else {
      if (val >= 0) return 'bg-success/20 text-success';
      if (val > -50000) return 'bg-warning/20 text-warning';
      return 'bg-destructive/20 text-destructive';
    }
  };

  return (
    <WidgetWrapper title="Indicateurs EVM (Temps Réel)" state="success">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 text-sm">
        <div className="flex flex-col border-b md:border-b-0 md:border-r border-border pb-2 md:pb-0">
          <span className="text-muted-foreground font-medium text-xs">PV (Planifiée)</span>
          <span className="font-semibold">{formatDevise(data.pv)}</span>
        </div>
        <div className="flex flex-col border-b md:border-b-0 md:border-r border-border pb-2 md:pb-0">
          <span className="text-muted-foreground font-medium text-xs">EV (Acquise)</span>
          <span className="font-semibold">{formatDevise(data.ev)}</span>
        </div>
        <div className="flex flex-col border-b md:border-b-0 md:border-r border-border pb-2 md:pb-0">
          <span className="text-muted-foreground font-medium text-xs">AC (Coût Réel)</span>
          <span className="font-semibold text-destructive">{formatDevise(data.ac)}</span>
        </div>
        <div className="flex flex-col border-b md:border-b-0 md:border-r border-border pb-2 md:pb-0">
          <span className="text-muted-foreground font-medium text-xs">SPI (Délais)</span>
          <span className={`font-semibold rounded px-2 py-0.5 self-start ${getBadgeColor(data.spi, 'index')}`}>
            {data.spi}
          </span>
        </div>
        <div className="flex flex-col pb-2 md:pb-0">
          <span className="text-muted-foreground font-medium text-xs">CPI (Coûts)</span>
          <span className={`font-semibold rounded px-2 py-0.5 self-start ${getBadgeColor(data.cpi, 'index')}`}>
            {data.cpi}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-4 pb-4 pt-2 text-sm bg-muted/20">
        <div className="flex flex-col border-b md:border-b-0 md:border-r border-border pb-2 md:pb-0">
          <span className="text-muted-foreground font-medium text-xs">EAC (Estimé Final)</span>
          <span className="font-semibold">{formatDevise(data.eac)}</span>
        </div>
        <div className="flex flex-col border-b md:border-b-0 md:border-r border-border pb-2 md:pb-0">
          <span className="text-muted-foreground font-medium text-xs">ETC (Reste à Faire)</span>
          <span className="font-semibold">{formatDevise(data.etc)}</span>
        </div>
        <div className="flex flex-col border-b md:border-b-0 md:border-r border-border pb-2 md:pb-0">
          <span className="text-muted-foreground font-medium text-xs">SV (Écart Délais)</span>
          <span className={`font-semibold rounded px-2 py-0.5 self-start ${getBadgeColor(data.sv, 'variance')}`}>
            {formatDevise(data.sv)}
          </span>
        </div>
        <div className="flex flex-col border-b md:border-b-0 md:border-r border-border pb-2 md:pb-0">
          <span className="text-muted-foreground font-medium text-xs">CV (Écart Coûts)</span>
          <span className={`font-semibold rounded px-2 py-0.5 self-start ${getBadgeColor(data.cv, 'variance')}`}>
            {formatDevise(data.cv)}
          </span>
        </div>
        <div className="flex flex-col pb-2 md:pb-0">
          <span className="text-muted-foreground font-medium text-xs">VAC (Écart Final)</span>
          <span className={`font-semibold rounded px-2 py-0.5 self-start ${getBadgeColor(data.vac, 'variance')}`}>
            {formatDevise(data.vac)}
          </span>
        </div>
      </div>
    </WidgetWrapper>
  );
}
