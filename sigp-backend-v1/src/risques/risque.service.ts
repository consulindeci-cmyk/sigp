import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, RiskImpact, RiskProbability } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { ProjectService } from '@/projects/project.service';
import { RisqueRepository } from './risque.repository';
import { CreateRisqueDto } from './dto/create-risque.dto';
import { UpdateRisqueDto } from './dto/update-risque.dto';
import { RisqueQueryDto } from './dto/risque-query.dto';
import { RisqueResponseDto } from './dto/risque-response.dto';

const SORTABLE_FIELDS = [
  'code',
  'description',
  'categorie',
  'probabilite',
  'impact',
  'niveau_criticite',
  'statut',
  'date_detection',
  'date_echeance',
  'created_at',
  'updated_at',
] as const;

export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class RisqueService {
  constructor(
    private readonly risqueRepository: RisqueRepository,
    private readonly projectService: ProjectService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: RisqueQueryDto): Promise<PaginatedResult<RisqueResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { risques, total } = await this.risqueRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      projectId: query.projectId,
      probabilite: query.probabilite,
      impact: query.impact,
      statut: query.statut,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(risques.map(RisqueResponseDto.fromEntity), total, query);
  }

  async findOne(id: string): Promise<RisqueResponseDto> {
    const risque = await this.risqueRepository.findById(id);
    if (!risque) {
      throw new NotFoundException(ErrorCode.RISK_NOT_FOUND, 'Risque introuvable');
    }
    return RisqueResponseDto.fromEntity(risque);
  }

  async create(dto: CreateRisqueDto, actor: ActorContext = {}): Promise<RisqueResponseDto> {
    await this.projectService.findOne(dto.projectId);

    const niveauCriticite = this.computeNiveauCriticite(dto.probabilite, dto.impact);

    const risque = await this.risqueRepository.create({
      projectId: dto.projectId,
      wbsId: dto.wbsId ?? null,
      code: dto.code ?? null,
      description: dto.description,
      categorie: dto.categorie ?? null,
      probabilite: dto.probabilite,
      impact: dto.impact,
      niveauCriticite,
      statut: dto.statut,
      strategie: dto.strategie ?? null,
      planAction: dto.planAction ?? null,
      responsableId: dto.responsableId ?? null,
      dateDetection: dto.dateDetection ? new Date(dto.dateDetection) : null,
      dateEcheance: dto.dateEcheance ? new Date(dto.dateEcheance) : null,
      createdBy: actor.userId ?? null,
    });

    const response = RisqueResponseDto.fromEntity(risque);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'risques',
        enregistrementId: risque.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.RISQUE_CREATED, {
      risqueId: risque.id,
      projectId: risque.project_id,
      niveauCriticite,
    });

    if (niveauCriticite === 'CRITIQUE') {
      this.eventEmitter.emit(AppEvent.RISK_CRITICAL_DETECTED, {
        risqueId: risque.id,
        projectId: risque.project_id,
        niveauCriticite,
        probabilite: risque.probabilite,
        impact: risque.impact,
      });
    }

    return response;
  }

  async update(
    id: string,
    dto: UpdateRisqueDto,
    actor: ActorContext = {},
  ): Promise<RisqueResponseDto> {
    const existing = await this.risqueRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.RISK_NOT_FOUND, 'Risque introuvable');
    }

    const before = RisqueResponseDto.fromEntity(existing);

    const effProb = dto.probabilite ?? existing.probabilite;
    const effImpact = dto.impact ?? existing.impact;
    const niveauCriticite = this.computeNiveauCriticite(effProb, effImpact);

    const updated = await this.risqueRepository.update(id, {
      wbsId: dto.wbsId,
      code: dto.code,
      description: dto.description,
      categorie: dto.categorie,
      probabilite: dto.probabilite,
      impact: dto.impact,
      niveauCriticite,
      statut: dto.statut,
      strategie: dto.strategie,
      planAction: dto.planAction,
      responsableId: dto.responsableId,
      dateDetection: dto.dateDetection ? new Date(dto.dateDetection) : undefined,
      dateEcheance: dto.dateEcheance ? new Date(dto.dateEcheance) : undefined,
      updatedBy: actor.userId ?? null,
    });

    const response = RisqueResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'risques',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.RISQUE_UPDATED, { risqueId: id });

    if (dto.statut && dto.statut !== existing.statut) {
      this.eventEmitter.emit(AppEvent.RISK_STATUS_CHANGED, {
        risqueId: id,
        oldStatut: existing.statut,
        newStatut: dto.statut,
      });
    }

    if (niveauCriticite === 'CRITIQUE' && before.niveauCriticite !== 'CRITIQUE') {
      this.eventEmitter.emit(AppEvent.RISK_CRITICAL_DETECTED, {
        risqueId: id,
        projectId: existing.project_id,
        niveauCriticite,
        probabilite: updated.probabilite,
        impact: updated.impact,
      });
    }

    return response;
  }

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.risqueRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.RISK_NOT_FOUND, 'Risque introuvable');
    }

    await this.risqueRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'risques',
        enregistrementId: id,
        avant: { ...RisqueResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.RISQUE_DELETED, {
      risqueId: id,
      projectId: existing.project_id,
    });
  }

  private computeNiveauCriticite(probabilite: RiskProbability, impact: RiskImpact): string {
    const probScore: Record<RiskProbability, number> = {
      FAIBLE: 1,
      POSSIBLE: 2,
      PROBABLE: 3,
      QUASI_CERTAIN: 4,
    };
    const impactScore: Record<RiskImpact, number> = {
      FAIBLE: 1,
      MODERE: 2,
      IMPORTANT: 3,
      CRITIQUE: 4,
    };
    const score = probScore[probabilite] * impactScore[impact];
    if (score <= 2) return 'FAIBLE';
    if (score <= 4) return 'MODERE';
    if (score <= 8) return 'ELEVE';
    return 'CRITIQUE';
  }
}
