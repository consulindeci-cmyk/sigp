import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateDocumentDto, QueryDocumentsDto } from './dto/document.dto';
import { TypeDocument } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyProject(projectId: string) {
    const p = await this.prisma.projet.findFirst({ where: { id: projectId, deletedAt: null } });
    if (!p) throw new NotFoundException('Projet introuvable');
  }

  async upload(
    projectId: string,
    userId: string,
    file: Express.Multer.File,
    typeDocument: TypeDocument = TypeDocument.AUTRE,
  ) {
    await this.verifyProject(projectId);
    if (!file) throw new BadRequestException('Aucun fichier fourni');

    const urlFichier = `/uploads/${file.filename}`;

    return this.prisma.document.create({
      data: {
        projet_id: projectId,
        nom_fichier: file.originalname,
        url_fichier: urlFichier,
        type_document: typeDocument,
        taille_fichier: file.size,
        uploade_par: userId,
      },
    });
  }

  async findAll(projectId: string, query: QueryDocumentsDto) {
    await this.verifyProject(projectId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: any = { projet_id: projectId, deletedAt: null };
    if (query.type_document) where.type_document = query.type_document;

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date_upload: 'desc' },
        include: { uploadePar: { select: { id: true, prenom: true, nom: true } } },
      }),
      this.prisma.document.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(projectId: string, id: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, projet_id: projectId, deletedAt: null },
      include: { uploadePar: { select: { id: true, prenom: true, nom: true, email: true } } },
    });
    if (!doc) throw new NotFoundException('Document introuvable');
    return doc;
  }

  async getFilePath(projectId: string, id: string): Promise<string> {
    const doc = await this.findOne(projectId, id);
    const filePath = path.join(process.cwd(), doc.url_fichier);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Fichier physique introuvable sur le serveur');
    }
    return filePath;
  }

  async update(projectId: string, id: string, dto: UpdateDocumentDto) {
    await this.findOne(projectId, id);
    return this.prisma.document.update({ where: { id }, data: dto });
  }

  async remove(projectId: string, id: string) {
    await this.findOne(projectId, id);
    // Soft delete — conserver le fichier physique
    return this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, nom_fichier: true, deletedAt: true },
    });
  }
}
