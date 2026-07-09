import { Injectable } from '@nestjs/common';
import { ProjectService } from '@/projects/project.service';
import { PtbaService } from '@/ptba/ptba.service';
import { BudgetVersionService } from '@/budget-versions/budget-version.service';
import { BudgetLineService } from '@/budget-lines/budget-line.service';
import { RisqueService } from '@/risques/risque.service';
import { PpmService } from '@/ppm/ppm.service';
import { LivrableService } from '@/livrables/livrable.service';
import { DocumentService } from '@/documents/document.service';
import { ReportService } from '@/reports/report.service';
import { NotificationService } from '@/notifications/notification.service';
import { ProjectQueryDto } from '@/projects/dto/project-query.dto';
import { PtbaQueryDto } from '@/ptba/dto/ptba-query.dto';
import { BudgetVersionQueryDto } from '@/budget-versions/dto/budget-version-query.dto';
import { BudgetLineQueryDto } from '@/budget-lines/dto/budget-line-query.dto';
import { RisqueQueryDto } from '@/risques/dto/risque-query.dto';
import { PpmQueryDto } from '@/ppm/dto/ppm-query.dto';
import { LivrableQueryDto } from '@/livrables/dto/livrable-query.dto';
import { DocumentQueryDto } from '@/documents/dto/document-query.dto';
import { ReportQueryDto } from '@/reports/dto/report-query.dto';
import { NotificationQueryDto } from '@/notifications/dto/notification-query.dto';
import { ProjectResponseDto } from '@/projects/dto/project-response.dto';
import { PtbaResponseDto } from '@/ptba/dto/ptba-response.dto';
import { BudgetVersionResponseDto } from '@/budget-versions/dto/budget-version-response.dto';
import { BudgetLineResponseDto } from '@/budget-lines/dto/budget-line-response.dto';
import { RisqueResponseDto } from '@/risques/dto/risque-response.dto';
import { PpmResponseDto } from '@/ppm/dto/ppm-response.dto';
import { LivrableResponseDto } from '@/livrables/dto/livrable-response.dto';
import { DocumentResponseDto } from '@/documents/dto/document-response.dto';
import { ReportResponseDto } from '@/reports/dto/report-response.dto';
import { NotificationResponseDto } from '@/notifications/dto/notification-response.dto';
import { GlobalSearchQueryDto, SearchModuleFilter } from './dto/global-search-query.dto';
import { GlobalSearchItemDto } from './dto/global-search-item.dto';
import { GlobalSearchResponseDto } from './dto/global-search-response.dto';

const MAX_RESULTS = 20;
const SEARCH_LIMIT = 20;

@Injectable()
export class GlobalSearchService {
  constructor(
    private readonly projectService: ProjectService,
    private readonly ptbaService: PtbaService,
    private readonly budgetVersionService: BudgetVersionService,
    private readonly budgetLineService: BudgetLineService,
    private readonly risqueService: RisqueService,
    private readonly ppmService: PpmService,
    private readonly livrableService: LivrableService,
    private readonly documentService: DocumentService,
    private readonly reportService: ReportService,
    private readonly notificationService: NotificationService,
  ) {}

  async search(queryDto: GlobalSearchQueryDto): Promise<GlobalSearchResponseDto> {
    const { query, module: moduleFilter } = queryDto;
    const base = { page: 1, limit: SEARCH_LIMIT, search: query };
    const allItems: GlobalSearchItemDto[] = [];

    const shouldSearch = (m: SearchModuleFilter) => !moduleFilter || moduleFilter === m;

    const tasks: Promise<void>[] = [];

    if (shouldSearch(SearchModuleFilter.PROJECTS)) {
      tasks.push(
        this.projectService.findAll({ ...base } as ProjectQueryDto).then((r) => {
          allItems.push(...r.data.map((p) => this.mapProject(p)));
        }),
      );
    }

    if (shouldSearch(SearchModuleFilter.PTBA)) {
      tasks.push(
        this.ptbaService.findAll({ ...base } as PtbaQueryDto).then((r) => {
          allItems.push(...r.data.map((p) => this.mapPtba(p)));
        }),
      );
    }

    if (shouldSearch(SearchModuleFilter.BUDGET)) {
      tasks.push(
        this.budgetVersionService.findAll({ ...base } as BudgetVersionQueryDto).then((r) => {
          allItems.push(...r.data.map((v) => this.mapBudgetVersion(v)));
        }),
      );
      tasks.push(
        this.budgetLineService.findAll({ ...base } as BudgetLineQueryDto).then((r) => {
          allItems.push(...r.data.map((l) => this.mapBudgetLine(l)));
        }),
      );
    }

    if (shouldSearch(SearchModuleFilter.RISQUES)) {
      tasks.push(
        this.risqueService.findAll({ ...base } as RisqueQueryDto).then((r) => {
          allItems.push(...r.data.map((r2) => this.mapRisque(r2)));
        }),
      );
    }

    if (shouldSearch(SearchModuleFilter.PPM)) {
      tasks.push(
        this.ppmService.findAll({ ...base } as PpmQueryDto).then((r) => {
          allItems.push(...r.data.map((m) => this.mapPpm(m)));
        }),
      );
    }

    if (shouldSearch(SearchModuleFilter.LIVRABLES)) {
      tasks.push(
        this.livrableService.findAll({ ...base } as LivrableQueryDto).then((r) => {
          allItems.push(...r.data.map((l) => this.mapLivrable(l)));
        }),
      );
    }

    if (shouldSearch(SearchModuleFilter.DOCUMENTS)) {
      tasks.push(
        this.documentService.findAll({ ...base } as DocumentQueryDto).then((r) => {
          allItems.push(...r.data.map((d) => this.mapDocument(d)));
        }),
      );
    }

    if (shouldSearch(SearchModuleFilter.REPORTS)) {
      tasks.push(
        this.reportService.findAll({ ...base } as ReportQueryDto).then((r) => {
          allItems.push(...r.data.map((rp) => this.mapReport(rp)));
        }),
      );
    }

    if (shouldSearch(SearchModuleFilter.NOTIFICATIONS)) {
      tasks.push(
        this.notificationService
          .findAll({ ...base } as unknown as NotificationQueryDto)
          .then((r) => {
            allItems.push(...r.data.map((n) => this.mapNotification(n)));
          }),
      );
    }

    await Promise.all(tasks);

    const sorted = this.sortByRelevance(allItems, query);
    const limited = sorted.slice(0, MAX_RESULTS);

    return { items: limited, total: limited.length, query };
  }

