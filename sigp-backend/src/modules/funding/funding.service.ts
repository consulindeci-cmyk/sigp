import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFundingDto, UpdateFundingDto } from './dto/funding.dto';

@Injectable()
export class FundingService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyProject(projectId: string) {
    const p = await this.prisma.projet.findFirst({ where: { id: projectId, deletedAt: null } });
    if (!p) throw new NotFoundException('Projet introuvable');
  }

  async create(projectId: string, dto: CreateFundingDto) {
    await this.verifyProject(projectId);
    return this.prisma.sourceFinancement.create({
      data: {
        projet_id: projectId,
        nom_bailleur: dto.nom_bailleur,
        montant: dto.montant,
        devise: dto.devise,
        date_financement: dto.date_financement ? new Date(dto.date_financement) : undefined,
        commentaire: dto.commentaire,
      },
    });
  }

  async findAll(projectId: string) {
    await this.verifyProject(projectId);
    return this.prisma.sourceFinancement.findMany({
      where: { projet_id: projectId, deletedAt: null },
      orderBy: { nom_bailleur: 'asc' },
    });
  }

  async findOne(projectId: string, id: string) {
    const item = await this.prisma.sourceFinancement.findFirst({
      where: { id, projet_id: projectId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Source de financement introuvable');
    return item;
  }

  async update(projectId: string, id: string, dto: UpdateFundingDto) {
    await this.findOne(projectId, id);
    return this.prisma.sourceFinancement.update({
      where: { id },
      data: {
        nom_bailleur: dto.nom_bailleur,
        montant: dto.montant,
        devise: dto.devise,
        date_financement: dto.date_financement ? new Date(dto.date_financement) : undefined,
        commentaire: dto.commentaire,
      },
    });
  }

  async remove(projectId: string, id: string) {
    await this.findOne(projectId, id);
    return this.prisma.sourceFinancement.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  }
}
