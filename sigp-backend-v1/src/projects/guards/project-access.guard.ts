import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { Request } from 'express';

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user as AuthenticatedUser;

    if (!user) {
      return false;
    }

    let projectId: string | undefined =
      request.params?.projectId ||
      (typeof request.query?.projectId === 'string' ? request.query.projectId : undefined) ||
      request.body?.projectId;

    if (!projectId && request.params?.id) {
      const paramId = request.params.id;
      const projectExists = await this.prisma.project.findUnique({
        where: { id: paramId },
        select: { id: true },
      });
      if (projectExists) {
        projectId = paramId;
      } else {
        const documentExists = await this.prisma.documentProjet.findUnique({
          where: { id: paramId },
          select: { project_id: true },
        });
        if (documentExists) {
          projectId = documentExists.project_id;
        } else {
          if (request.baseUrl?.includes('/projects') || request.path?.includes('/projects')) {
            throw new NotFoundException(`Projet avec l'ID ${paramId} non trouvé.`);
          }
          throw new NotFoundException(`Ressource (ID: ${paramId}) non trouvée.`);
        }
      }
    }

    if (!projectId) {
      return true;
    }

    // Les ADMIN ont accès à tout
    if (user.role === 'ADMIN') {
      return true;
    }

    // Vérifier si l'utilisateur appartient à une organisation
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { organisation_id: true },
    });

    if (!dbUser || !dbUser.organisation_id) {
      throw new ForbiddenException("Accès refusé : vous n'êtes rattaché à aucune organisation.");
    }

    // Retrouver le projet et remonter la chaîne hiérarchique
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        programme: {
          include: {
            unite: {
              include: {
                departement: {
                  include: {
                    direction: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Projet avec l'ID ${projectId} non trouvé.`);
    }

    const projectOrganisationId = project.programme?.unite?.departement?.direction?.organisation_id;

    if (!projectOrganisationId) {
      throw new ForbiddenException("Accès refusé : le projet n'a pas d'organisation définie.");
    }

    if (projectOrganisationId !== dbUser.organisation_id) {
      throw new ForbiddenException(
        "Accès refusé : vous n'appartenez pas à la même organisation que ce projet.",
      );
    }

    return true;
  }
}
