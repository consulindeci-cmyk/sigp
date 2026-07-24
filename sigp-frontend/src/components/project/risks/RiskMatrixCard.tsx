import type { Risque } from '@/types';

type MatrixCell = { v: number; cls: string; textCls: string; countCls: string };

// Matrice 3×3 stricte : score 1-4 FAIBLE (vert), 5-6 MOYEN (orange), 7-9
// ÉLEVÉ (rouge) — mêmes seuils que TabRisks.tsx/RiskSlideOver.tsx (bandes
// dérivées d'une fonction plutôt que codées cellule par cellule, pour ne
// jamais diverger de ces seuils).
function bucketFor(score: number): Omit<MatrixCell, 'v'> {
  if (score <= 4) return { cls: 'bg-success', textCls: 'text-success-foreground', countCls: 'bg-success-foreground/20 text-success-foreground' };
  if (score <= 6) return { cls: 'bg-warning', textCls: 'text-warning-foreground', countCls: 'bg-warning-foreground/20 text-warning-foreground' };
  return { cls: 'bg-destructive', textCls: 'text-destructive-foreground', countCls: 'bg-destructive-foreground/20 text-destructive-foreground' };
}

// Rows: P=1 (top) → P=3 (bottom) | Columns: I=1 (left) → I=3 (right)
const MATRIX: MatrixCell[][] = [1, 2, 3].map(p =>
  [1, 2, 3].map(i => ({ v: p * i, ...bucketFor(p * i) })),
);

const P_LABELS = ['P=1', 'P=2', 'P=3'];
const I_LABELS = ['I=1', 'I=2', 'I=3'];

interface RiskMatrixCardProps {
  risks?: Risque[];
}

export function RiskMatrixCard({ risks = [] }: RiskMatrixCardProps) {
  const getRiskCount = (p: number, i: number) =>
    risks.filter(r => r.probabilite === p && r.impact === i).length;

  return (
    <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-center self-start min-w-fit">
      <h3 className="w-full text-sm font-semibold text-foreground mb-5">
        Matrice criticité — Probabilité × Impact
      </h3>

      <div className="flex items-center gap-4">
        {/* Axe vertical : Probabilité */}
        <div
          className="text-[10px] font-bold text-muted-foreground tracking-widest rotate-180 select-none [writing-mode:vertical-rl]"
          aria-label="Probabilité croissante de bas en haut"
        >
          Probabilité ↑
        </div>

        {/* Grille + labels colonnes */}
        <div className="flex flex-col gap-2">
          {MATRIX.map((row, rowIdx) => (
            <div key={rowIdx} className="flex items-center gap-2">
              <span className="w-8 text-[10px] text-muted-foreground font-semibold text-right shrink-0">
                {P_LABELS[rowIdx]}
              </span>
              {row.map((cell, colIdx) => {
                const count = getRiskCount(rowIdx + 1, colIdx + 1);
                return (
                  <div
                    key={colIdx}
                    className={`relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-lg flex items-center justify-center text-xl font-bold shadow-sm transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${cell.cls} ${cell.textCls}`}
                    role="cell"
                    aria-label={`P=${rowIdx + 1} × I=${colIdx + 1} = ${cell.v}${count > 0 ? ` (${count} risque${count > 1 ? 's' : ''})` : ''}`}
                    tabIndex={0}
                  >
                    {cell.v}
                    {count > 0 && (
                      <span
                        className={`absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center leading-none ${cell.countCls}`}
                      >
                        {count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Labels colonnes */}
          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 shrink-0" />
            {I_LABELS.map(label => (
              <div
                key={label}
                className="w-16 sm:w-[72px] text-center text-[10px] text-muted-foreground font-semibold"
              >
                {label}
              </div>
            ))}
          </div>
          <p className="text-[10px] font-bold text-muted-foreground text-center tracking-widest mt-0.5 select-none">
            Impact →
          </p>
        </div>
      </div>

      {/* Légende */}
      <div className="mt-5 flex items-center gap-4 flex-wrap justify-center">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded-sm bg-success inline-block" />
          Faible (1–4)
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded-sm bg-warning inline-block" />
          Moyen (5–6)
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded-sm bg-destructive inline-block" />
          Élevé (7–9)
        </span>
      </div>

      {risks.length > 0 && (
        <p className="mt-3 text-[10px] text-muted-foreground italic text-center">
          Les chiffres dans les cellules indiquent le nombre de risques positionnés.
        </p>
      )}
    </div>
  );
}
