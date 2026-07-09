import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, Prisma, PtbaStatut } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { ProjectService } from '@/projects/project.service';
import { WbsService } from '@/wbs/wbs.service';
import { LogframeIndicatorService } from '@/logframe-indicators/logframe-indicator.service';
import { LogframeObjectiveService } from '@/logframe-objectives/logframe-objective.service';
import { PtbaRepository } from './ptba.repository';
import { CreatePtbaActiviteDto } from './dto/create-ptba-activite.dto';
import { UpdatePtbaActiviteDto } from './dto/update-ptba-activite.dto';
import { PtbaQueryDto } from './dto/ptba-query.dto';
import { PtbaResponseDto } from './dto/ptba-response.dto';

/** Champs autorisés au tri (protège contre l'injection dans orderBy). */
const SORTABLE_FIELDS = [
  'code',
  'statut',
  'annee',
  'trimestre',
  'created_at',
  'updated_at',
] as const;

/** Contexte de l'acteur réalisant l'action (pour l'audit). */
export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

/** Convertit une date ISO optionnelle en Date (ou null / undefined selon le contexte). */
function toDate(value: string | undefined, fallback: null | undefined): Date | null | undefined {
  return value ? new Date(value) : fallback;
}

@Injectable()
export class PtbaService {
  constructor(
    private readonly ptbaRepository: PtbaRepository,
    private readonly projectService: ProjectService,
    private readonly wbsService: WbsService,
    private readonly logframeIndicatorService: LogframeIndicatorService,
    private readonly logframeObjectiveService: LogframeObjectiveService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Liste paginée ──────────────────────────────────────────────────────────

  async findAll(query: PtbaQueryDto): Promise<PaginatedResult<PtbaResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { activites, total } = await this.ptbaRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      projectId: query.projectId,
      statut: query.statut,
      annee: query.annee,
      trimestre: query.trimestre,
      wbsId: query.wbsId,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(activites.map(PtbaResponseDto.fromEntity), total, query);
  }

  // ─── Détail ─────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<PtbaResponseDto> {
    const activite = await this.ptbaRepository.findById(id);
    if (!activite) {
      throw new NotFoundException(ErrorCode.PTBA_ACTIVITE_NOT_FOUND, 'Activité PTBA introuvable');
    }
    return PtbaResponseDto.fromEntity(activite);
  }

  // ─── Création ───────────────────────────────────────────────────────────────

  async create(dto: CreatePtbaActiviteDto, actor: ActorContext = {}): Promise<PtbaResponseDto> {
    // Le projet doit exister (lève PROJECT_NOT_FOUND / 404 sinon)
    await this.projectService.findOne(dto.projectId);

    // Rattachements WBS / indicateur : existence + cohérence de projet
    await this.validateLinks(dto.projectId, dto.wbsId, dto.logframeIndicatorId);

    let activite;
    try {
      activite = await this.ptbaRepository.create({
        projectId: dto.projectId,
        wbsId: dto.wbsId,
        logframeRefId: dto.logframeIndicatorId,
        code: dto.code,
        libelle: dto.libelle,
        description: dto.description,
        statut: dto.statut ?? PtbaStatut.NON_DEMARRE,
        annee: dto.annee,
        trimestre: dto.trimestre,
        responsableId: dto.responsableId,
        dateDebutPrevue: toDate(dto.dateDebutPrevue, null),
        dateFinPrevue: toDate(dto.dateFinPrevue, null),
        dateDebutReelle: toDate(dto.dateDebutReelle, null),
        dateFinReelle: toDate(dto.dateFinReelle, null),
        montantPrevu: dto.montantPrevu,
        montantRealise: dto.montantRealise,
        tauxRealisation: dto.tauxRealisation,
        createdBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = PtbaResponseDto.fromEntity(activite);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'ptba_activites',
        enregistrementId: activite.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.PTBA_CREATED, {
      ptbaId: activite.id,
      projectId: activite.project_id,
      code: activite.code,
    });

    return response;
  }

  // ─── Modification ───────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdatePtbaActiviteDto,
    actor: ActorContext = {},
  ): Promise<PtbaResponseDto> {
    const existing = await this.ptbaRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.PTBA_ACTIVITE_NOT_FOUND, 'Activité PTBA introuvable');
    }

    // Les rattachements restent cohérents avec le projet de l'activité
    await this.validateLinks(existing.project_id, dto.wbsId, dto.logframeIndicatorId);

    const before = PtbaResponseDto.fromEntity(existing);

    let updated;
    try {
      updated = await this.ptbaRepository.update(id, {
        wbsId: dto.wbsId,
        logframeRefId: dto.logframeIndicatorId,
        libelle: dto.libelle,
        description: dto.description,
        statut: dto.statut,
        annee: dto.annee,
        trimestre: dto.trimestre,
        responsableId: dto.responsableId,
        dateDebutPrevue: toDate(dto.dateDebutPrevue, undefined),
        dateFinPrevue: toDate(dto.dateFinPrevue, undefined),
        dateDebutReelle: toDate(dto.dateDebutReelle, undefined),
        dateFinReelle: toDate(dto.dateFinReelle, undefined),
        montantPrevu: dto.montantPrevu,
        montantRealise: dto.montantRealise,
        tauxRealisation: dto.tauxRealisation,
        updatedBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = PtbaResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'ptba_activites',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.PTBA_UPDATED, { ptbaId: id });

    return response;
  }

  // ─── Suppression logique ────────────────────────────────────────────────────

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.ptbaRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.PTBA_ACTIVITE_NOT_FOUND, 'Activité PTBA introuvable');
    }

    await this.ptbaRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'ptba_activites',
        enregistrementId: id,
        avant: { ...PtbaResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.PTBA_DELETED, { ptbaId: id });
  }

  // ─── Helpers privés ─────────────────────────────────────────────────────────

  /**
   * Vérifie l'existence et la cohérence de projet des rattachements optionnels.
   * - WBS : doit exister et appartenir au même projet.
   * - Indicateur : doit exister ; son objectif doit appartenir au même projet.
   */
  private async validateLinks(
    projectId: string,
    wbsId?: string,
    logframeIndicatorId?: string,
  ): Promise<void> {
    if (wbsId) {
      const wbs = await this.wbsService.findOne(wbsId); // 404 WBS_NODE_NOT_FOUND sinon
      if (wbs.projectId !== projectId) {
        throw new ConflictException(
          ErrorCode.PTBA_INVALID_LINK,
          'Le nœud WBS appartient à un autre projet',
        );
      }
    }

    if (logframeIndicatorId) {
      const indicator = await this.logframeIndicatorService.findOne(logframeIndicatorId); // 404 sinon
      const objective = await this.logframeObjectiveService.findOne(indicator.objectiveId);
      if (objective.projectId !== projectId) {
        throw new ConflictException(
          ErrorCode.PTBA_INVALID_LINK,
          "L'objectif de l'indicateur appartient à un autre projet",
        );
      }
    }
  }

  /** Traduit une violation d'unicité Prisma (P2002) en conflit métier. */
  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(ErrorCode.CONFLICT, 'Conflit de données sur l’activité PTBA');
    }
    return error;
  }
}
