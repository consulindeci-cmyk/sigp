type MatrixCell = { v: number; cls: string; textCls: string };

// 3×3 criticité matrix (Probabilité × Impact)
// Rows: P=1 (top) → P=3 (bottom) | Columns: I=1 (left) → I=3 (right)
const MATRIX: MatrixCell[][] = [
  [
    { v: 1, cls: 'bg-success',     textCls: 'text-success-foreground' },
    { v: 2, cls: 'bg-success',     textCls: 'text-success-foreground' },
    { v: 3, cls: 'bg-warning',     textCls: 'text-warning-foreground' },
  ],
  [
    { v: 2, cls: 'bg-success',     textCls: 'text-success-foreground' },
    { v: 4, cls: 'bg-warning',     textCls: 'text-warning-foreground' },
    { v: 6, cls: 'bg-destructive', textCls: 'text-destructive-foreground' },
  ],
  [
    { v: 3, cls: 'bg-warning',     textCls: 'text-warning-foreground' },
    { v: 6, cls: 'bg-destructive', textCls: 'text-destructive-foreground' },
    { v: 9, cls: 'bg-destructive', textCls: 'text-destructive-foreground' },
  ],
];

const P_LABELS = ['P=1', 'P=2', 'P=3'];
const I_LABELS = ['I=1', 'I=2', 'I=3'];

export function RiskMatrixCard() {
  return (
    <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-center self-start min-w-fit">
      <h3 className="w-full text-sm font-semibold text-foreground mb-5">
        Carte criticité — Probabilité × Impact
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
              {/* Label ligne */}
              <span className="w-8 text-[10px] text-muted-foreground font-semibold text-right shrink-0">
                {P_LABELS[rowIdx]}
              </span>
              {row.map((cell, colIdx) => (
                <div
                  key={colIdx}
                  className={`w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-lg flex items-center justify-center text-xl font-bold shadow-sm transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${cell.cls} ${cell.textCls}`}
                  role="cell"
                  aria-label={`P=${rowIdx + 1} × I=${colIdx + 1} = ${cell.v}`}
                  tabIndex={0}
                >
                  {cell.v}
                </div>
              ))}
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
          Faible (1–2)
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded-sm bg-warning inline-block" />
          Modéré (3–4)
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded-sm bg-destructive inline-block" />
          Critique (6–9)
        </span>
      </div>
    </div>
  );
}
