import { Injectable } from '@nestjs/common';
import { Prisma, Upload } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UploadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UploadUncheckedCreateInput, tx?: Prisma.TransactionClient): Promise<Upload> {
    const client = tx ?? this.prisma;
    return client.upload.create({ data });
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<Upload | null> {
    const client = tx ?? this.prisma;
    return client.upload.findUnique({ where: { id } });
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<Upload> {
    const client = tx ?? this.prisma;
    return client.upload.delete({ where: { id } });
  }
}
