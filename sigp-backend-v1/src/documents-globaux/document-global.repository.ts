import { Injectable } from '@nestjs/common';
import { DocumentGlobal, DocumentGlobalVersion, DocumentStatus, Prisma, Upload } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { DocumentGlobalVersionWithUpload } from './dto/document-global-version-response.dto';
import { DocumentGlobalWithVersions } from './dto/document-global-response.dto';

export interface CreateDocumentGlobalData {
  titre: string;
  description?: string | null;
  categorie?: string | null;
  statut?: DocumentStatus;
  createdBy?: string | null;
}

export interface UpdateDocumentGlobalData {
  titre?: string;
  description?: string | null;
  categorie?: string | null;
  statut?: DocumentStatus;
  updatedBy?: string | null;
}

export interface FindDocumentsGlobalParams {
  skip: number;
  take: number;
  search?: string;
  categorie?: string;
  statut?: DocumentStatus;
  createdBy?: string;
  mimeType?: string;
  fileType?: string;
  dateFrom?: string;
  dateTo?: string;
  orderBy: Prisma.DocumentGlobalOrderByWithRelationInput;
}

@Injectable()
export class DocumentGlobalRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async populateUploadsForVersions(
    documents: (DocumentGlobal & { versions?: DocumentGlobalVersion[] })[],
    tx?: Prisma.TransactionClient,
  ): Promise<DocumentGlobalWithVersions[]> {
    const client = tx ?? this.prisma;
    const allVersions = documents.flatMap((d) => d.versions ?? []);

    const uploadIds = Array.from(new Set(allVersions.map((v) => v.upload_id).filter(Boolean)));
    const userIds = Array.from(new Set([
      ...documents.map((d) => d.created_by),
      ...allVersions.map((v) => v.created_by),
    ].filter((id): id is string => Boolean(id))));

    const [uploads, users] = await Promise.all([
      uploadIds.length > 0 ? client.upload.findMany({ where: { id: { in: uploadIds } } }) : Promise.resolve([]),
      userIds.length > 0 ? client.user.findMany({ where: { id: { in: userIds } }, select: { id: true, nom: true, prenom: true } }) : Promise.resolve([]),
    ]);

    const uploadMap = new Map<string, Upload>();
    uploads.forEach((u) => uploadMap.set(u.id, u));

    const userMap = new Map<string, string>();
    users.forEach((u) => userMap.set(u.id, `${u.prenom} ${u.nom}`.trim()));

    return documents.map((doc) => ({
      ...doc,
      authorName: doc.created_by ? (userMap.get(doc.created_by) ?? null) : null,
      versions: (doc.versions ?? []).map((v) => ({
        ...v,
        upload: uploadMap.get(v.upload_id) ?? null,
        authorName: v.created_by ? (userMap.get(v.created_by) ?? null) : null,
      })),
    }));
  }

  async findManyPaginated(
    params: FindDocumentsGlobalParams,
    tx?: Prisma.TransactionClient,
  ): Promise<{ documents: DocumentGlobalWithVersions[]; total: number }> {
    const client = tx ?? this.prisma;
    let docIdsFilter: string[] | undefined;

    if (params.mimeType || params.fileType) {
      const mimeOrNameQuery = params.mimeType || params.fileType || '';
      const matchingUploads = await client.upload.findMany({
        where: {
          OR: [
            { mime_type: { contains: mimeOrNameQuery, mode: 'insensitive' } },
            { original_name: { contains: mimeOrNameQuery, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      const uploadIds = matchingUploads.map((u) => u.id);
      if (uploadIds.length > 0) {
        const matchingVersions = await client.documentGlobalVersion.findMany({
          where: { upload_id: { in: uploadIds } },
          select: { document_id: true },
        });
        docIdsFilter = Array.from(new Set(matchingVersions.map((v) => v.document_id)));
      } else {
        docIdsFilter = [];
      }
    }

    const where = this.buildWhere(params, docIdsFilter);

    const [rawDocuments, total] = await Promise.all([
      client.documentGlobal.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
        include: { versions: true },
      }),
      client.documentGlobal.count({ where }),
    ]);

    const documents = await this.populateUploadsForVersions(rawDocuments, tx);
    return { documents, total };
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<DocumentGlobalWithVersions | null> {
    const client = tx ?? this.prisma;
    const rawDoc = await client.documentGlobal.findFirst({
      where: { id, deleted_at: null },
      include: { versions: true },
    });
    if (!rawDoc) return null;

    const [populated] = await this.populateUploadsForVersions([rawDoc], tx);
    return populated ?? null;
  }

  async create(data: CreateDocumentGlobalData, tx?: Prisma.TransactionClient): Promise<DocumentGlobalWithVersions> {
    const client = tx ?? this.prisma;
    const created = await client.documentGlobal.create({
      data: {
        titre: data.titre,
        description: data.description ?? null,
        categorie: data.categorie ?? null,
        statut: data.statut ?? undefined,
        created_by: data.createdBy ?? null,
      },
      include: { versions: true },
    });
    const [populated] = await this.populateUploadsForVersions([created], tx);
    return populated;
  }

  async update(id: string, data: UpdateDocumentGlobalData, tx?: Prisma.TransactionClient): Promise<DocumentGlobalWithVersions> {
    const client = tx ?? this.prisma;
    const updated = await client.documentGlobal.update({
      where: { id },
      data: {
        titre: data.titre,
        description: data.description,
        categorie: data.categorie,
        statut: data.statut,
        updated_by: data.updatedBy,
      },
      include: { versions: true },
    });
    const [populated] = await this.populateUploadsForVersions([updated], tx);
    return populated;
  }

  async softDelete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.documentGlobal.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  // ── Versions Repository Methods ─────────────────────────────────────────────

  async findVersionsByDocumentId(documentId: string, tx?: Prisma.TransactionClient): Promise<DocumentGlobalVersionWithUpload[]> {
    const client = tx ?? this.prisma;
    const versions = await client.documentGlobalVersion.findMany({
      where: { document_id: documentId },
      orderBy: { numero_version: 'desc' },
    });
    const uploadIds = Array.from(new Set(versions.map((v) => v.upload_id).filter(Boolean)));
    const userIds = Array.from(new Set(versions.map((v) => v.created_by).filter((id): id is string => Boolean(id))));

    const [uploads, users] = await Promise.all([
      uploadIds.length > 0 ? client.upload.findMany({ where: { id: { in: uploadIds } } }) : Promise.resolve([]),
      userIds.length > 0 ? client.user.findMany({ where: { id: { in: userIds } }, select: { id: true, nom: true, prenom: true } }) : Promise.resolve([]),
    ]);

    const uploadMap = new Map<string, Upload>();
    uploads.forEach((u) => uploadMap.set(u.id, u));

    const userMap = new Map<string, string>();
    users.forEach((u) => userMap.set(u.id, `${u.prenom} ${u.nom}`.trim()));

    return versions.map((v) => ({
      ...v,
      upload: uploadMap.get(v.upload_id) ?? null,
      authorName: v.created_by ? (userMap.get(v.created_by) ?? null) : null,
    }));
  }

  async findVersionByNumber(
    documentId: string,
    numeroVersion: number,
    tx?: Prisma.TransactionClient,
  ): Promise<DocumentGlobalVersionWithUpload | null> {
    const client = tx ?? this.prisma;
    const version = await client.documentGlobalVersion.findUnique({
      where: { document_id_numero_version: { document_id: documentId, numero_version: numeroVersion } },
    });
    if (!version) return null;

    const [upload, user] = await Promise.all([
      client.upload.findUnique({ where: { id: version.upload_id } }),
      version.created_by ? client.user.findUnique({ where: { id: version.created_by }, select: { nom: true, prenom: true } }) : Promise.resolve(null),
    ]);
    const authorName = user ? `${user.prenom} ${user.nom}`.trim() : null;
    return { ...version, upload, authorName };
  }

  async findLatestVersionNumber(documentId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx ?? this.prisma;
    const agg = await client.documentGlobalVersion.aggregate({
      where: { document_id: documentId },
      _max: { numero_version: true },
    });
    return agg._max.numero_version ?? 0;
  }

  async createVersion(
    data: {
      documentId: string;
      numeroVersion: number;
      uploadId: string;
      dateVersion?: Date;
      notes?: string | null;
      createdBy?: string | null;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<DocumentGlobalVersionWithUpload> {
    const client = tx ?? this.prisma;
    const version = await client.documentGlobalVersion.create({
      data: {
        document_id: data.documentId,
        numero_version: data.numeroVersion,
        upload_id: data.uploadId,
        date_version: data.dateVersion ?? new Date(),
        notes: data.notes ?? null,
        created_by: data.createdBy ?? null,
      },
    });
    const [upload, user] = await Promise.all([
      client.upload.findUnique({ where: { id: data.uploadId } }),
      data.createdBy ? client.user.findUnique({ where: { id: data.createdBy }, select: { nom: true, prenom: true } }) : Promise.resolve(null),
    ]);
    const authorName = user ? `${user.prenom} ${user.nom}`.trim() : null;
    return { ...version, upload, authorName };
  }

  private buildWhere(params: FindDocumentsGlobalParams, docIdsFilter?: string[]): Prisma.DocumentGlobalWhereInput {
    const where: Prisma.DocumentGlobalWhereInput = {
      deleted_at: null,
    };

    if (docIdsFilter !== undefined) {
      where.id = { in: docIdsFilter };
    }
    if (params.categorie) {
      where.categorie = params.categorie;
    }
    if (params.statut) {
      where.statut = params.statut;
    }
    if (params.createdBy) {
      where.created_by = params.createdBy;
    }
    if (params.dateFrom || params.dateTo) {
      where.created_at = {};
      if (params.dateFrom) {
        const dFrom = new Date(params.dateFrom);
        if (!isNaN(dFrom.getTime())) where.created_at.gte = dFrom;
      }
      if (params.dateTo) {
        const dTo = new Date(params.dateTo);
        if (!isNaN(dTo.getTime())) {
          dTo.setHours(23, 59, 59, 999);
          where.created_at.lte = dTo;
        }
      }
    }
    if (params.search) {
      where.OR = [
        { titre: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { categorie: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
