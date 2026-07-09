import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { ProjectService } from '@/projects/project.service';
import { ReportRepository } from './report.repository';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportResponseDto } from './dto/report-response.dto';

const SORTABLE_FIELDS = [
  'code_rapport',
  'titre',
  'type',
  'format',
  'statut',
  'periode',
  'date_generation',
  'auteur',
  'created_at',
  'updated_at',
] as const;

export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class ReportService {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly projectService: ProjectService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: ReportQueryDto): Promise<PaginatedResult<ReportResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { reports, total } = await this.reportRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      projectId: query.projectId,
      type: query.type,
      format: query.format,
      statut: query.statut,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(reports.map(ReportResponseDto.fromEntity), total, query);
  }

  async findOne(id: string): Promise<ReportResponseDto> {
    const report = await this.reportRepository.findById(id);
    if (!report) {
      throw new NotFoundException(ErrorCode.REPORT_NOT_FOUND, 'Rapport introuvable');
    }
    return ReportResponseDto.fromEntity(report);
  }

  async create(dto: CreateReportDto, actor: ActorContext = {}): Promise<ReportResponseDto> {
    await this.projectService.findOne(dto.projectId);

    const report = await this.reportRepository.create({
      projectId: dto.projectId,
      codeRapport: dto.codeRapport,
      titre: dto.titre,
      description: dto.description ?? null,
      type: dto.type,
      format: dto.format,
      statut: dto.statut,
      periode: dto.periode,
      dateGeneration: new Date(dto.dateGeneration),
      dateTelechargement: dto.dateTelechargement ? new Date(dto.dateTelechargement) : null,
      version: dto.version,
      auteur: dto.auteur,
      tailleKo: dto.tailleKo ?? 0,
      nbTelechargements: dto.nbTelechargements ?? 0,
      commentaires: dto.commentaires ?? null,
      createdBy: actor.userId ?? null,
    });

    const response = ReportResponseDto.fromEntity(report);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'rapports_projet',
        enregistrementId: report.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.REPORT_CREATED, {
      reportId: report.id,
      projectId: report.project_id,
    });

    return response;
  }

  async update(
    id: string,
    dto: UpdateReportDto,
    actor: ActorContext = {},
  ): Promise<ReportResponseDto> {
    const existing = await this.reportRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.REPORT_NOT_FOUND, 'Rapport introuvable');
    }

    const before = ReportResponseDto.fromEntity(existing);

    const updated = await this.reportRepository.update(id, {
      codeRapport: dto.codeRapport,
      titre: dto.titre,
      description: dto.description,
      type: dto.type,
      format: dto.format,
      statut: dto.statut,
      periode: dto.periode,
      dateGeneration: dto.dateGeneration ? new Date(dto.dateGeneration) : undefined,
      dateTelechargement: dto.dateTelechargement ? new Date(dto.dateTelechargement) : undefined,
      version: dto.version,
      auteur: dto.auteur,
      tailleKo: dto.tailleKo,
      nbTelechargements: dto.nbTelechargements,
      commentaires: dto.commentaires,
      updatedBy: actor.userId ?? null,
    });

    const response = ReportResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'rapports_projet',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.REPORT_UPDATED, { reportId: id });

    return response;
  }

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.reportRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.REPORT_NOT_FOUND, 'Rapport introuvable');
    }

    await this.reportRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'rapports_projet',
        enregistrementId: id,
        avant: { ...ReportResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.REPORT_DELETED, {
      reportId: id,
      projectId: existing.project_id,
    });
  }
}
