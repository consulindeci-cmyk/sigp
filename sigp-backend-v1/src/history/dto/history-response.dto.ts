import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction, Historique, Project, User } from '@prisma/client';
import { anonymizeIp } from '@/shared/utils/field-mask.util';

export type HistoriqueWithRelations = Historique & {
  user: Pick<User, 'id' | 'nom' | 'prenom' | 'role'> | null;
  project: Pick<Project, 'id' | 'code' | 'nom'> | null;
};

/** Table technique (table_cible) → libellé de module lisible. Dérivé des valeurs
 *  réellement utilisées par AuditService.log() à travers le backend — jamais de
 *  module inventé qui ne correspondrait à aucune donnée réelle. */
export const MODULE_LABELS: Record<string, string> = {
  budget_lignes: 'Budget',
  budget_versions: 'Budget',
  comments: 'Commentaires',
  contracts: 'Contrats',
  departements: 'Gouvernance',
  directions: 'Gouvernance',
  disbursements: 'Décaissements',
  documents_projet: 'Documents',
  funding_sources: 'Sources de financement',
  gouvernance: 'Gouvernance',
  journal_operations: 'Journal comptable',
  jwt_blacklist: 'Sécurité',
  livrables: 'Livrables',
  logframe_indicators: 'Cadre logique',
  logframe_objectives: 'Cadre logique',
  notifications: 'Notifications',
  organisations: 'Gouvernance',
  ppm_documents: 'PPM',
  ppm_etapes: 'PPM',
  ppm_marches: 'PPM',
  programmes: 'Gouvernance',
  project_members: 'Projets',
  projects: 'Projets',
  ptba_activites: 'PTBA',
  rapports_projet: 'Rapports',
  refresh_tokens: 'Sécurité',
  risques: 'Risques',
  unites: 'Gouvernance',
  users: 'Utilisateurs',
  wbs_nodes: 'WBS',
};

const ELEMENT_FIELD_PRIORITY = [
  'numero',
  'code',
  'codeRapport',
  'code_rapport',
  'titre',
  'nom',
  'intitule',
  'nomVersion',
  'nom_version',
  'email',
];

/** Extrait un libellé humain depuis l'instantané JSON réel (avant/apres) —
 *  jamais de texte inventé : si aucun champ connu n'est présent, on retombe sur
 *  l'identifiant technique de l'enregistrement. */
export function extractElementLabel(
  apres: unknown,
  avant: unknown,
  enregistrementId: string | null,
): string | null {
  const snapshot = (apres ?? avant) as Record<string, unknown> | null;
  if (snapshot && typeof snapshot === 'object') {
    for (const field of ELEMENT_FIELD_PRIORITY) {
      const value = snapshot[field];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }
  }
  return enregistrementId;
}

export class HistoryResponseDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional() projectId: string | null;
  @ApiPropertyOptional() projectCode: string | null;
  @ApiPropertyOptional() projectNom: string | null;
  @ApiPropertyOptional() userId: string | null;
  @ApiPropertyOptional() userNom: string | null;
  @ApiPropertyOptional() userRole: string | null;
  @ApiProperty({ enum: AuditAction }) action: AuditAction;
  @ApiProperty() module: string;
  @ApiProperty() moduleLabel: string;
  @ApiPropertyOptional() enregistrementId: string | null;
  @ApiPropertyOptional() elementLabel: string | null;
  @ApiPropertyOptional() ipAddress: string | null;
  @ApiPropertyOptional() userAgent: string | null;
  @ApiProperty() createdAt: Date;

  static fromEntity(entity: HistoriqueWithRelations): HistoryResponseDto {
    return {
      id: entity.id,
      projectId: entity.project_id,
      projectCode: entity.project?.code ?? null,
      projectNom: entity.project?.nom ?? null,
      userId: entity.user_id,
      userNom: entity.user ? `${entity.user.prenom} ${entity.user.nom}` : null,
      userRole: entity.user?.role ?? null,
      action: entity.action,
      module: entity.table_cible,
      moduleLabel: MODULE_LABELS[entity.table_cible] ?? entity.table_cible,
      enregistrementId: entity.enregistrement_id,
      elementLabel: extractElementLabel(entity.apres, entity.avant, entity.enregistrement_id),
      ipAddress: entity.ip_address ? anonymizeIp(entity.ip_address) : null,
      userAgent: entity.user_agent,
      createdAt: entity.created_at,
    };
  }
}

export class HistoryDetailResponseDto extends HistoryResponseDto {
  @ApiPropertyOptional({ description: "Instantané avant l'action (masqué pour les champs sensibles)" })
  avant: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: "Instantané après l'action (masqué pour les champs sensibles)" })
  apres: Record<string, unknown> | null;

  static fromEntityDetailed(entity: HistoriqueWithRelations): HistoryDetailResponseDto {
    return {
      ...HistoryResponseDto.fromEntity(entity),
      avant: (entity.avant as Record<string, unknown> | null) ?? null,
      apres: (entity.apres as Record<string, unknown> | null) ?? null,
    };
  }
}
