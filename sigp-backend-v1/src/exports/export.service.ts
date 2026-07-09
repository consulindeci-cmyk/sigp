import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectService } from '@/projects/project.service';
import { PtbaService } from '@/ptba/ptba.service';
import { BudgetVersionService } from '@/budget-versions/budget-version.service';
import { BudgetLineService } from '@/budget-lines/budget-line.service';
import { JournalOperationService } from '@/journal-operations/journal-operation.service';
import { FundingSourceService } from '@/funding-sources/funding-source.service';
import { DisbursementService } from '@/disbursements/disbursement.service';
import { ContractService } from '@/contracts/contract.service';
import { PpmService } from '@/ppm/ppm.service';
import { PpmEtapeService } from '@/ppm-etapes/ppm-etape.service';
import { RisqueService } from '@/risques/risque.service';
import { LivrableService } from '@/livrables/livrable.service';
import { DocumentService } from '@/documents/document.service';
import { ReportService } from '@/reports/report.service';
import { NotificationService } from '@/notifications/notification.service';
import { ProjectQueryDto } from '@/projects/dto/project-query.dto';
import { PtbaQueryDto } from '@/ptba/dto/ptba-query.dto';
import { BudgetVersionQueryDto } from '@/budget-versions/dto/budget-version-query.dto';
import { BudgetLineQueryDto } from '@/budget-lines/dto/budget-line-query.dto';
import { JournalOperationQueryDto } from '@/journal-operations/dto/journal-operation-query.dto';
import { FundingSourceQueryDto } from '@/funding-sources/dto/funding-source-query.dto';
import { DisbursementQueryDto } from '@/disbursements/dto/disbursement-query.dto';
import { ContractQueryDto } from '@/contracts/dto/contract-query.dto';
import { PpmQueryDto } from '@/ppm/dto/ppm-query.dto';
import { PpmEtapeQueryDto } from '@/ppm-etapes/dto/ppm-etape-query.dto';
import { RisqueQueryDto } from '@/risques/dto/risque-query.dto';
import { LivrableQueryDto } from '@/livrables/dto/livrable-query.dto';
import { DocumentQueryDto } from '@/documents/dto/document-query.dto';
import { ReportQueryDto } from '@/reports/dto/report-query.dto';
import { NotificationQueryDto } from '@/notifications/dto/notification-query.dto';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ExportQueryDto, ExportFormat, ExportResource } from './dto/export-query.dto';
import { ExportResponseDto } from './dto/export-response.dto';

const BYTES_PER_RECORD: Record<ExportFormat, number> = {
  [ExportFormat.CSV]: 512,
  [ExportFormat.EXCEL]: 1024,
  [ExportFormat.PDF]: 2048,
};