  private sortByRelevance(items: GlobalSearchItemDto[], query: string): GlobalSearchItemDto[] {
    const q = query.toLowerCase();
    return [...items].sort(
      (a, b) => this.relevanceScore(a.title, q) - this.relevanceScore(b.title, q),
    );
  }

  private relevanceScore(title: string, query: string): number {
    const t = title.toLowerCase();
    if (t === query) return 0;
    if (t.startsWith(query)) return 1;
    return 2;
  }

  private mapProject(p: ProjectResponseDto): GlobalSearchItemDto {
    return {
      id: p.id,
      module: 'projects',
      title: p.nom,
      subtitle: p.code,
      status: p.statut,
      url: `/api/v1/projects/${p.id}`,
      projectId: p.id,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  private mapPtba(p: PtbaResponseDto): GlobalSearchItemDto {
    return {
      id: p.id,
      module: 'ptba',
      title: p.libelle,
      subtitle: p.code,
      status: p.statut,
      url: `/api/v1/ptba/${p.id}`,
      projectId: p.projectId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  private mapBudgetVersion(v: BudgetVersionResponseDto): GlobalSearchItemDto {
    return {
      id: v.id,
      module: 'budget',
      title: v.nom,
      subtitle: `v${v.version}`,
      status: v.statut,
      url: `/api/v1/budget-versions/${v.id}`,
      projectId: v.projectId,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    };
  }

  private mapBudgetLine(l: BudgetLineResponseDto): GlobalSearchItemDto {
    return {
      id: l.id,
      module: 'budget',
      title: l.libelle,
      subtitle: l.codeLigne,
      status: null,
      url: `/api/v1/budget-lines/${l.id}`,
      projectId: null,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    };
  }

  private mapRisque(r: RisqueResponseDto): GlobalSearchItemDto {
    return {
      id: r.id,
      module: 'risques',
      title: r.description,
      subtitle: r.code ?? r.niveauCriticite,
      status: r.statut,
      url: `/api/v1/risques/${r.id}`,
      projectId: r.projectId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  private mapPpm(m: PpmResponseDto): GlobalSearchItemDto {
    return {
      id: m.id,
      module: 'ppm',
      title: m.intitule,
      subtitle: m.code,
      status: m.statut,
      url: `/api/v1/ppm/${m.id}`,
      projectId: m.projectId,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  }

  private mapLivrable(l: LivrableResponseDto): GlobalSearchItemDto {
    return {
      id: l.id,
      module: 'livrables',
      title: l.nom,
      subtitle: l.code,
      status: l.statut,
      url: `/api/v1/livrables/${l.id}`,
      projectId: l.projectId,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    };
  }

  private mapDocument(d: DocumentResponseDto): GlobalSearchItemDto {
    return {
      id: d.id,
      module: 'documents',
      title: d.titre,
      subtitle: d.description ?? null,
      status: d.statut,
      url: `/api/v1/documents/${d.id}`,
      projectId: d.projectId,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }

  private mapReport(r: ReportResponseDto): GlobalSearchItemDto {
    return {
      id: r.id,
      module: 'reports',
      title: r.titre,
      subtitle: r.codeRapport,
      status: r.statut,
      url: `/api/v1/reports/${r.id}`,
      projectId: r.projectId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  private mapNotification(n: NotificationResponseDto): GlobalSearchItemDto {
    const msg = n.message.length > 100 ? `${n.message.substring(0, 100)}...` : n.message;
    return {
      id: n.id,
      module: 'notifications',
      title: n.titre,
      subtitle: msg,
      status: n.lue ? 'LUE' : 'NON_LUE',
      url: `/api/v1/notifications/${n.id}`,
      projectId: n.projectId ?? null,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    };
  }
}
