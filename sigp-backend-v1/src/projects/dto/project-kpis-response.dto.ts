import { ApiProperty } from '@nestjs/swagger';

/**
 * KPIs synthétiques du portefeuille de projets.
 * Calculés directement côté base de données (groupBy / aggregate) via Prisma
 * afin d'éviter le transfert de milliers de lignes côté frontend.
 */
export class ProjectKpisResponseDto {
  @ApiProperty({ description: 'Nombre total de projets', example: 42 })
  total: number;

  @ApiProperty({ description: 'Projets EN_COURS (En bonne voie)', example: 18 })
  enBonneVoie: number;

  @ApiProperty({ description: 'Projets SUSPENDU (À risque)', example: 5 })
  aRisque: number;

  @ApiProperty({ description: 'Projets EN_COURS dépassant leur date de fin prévue', example: 3 })
  enRetard: number;

  @ApiProperty({ description: 'Projets CLOTURE ou ANNULE', example: 12 })
  clotured: number;

  @ApiProperty({ description: 'Budget total du portefeuille formaté', example: '245.3M FCFA' })
  budgetPortefeuille: string;
}

/**
 * Options de référence distinctes pour les filtres de la liste des projets.
 * Renvoyées directement depuis la base de données sans transférer les entités projets.
 */
export class ProjectReferenceOptionsDto {
  @ApiProperty({ description: 'Liste des secteurs distincts', type: [String], example: ['Santé', 'Éducation'] })
  sectors: string[];

  @ApiProperty({ description: 'Liste des pays distincts', type: [String], example: ["Côte d'Ivoire", 'Niger'] })
  countries: string[];

  @ApiProperty({ description: 'Liste des bailleurs distincts', type: [String], example: ['AFD', 'Banque Mondiale'] })
  donors: string[];
}
