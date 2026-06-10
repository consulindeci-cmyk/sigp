import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWbsDto, UpdateWbsDto } from './dto/wbs.dto';

@Injectable()
export class WbsService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyProject(projectId: string) {
    const p = await this.prisma.projet.findFirst({ where: { id: projectId, deletedAt: null } });
    if (!p) throw new NotFoundException('Projet introuvable');
  }

  async create(projectId: string, dto: CreateWbsDto) {
    await this.verifyProject(projectId);
    return this.prisma.wBS.create({ data: { ...dto, projet_id: projectId } });
  }

  async findAll(projectId: string) {
    await this.verifyProject(projectId);
    return this.prisma.wBS.findMany({
      where: { projet_id: projectId, deletedAt: null },
      orderBy: { code_wbs: 'asc' },
      include: { _count: { select: { taches: { where: { deletedAt: null } } } } },
    });
  }

  async findOne(projectId: string, id: string) {
    const item = await this.prisma.wBS.findFirst({
      where: { id, projet_id: projectId, deletedAt: null },
      include: { taches: { where: { deletedAt: null }, orderBy: { code_tache: 'asc' } } },
    });
    if (!item) throw new NotFoundException('Phase WBS introuvable');
    return item;
  }

  async update(projectId: string, id: string, dto: UpdateWbsDto) {
    await this.findOne(projectId, id);
    return this.prisma.wBS.update({ where: { id }, data: dto });
  }

  async remove(projectId: string, id: string) {
    await this.findOne(projectId, id);
    return this.prisma.wBS.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  }
}
