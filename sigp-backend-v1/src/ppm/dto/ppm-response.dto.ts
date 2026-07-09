import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PpmMarche, PpmMarcheStatus, PpmTypeMarche } from '@prisma/client';

export class PpmResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() projectId: string;
  @ApiProperty() code: string;
  @ApiProperty() intitule: string;
  @ApiProperty({ enum: PpmTypeMarche }) type: PpmTypeMarche;
  @ApiProperty({ enum: PpmMarcheStatus }) statut: PpmMarcheStatus;
  @ApiPropertyOptional() montantEstime: number | null;
  @ApiPropertyOptional() montantSigne: number | null;
  @ApiPropertyOptional() dateLancementPrevu: Date | null;
  @ApiPropertyOptional() dateSoumissionPrevu: Date | null;
  @ApiPropertyOptional() dateAttribution: Date | null;
  @ApiPropertyOptional() dateSignature: Date | null;
  @ApiPropertyOptional() dateFinPrevue: Date | null;
  @ApiPropertyOptional() dateFinEffective: Date | null;
  @ApiPropertyOptional() titulaire: string | null;
  @ApiPropertyOptional() notes: string | null;
  @ApiPropertyOptional() createdBy: string | null;
  @ApiPropertyOptional() updatedBy: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static fromEntity(entity: PpmMarche): PpmResponseDto {
    return {
      id: entity.id,
      projectId: entity.project_id,
      code: entity.code,
      intitule: entity.intitule,
      type: entity.type,
      statut: entity.statut,
      montantEstime:
        entity.montant_estime !== null && entity.montant_estime !== undefined
          ? Number(entity.montant_estime)
          : null,
      montantSigne:
        entity.montant_signe !== null && entity.montant_signe !== undefined
          ? Number(entity.montant_signe)
          : null,
      dateLancementPrevu: entity.date_lancement_prevu ?? null,
      dateSoumissionPrevu: entity.date_soumission_prevu ?? null,
      dateAttribution: entity.date_attribution ?? null,
      dateSignature: entity.date_signature ?? null,
      dateFinPrevue: entity.date_fin_prevue ?? null,
      dateFinEffective: entity.date_fin_effective ?? null,
      titulaire: entity.titulaire ?? null,
      notes: entity.notes ?? null,
      createdBy: entity.created_by ?? null,
      updatedBy: entity.updated_by ?? null,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}