@Injectable()
export class ExportService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly projectService: ProjectService,
    private readonly ptbaService: PtbaService,
    private readonly budgetVersionService: BudgetVersionService,
    private readonly budgetLineService: BudgetLineService,
    private readonly journalService: JournalOperationService,
    private readonly fundingSourceService: FundingSourceService,
    private readonly disbursementService: DisbursementService,
    private readonly contractService: ContractService,
    private readonly ppmService: PpmService,
    private readonly ppmEtapeService: PpmEtapeService,
    private readonly risqueService: RisqueService,
    private readonly livrableService: LivrableService,
    private readonly documentService: DocumentService,
    private readonly reportService: ReportService,
    private readonly notificationService: NotificationService,
  ) {}

  async export(query: ExportQueryDto): Promise<ExportResponseDto> {
    return this.buildExport(query);
  }

  async download(query: ExportQueryDto): Promise<ExportResponseDto> {
    return this.buildExport(query);
  }

  private async buildExport(query: ExportQueryDto): Promise<ExportResponseDto> {
    const { resource, format, projectId, search } = query;

    const records = await this.fetchCount(resource, { projectId, search });
    const generatedAt = new Date();
    const dateStr = generatedAt.toISOString().split('T')[0];
    const ext = this.formatExtension(format);
    const filename = `sigp-${resource}-${dateStr}.${ext}`;
    const estimatedSizeKb = Math.max(1, Math.ceil((records * BYTES_PER_RECORD[format]) / 1024));
    const downloadUrl = `/api/v1/exports/download?resource=${resource}&format=${format}`;

    setImmediate(() => {
      this.eventEmitter.emit(AppEvent.EXPORT_GENERATED, {
        resource,
        format,
        records,
        filename,
        generatedAt,
      });
    });

    return { filename, format, resource, records, estimatedSizeKb, generatedAt, downloadUrl };
  }

  private async fetchCount(
    resource: ExportResource,
    filters: { projectId?: string; search?: string },
  ): Promise<number> {
    const base = { page: 1, limit: 1 };
    const s = filters.search ? { search: filters.search } : {};
    const pid = filters.projectId ? { projectId: filters.projectId } : {};

    switch (resource) {
      case ExportResource.PROJECTS:
        return (await this.projectService.findAll({ ...base, ...s } as ProjectQueryDto)).meta.total;

      case ExportResource.PTBA:
        return (await this.ptbaService.findAll({ ...base, ...s, ...pid } as PtbaQueryDto)).meta
          .total;

      case ExportResource.BUDGET_VERSIONS:
        return (
          await this.budgetVersionService.findAll({
            ...base,
            ...s,
            ...pid,
          } as BudgetVersionQueryDto)
        ).meta.total;

      case ExportResource.BUDGET_LINES:
        return (await this.budgetLineService.findAll({ ...base, ...s } as BudgetLineQueryDto)).meta
          .total;

      case ExportResource.JOURNAL:
        return (await this.journalService.findAll({ ...base, ...s } as JournalOperationQueryDto))
          .meta.total;

      case ExportResource.FUNDING_SOURCES:
        return (
          await this.fundingSourceService.findAll({
            ...base,
            ...s,
            ...pid,
          } as FundingSourceQueryDto)
        ).meta.total;

      case ExportResource.DISBURSEMENTS:
        return (await this.disbursementService.findAll({ ...base, ...s } as DisbursementQueryDto))
          .meta.total;

      case ExportResource.CONTRACTS:
        return (await this.contractService.findAll({ ...base, ...s, ...pid } as ContractQueryDto))
          .meta.total;

      case ExportResource.PPM:
        return (await this.ppmService.findAll({ ...base, ...s, ...pid } as PpmQueryDto)).meta.total;

      case ExportResource.PPM_ETAPES:
        return (await this.ppmEtapeService.findAll({ ...base, ...s } as PpmEtapeQueryDto)).meta
          .total;

      case ExportResource.RISQUES:
        return (await this.risqueService.findAll({ ...base, ...s, ...pid } as RisqueQueryDto)).meta
          .total;

      case ExportResource.LIVRABLES:
        return (await this.livrableService.findAll({ ...base, ...s, ...pid } as LivrableQueryDto))
          .meta.total;

      case ExportResource.DOCUMENTS:
        return (await this.documentService.findAll({ ...base, ...s, ...pid } as DocumentQueryDto))
          .meta.total;

      case ExportResource.REPORTS:
        return (await this.reportService.findAll({ ...base, ...s, ...pid } as ReportQueryDto)).meta
          .total;

      case ExportResource.NOTIFICATIONS:
        return (
          await this.notificationService.findAll({
            ...base,
            ...s,
            ...pid,
          } as unknown as NotificationQueryDto)
        ).meta.total;

      default:
        return 0;
    }
  }

  private formatExtension(format: ExportFormat): string {
    switch (format) {
      case ExportFormat.PDF:
        return 'pdf';
      case ExportFormat.EXCEL:
        return 'xlsx';
      case ExportFormat.CSV:
        return 'csv';
    }
  }
}
