import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, Prisma, RoleMembreProjet } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { ProjectService } from '@/projects/project.service';
import { UsersService } from '@/users/users.service';
import { ProjectMemberRepository } from './project-member.repository';
import { CreateProjectMemberDto } from './dto/create-project-member.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import { ProjectMemberQueryDto } from './dto/project-member-query.dto';
import { ProjectMemberResponseDto } from './dto/project-member-response.dto';

/** Champs autorisés au tri (protège contre l'injection dans orderBy). */
const SORTABLE_FIELDS = [
  'role_projet',
  'actif',
  'date_debut',
  'date_fin',
  'created_at',
  'updated_at',
] as const;

/** Contexte de l'acteur réalisant l'action (pour l'audit). */
export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class ProjectMemberService {
  constructor(
    private readonly projectMemberRepository: ProjectMemberRepository,
    private readonly projectService: ProjectService,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Liste paginée ──────────────────────────────────────────────────────────

  async findAll(query: ProjectMemberQueryDto): Promise<PaginatedResult<ProjectMemberResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { members, total } = await this.projectMemberRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      projectId: query.projectId,
      userId: query.userId,
      role: query.role,
      actif: query.actif,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(members.map(ProjectMemberResponseDto.fromEntity), total, query);
  }

  // ─── Détail ─────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<ProjectMemberResponseDto> {
    const member = await this.projectMemberRepository.findById(id);
    if (!member) {
      throw new NotFoundException(
        ErrorCode.PROJECT_MEMBER_NOT_FOUND,
        'Membre de projet introuvable',
      );
    }
    return ProjectMemberResponseDto.fromEntity(member);
  }

  // ─── Création ───────────────────────────────────────────────────────────────

  async create(
    dto: CreateProjectMemberDto,
    actor: ActorContext = {},
  ): Promise<ProjectMemberResponseDto> {
    // 1. Le projet doit exister (lève PROJECT_NOT_FOUND / 404 sinon)
    await this.projectService.findOne(dto.projectId);

    // 2. L'utilisateur doit exister (lève USER_NOT_FOUND / 404 sinon)
    await this.usersService.findOne(dto.userId);

    // 3. Le couple (projet, utilisateur) ne doit pas déjà exister
    const existing = await this.projectMemberRepository.findByProjectAndUser(
      dto.projectId,
      dto.userId,
    );
    if (existing) {
      throw new ConflictException(
        ErrorCode.PROJECT_MEMBER_ALREADY_EXISTS,
        'Cet utilisateur est déjà membre de ce projet',
      );
    }

    let member;
    try {
      member = await this.projectMemberRepository.create({
        projectId: dto.projectId,
        userId: dto.userId,
        role: dto.role ?? RoleMembreProjet.MEMBRE,
        createdBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = ProjectMemberResponseDto.fromEntity(member);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'project_members',
        enregistrementId: member.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.PROJECT_MEMBER_ADDED, {
      projectMemberId: member.id,
      projectId: member.project_id,
      userId: member.user_id,
    });

    return response;
  }

  // ─── Modification ───────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateProjectMemberDto,
    actor: ActorContext = {},
  ): Promise<ProjectMemberResponseDto> {
    const existing = await this.projectMemberRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(
        ErrorCode.PROJECT_MEMBER_NOT_FOUND,
        'Membre de projet introuvable',
      );
    }

    const before = ProjectMemberResponseDto.fromEntity(existing);

    const updated = await this.projectMemberRepository.update(id, {
      role: dto.role,
      actif: dto.actif,
      updatedBy: actor.userId,
    });

    const response = ProjectMemberResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'project_members',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.PROJECT_MEMBER_UPDATED, { projectMemberId: id });

    return response;
  }

  // ─── Suppression logique ────────────────────────────────────────────────────

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.projectMemberRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(
        ErrorCode.PROJECT_MEMBER_NOT_FOUND,
        'Membre de projet introuvable',
      );
    }

    await this.projectMemberRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'project_members',
        enregistrementId: id,
        avant: { ...ProjectMemberResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.PROJECT_MEMBER_REMOVED, {
      projectMemberId: id,
      projectId: existing.project_id,
      userId: existing.user_id,
    });
  }

  // ─── Helper privé ─────────────────────────────────────────────────────────────

  /** Traduit une violation d'unicité Prisma (P2002) en conflit métier explicite. */
  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(
        ErrorCode.PROJECT_MEMBER_ALREADY_EXISTS,
        'Cet utilisateur est déjà membre de ce projet',
      );
    }
    return error;
  }
}
