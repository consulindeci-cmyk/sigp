import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLogframeDto, UpdateLogframeDto } from './dto/logframe.dto';

@Injectable()
export class LogframeService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyProject(projectId: string) {
    const p = await this.prisma.projet.findFirst({ where: { id: projectId, deletedAt: null } });
    if (!p) throw new NotFoundException('Projet introuvable');
  }

  async create(projectId: string, dto: CreateLogframeDto) {
    await this.verifyProject(projectId);
    return this.prisma.cadreLogique.create({
      data: { ...dto, projet_id: projectId },
    });
  }

  async findAll(projectId: string) {
    await this.verifyProject(projectId);
    return this.prisma.cadreLogique.findMany({
      where: { projet_id: projectId, deletedAt: null },
      orderBy: { niveau_intervention: 'asc' },
    });
  }

  async findOne(projectId: string, id: string) {
    const item = await this.prisma.cadreLogique.findFirst({
      where: { id, projet_id: projectId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Entrée cadre logique introuvable');
    return item;
  }

  async update(projectId: string, id: string, dto: UpdateLogframeDto) {
    await this.findOne(projectId, id);
    return this.prisma.cadreLogique.update({ where: { id }, data: dto });
  }

  async remove(projectId: string, id: string) {
    await this.findOne(projectId, id);
    return this.prisma.cadreLogique.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  }
}
