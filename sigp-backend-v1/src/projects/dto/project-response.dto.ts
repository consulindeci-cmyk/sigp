import { ApiProperty } from '@nestjs/swagger';
import { Project, ProjectStatus } from '@prisma/client';
import type { ProjectAggregationsSummary } from '../project.repository';

type ProjectEntity = Project & {
  manager?: { id: string; nom: string; prenom: string } | null;
};

/**
 * Vue publique d'un projet.
 * N'expose JAMAIS : deleted_at, created_by, updated_by ni aucune donnée interne.
 */
export class ProjectResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890', nullable: true })
  programmeId: string | null;

  @ApiProperty({ example: 'PRJ-SANTE-01' })
  code: string;

  @ApiProperty({ example: 'Projet Santé Rurale Phase 1' })
  nom: string;

  @ApiProperty({ example: "Projet d'amélioration de l'accès aux soins", nullable: true })
  description: string | null;

  @ApiProperty({ enum: ProjectStatus, example: ProjectStatus.EN_PREPARATION })
  statut: ProjectStatus;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', nullable: true })
  dateDebut: Date | null;

  @ApiProperty({ example: '2026-12-31T00:00:00.000Z', nullable: true })
  dateFinPrevue: Date | null;

  @ApiProperty({ example: null, nullable: true })
  dateFinEffective: Date | null;

  @ApiProperty({ example: null, nullable: true })
  dateClotureEffective: Date | null;

  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890', nullable: true })
  managerId: string | null;

  @ApiProperty({ example: 'Diallo', nullable: true })
  managerNom: string | null;

  @ApiProperty({ example: 'Mamadou', nullable: true })
  managerPrenom: string | null;

  @ApiProperty({ example: 1000000, nullable: true })
  budgetTotal: number | null;

  @ApiProperty({ example: 'XOF' })
  devise: string;

  @ApiProperty({ example: "Côte d'Ivoire", nullable: true })
  pays: string | null;

  @ApiProperty({ example: 'Santé', nullable: true })
  secteur: string | null;

  @ApiProperty({ example: 'Banque Mondiale', nullable: true })
  bailleurPrincipal: string | null;

  @ApiProperty({ description: 'Score de progression (%)', example: 45 })
  progressScore: number;

  @ApiProperty({ description: 'Score de profil qualité (%)', example: 80 })
  profileScore: number;

  @ApiProperty({ description: 'Taux de décaissement (%)', example: 30 })
  tauxDecaissement: number;

  @ApiProperty({ description: 'Nombre de composantes WBS (niveau 1)', example: 3 })
  composantes: number;

  @ApiProperty({ description: "Nombre d'activités PTBA", example: 12 })
  activites: number;

  @ApiProperty({ description: 'Nombre de livrables', example: 8 })
  livrables: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  /** Calcule le score de complétude du profil qualité à partir des 10 champs clés. */
  static calculateProfileScore(project: ProjectEntity): number {
    const fields = [
      project.nom,
      project.description,
      project.budget_total,
      project.manager_id,
      project.programme_id,
      project.secteur,
      project.pays,
      project.devise,
      project.date_debut,
      project.bailleur_principal,
    ];
    const filledFields = fields.filter((f) => f !== null && f !== undefined && f !== '');
    return Math.round((filledFields.length / fields.length) * 100);
  }

  /** Mappe une entité Prisma vers la vue publique en excluant tout champ interne. */
  static fromEntity(
    project: ProjectEntity,
    agg?: Partial<ProjectAggregationsSummary>,
  ): ProjectResponseDto {
    const profileScore = ProjectResponseDto.calculateProfileScore(project);
    return {
      id: project.id,
      programmeId: project.programme_id,
      code: project.code,
      nom: project.nom,
      description: project.description,
      statut: project.statut,
      dateDebut: project.date_debut,
      dateFinPrevue: project.date_fin_prevue,
      dateFinEffective: project.date_fin_effective,
      dateClotureEffective: project.date_cloture_effective,
      managerId: project.manager_id,
      managerNom: project.manager?.nom ?? null,
      managerPrenom: project.manager?.prenom ?? null,
      budgetTotal: project.budget_total === null ? null : Number(project.budget_total),
      devise: project.devise,
      pays: project.pays,
      secteur: project.secteur,
      bailleurPrincipal: project.bailleur_principal,
      progressScore: agg?.progressScore ?? (project as any).progressScore ?? 0,
      profileScore: agg?.profileScore ?? (project as any).profileScore ?? profileScore,
      tauxDecaissement: agg?.tauxDecaissement ?? (project as any).tauxDecaissement ?? 0,
      composantes: agg?.composantes ?? (project as any).composantes ?? 0,
      activites: agg?.activites ?? (project as any).activites ?? 0,
      livrables: agg?.livrables ?? (project as any).livrables ?? 0,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    };
  }
}
