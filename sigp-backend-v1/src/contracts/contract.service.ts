import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { ProjectService } from '@/projects/project.service';
import { FundingSourceService } from '@/funding-sources/funding-source.service';
import { ContractRepository } from './contract.repository';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ContractQueryDto } from './dto/contract-query.dto';
import { ContractResponseDto } from './dto/contract-response.dto';

const SORTABLE_FIELDS = [
  'numero',
  'intitule',
  'type',
  'statut',
  'titulaire',
  'montant',
  'devise',
  'date_signature',
  'date_debut',
  'date_fin',
  'created_at',
  'updated_at',
] as const;

export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class ContractService {
  constructor(
    private readonly contractRepository: ContractRepository,
    private readonly projectService: ProjectService,
    private readonly fundingSourceService: FundingSourceService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: ContractQueryDto): Promise<PaginatedResult<ContractResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { contracts, total } = await this.contractRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      projectId: query.projectId,
      type: query.type,
      statut: query.statut,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(contracts.map(ContractResponseDto.fromEntity), total, query);
  }

  async findOne(id: string): Promise<ContractResponseDto> {
    const contract = await this.contractRepository.findById(id);
    if (!contract) {
      throw new NotFoundException(ErrorCode.CONTRACT_NOT_FOUND, 'Contrat introuvable');
    }
    return ContractResponseDto.fromEntity(contract);
  }

  async create(dto: CreateContractDto, actor: ActorContext = {}): Promise<ContractResponseDto> {
    await this.validateRelations(dto);

    let contract;
    try {
      contract = await this.contractRepository.create({
        projectId: dto.projectId,
        marcheId: dto.marcheId ?? null,
        numero: dto.numero,
        intitule: dto.intitule,
        type: dto.type,
        statut: dto.statut,
        titulaire: dto.titulaire,
        montant: dto.montant,
        devise: dto.devise,
        dateSignature: dto.dateSignature ? new Date(dto.dateSignature) : null,
        dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : null,
        dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
        notes: dto.notes ?? null,
        createdBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = ContractResponseDto.fromEntity(contract);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'contracts',
        enregistrementId: contract.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.CONTRACT_CREATED, {
      contractId: contract.id,
      projectId: contract.project_id,
      statut: contract.statut,
    });

    return response;
  }

  async update(
    id: string,
    dto: UpdateContractDto,
    actor: ActorContext = {},
  ): Promise<ContractResponseDto> {
    const existing = await this.contractRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.CONTRACT_NOT_FOUND, 'Contrat introuvable');
    }

    const before = ContractResponseDto.fromEntity(existing);

    let updated;
    try {
      updated = await this.contractRepository.update(id, {
        marcheId: dto.marcheId,
        numero: dto.numero,
        intitule: dto.intitule,
        type: dto.type,
        statut: dto.statut,
        titulaire: dto.titulaire,
        montant: dto.montant,
        devise: dto.devise,
        dateSignature: dto.dateSignature ? new Date(dto.dateSignature) : undefined,
        dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : undefined,
        dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
        notes: dto.notes,
        updatedBy: actor.userId,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    const response = ContractResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'contracts',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.CONTRACT_UPDATED, { contractId: id });

    return response;
  }

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.contractRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.CONTRACT_NOT_FOUND, 'Contrat introuvable');
    }

    await this.contractRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'contracts',
        enregistrementId: id,
        avant: { ...ContractResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.CONTRACT_DELETED, { contractId: id });
  }

  private async validateRelations(dto: CreateContractDto): Promise<void> {
    await this.projectService.findOne(dto.projectId);

    if (dto.fundingSourceId) {
      const source = await this.fundingSourceService.findOne(dto.fundingSourceId);
      if (source.projectId !== dto.projectId) {
        throw new ConflictException(
          ErrorCode.CONTRACT_COHERENCE_VIOLATION,
          "La source de financement n'appartient pas au projet du contrat",
        );
      }
    }
  }

  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(ErrorCode.CONFLICT, 'Conflit de données sur le contrat');
    }
    return error;
  }
}
