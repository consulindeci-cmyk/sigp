import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, Prisma, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto, UserStatusFilter } from './dto/user-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserKpisResponseDto } from './dto/user-kpis-response.dto';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';

/** Champs autorisés au tri (protège contre l'injection dans orderBy). */
const SORTABLE_FIELDS = [
  'nom',
  'prenom',
  'email',
  'role',
  'actif',
  'created_at',
  'updated_at',
  'derniere_connexion',
] as const;

/** Contexte de l'acteur réalisant l'action (pour l'audit). */
export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Liste paginée ──────────────────────────────────────────────────────────

  async findAll(query: UserQueryDto): Promise<PaginatedResult<UserResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const actif = query.status === undefined ? undefined : query.status === UserStatusFilter.ACTIVE;

    const { users, total } = await this.usersRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      role: query.role,
      actif,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(users.map(UserResponseDto.fromEntity), total, query);
  }

  // ─── KPIs synthétiques ──────────────────────────────────────────────────────

  async getKpis(user?: AuthenticatedUser): Promise<UserKpisResponseDto> {
    let organisationId: string | undefined;
    if (user && user.role !== UserRole.ADMIN) {
      const dbUser = await this.usersRepository.findById(user.id);
      organisationId = dbUser?.organisation_id || undefined;
    }
    return this.usersRepository.getPortfolioKpis({ organisationId });
  }

  // ─── Détail ─────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND, 'Utilisateur introuvable');
    }
    return UserResponseDto.fromEntity(user);
  }

  // ─── Création ───────────────────────────────────────────────────────────────

  async create(dto: CreateUserDto, actor: ActorContext = {}): Promise<UserResponseDto> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(ErrorCode.USER_EMAIL_TAKEN, 'Cet email est déjà utilisé par un compte actif');
    }

    // Argon2id obligatoire — jamais bcrypt, jamais SHA
    const motDePasse = await argon2.hash(dto.password, { type: argon2.argon2id });

    let user;
    try {
      user = await this.usersRepository.create({
        nom: dto.nom,
        prenom: dto.prenom,
        email: dto.email,
        motDePasse,
        role: dto.role ?? UserRole.VIEWER,
        telephone: dto.telephone,
      });
    } catch (error) {
      // Course entre le contrôle d'unicité et l'insert, ou email d'un compte soft-deleted
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          ErrorCode.USER_EMAIL_TAKEN,
          'Cet email est déjà utilisé (ou associé à un compte supprimé/désactivé)',
        );
      }
      throw error;
    }

    const response = UserResponseDto.fromEntity(user);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'users',
        enregistrementId: user.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.USER_CREATED, { userId: user.id, email: user.email });

    return response;
  }

  // ─── Modification ───────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateUserDto, actor: ActorContext = {}): Promise<UserResponseDto> {
    const existing = await this.usersRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND, 'Utilisateur introuvable');
    }

    const before = UserResponseDto.fromEntity(existing);

    const updated = await this.usersRepository.update(id, {
      nom: dto.nom,
      prenom: dto.prenom,
      telephone: dto.telephone,
      role: dto.role,
      actif: dto.actif,
    });

    const response = UserResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'users',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.USER_UPDATED, { userId: id });

    return response;
  }

  // ─── Suppression logique ────────────────────────────────────────────────────

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.usersRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND, 'Utilisateur introuvable');
    }

    await this.usersRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'users',
        enregistrementId: id,
        avant: { ...UserResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.USER_DELETED, { userId: id });
  }
}
