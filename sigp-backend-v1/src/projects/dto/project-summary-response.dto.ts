import { ApiProperty } from '@nestjs/swagger';

export class ProjectSummaryResponseDto {
  // ── Budget ──────────────────────────────────────────────────────────────────
  @ApiProperty({ description: 'Budget total prévisionnel (somme des lignes)', example: 500000 })
  budgetTotal: number;

  @ApiProperty({ description: 'Montant engagé', example: 200000 })
  montantEngage: number;

  @ApiProperty({ description: 'Montant payé / décaissé', example: 150000 })
  montantPaye: number;

  @ApiProperty({ description: 'Solde disponible = budgetTotal − montantPaye', example: 350000 })
  soldeDisponible: number;

  @ApiProperty({ description: 'Taux de décaissement (%)', example: 30 })
  tauxDecaissement: number;

  // ── PTBA ────────────────────────────────────────────────────────────────────
  @ApiProperty({ description: "Nombre total d'activités PTBA", example: 12 })
  nombreActivites: number;

  @ApiProperty({ description: 'Activités terminées', example: 5 })
  activitesTerminees: number;

  @ApiProperty({ description: 'Activités en cours', example: 4 })
  activitesEnCours: number;

  @ApiProperty({ description: 'Activités en retard', example: 2 })
  activitesEnRetard: number;

  // ── Livrables ───────────────────────────────────────────────────────────────
  @ApiProperty({ description: 'Nombre total de livrables', example: 8 })
  nombreLivrables: number;

  @ApiProperty({ description: 'Livrables validés', example: 3 })
  livrablesTermines: number;

  @ApiProperty({ description: 'Livrables en cours', example: 2 })
  livrablesEnCours: number;

  // ── Contrats ─────────────────────────────────────────────────────────────────
  @ApiProperty({ description: 'Nombre total de contrats', example: 4 })
  nombreContrats: number;

  @ApiProperty({ description: 'Contrats actifs', example: 2 })
  contratsActifs: number;

  // ── Risques ──────────────────────────────────────────────────────────────────
  @ApiProperty({ description: 'Nombre total de risques', example: 3 })
  nombreRisques: number;

  @ApiProperty({ description: 'Risques de niveau CRITIQUE', example: 1 })
  risquesCritiques: number;

  // ── Progression ──────────────────────────────────────────────────────────────
  @ApiProperty({ description: "Taux d'avancement global physique (%)", example: 45 })
  tauxAvancementGlobal: number;

  @ApiProperty({
    description: 'Score de progression (basé sur taux_realisation PTBA)',
    example: 45,
  })
  progressScore: number;

  @ApiProperty({ description: 'Score de profil qualité', example: 0 })
  profileScore: number;

  @ApiProperty({ description: 'Statut métier dynamique pour affichage', example: 'En difficulté' })
  displayStatus: string;
}
