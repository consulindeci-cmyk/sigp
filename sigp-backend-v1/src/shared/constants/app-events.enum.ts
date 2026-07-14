// AppEvent — EventEmitter2 cross-module events
// Convention de nommage : DOMAINE.ACTION (wildcard compatible)
export enum AppEvent {
  // Projects
  PROJECT_CREATED = 'project.created',
  PROJECT_UPDATED = 'project.updated',
  PROJECT_DELETED = 'project.deleted',
  PROJECT_STATUS_CHANGED = 'project.status.changed',
  PROJECT_MEMBER_ADDED = 'project.member.added',
  PROJECT_MEMBER_UPDATED = 'project.member.updated',
  PROJECT_MEMBER_REMOVED = 'project.member.removed',
  GOUVERNANCE_CREATED = 'gouvernance.created',
  GOUVERNANCE_UPDATED = 'gouvernance.updated',
  GOUVERNANCE_DELETED = 'gouvernance.deleted',
  LOGFRAME_OBJECTIVE_CREATED = 'logframe-objective.created',
  LOGFRAME_OBJECTIVE_UPDATED = 'logframe-objective.updated',
  LOGFRAME_OBJECTIVE_DELETED = 'logframe-objective.deleted',
  LOGFRAME_INDICATOR_CREATED = 'logframe-indicator.created',
  LOGFRAME_INDICATOR_UPDATED = 'logframe-indicator.updated',
  LOGFRAME_INDICATOR_DELETED = 'logframe-indicator.deleted',
  WBS_NODE_CREATED = 'wbs-node.created',
  WBS_NODE_UPDATED = 'wbs-node.updated',
  WBS_NODE_DELETED = 'wbs-node.deleted',
  PTBA_CREATED = 'ptba.created',
  PTBA_UPDATED = 'ptba.updated',
  PTBA_DELETED = 'ptba.deleted',

  // Budget Versions
  BUDGET_VERSION_CREATED = 'budget-version.created',
  BUDGET_VERSION_UPDATED = 'budget-version.updated',
  BUDGET_VERSION_DELETED = 'budget-version.deleted',

  // Budget Lines
  BUDGET_LINE_CREATED = 'budget-line.created',
  BUDGET_LINE_UPDATED = 'budget-line.updated',
  BUDGET_LINE_DELETED = 'budget-line.deleted',

  // Journal Opérations
  JOURNAL_OPERATION_CREATED = 'journal-operation.created',
  JOURNAL_OPERATION_UPDATED = 'journal-operation.updated',
  JOURNAL_OPERATION_DELETED = 'journal-operation.deleted',

  // Funding Sources
  FUNDING_SOURCE_CREATED = 'funding-source.created',
  FUNDING_SOURCE_UPDATED = 'funding-source.updated',
  FUNDING_SOURCE_DELETED = 'funding-source.deleted',

  // Disbursements
  DISBURSEMENT_CREATED = 'disbursement.created',
  DISBURSEMENT_UPDATED = 'disbursement.updated',
  DISBURSEMENT_DELETED = 'disbursement.deleted',

  // Contracts
  CONTRACT_CREATED = 'contract.created',
  CONTRACT_UPDATED = 'contract.updated',
  CONTRACT_DELETED = 'contract.deleted',

  // PPM
  PPM_CREATED = 'ppm.created',
  PPM_UPDATED = 'ppm.updated',
  PPM_DELETED = 'ppm.deleted',
  PPM_ETAPE_CREATED = 'ppm-etape.created',
  PPM_ETAPE_UPDATED = 'ppm-etape.updated',
  PPM_ETAPE_DELETED = 'ppm-etape.deleted',

  // Budget
  BUDGET_VALIDATED = 'budget.validated',
  BUDGET_VERSION_CHANGED = 'budget.version.changed',
  BUDGET_DEPASSE = 'budget.depasse',

  // Risks
  RISK_CREATED = 'risk.created',
  RISK_CRITICAL_DETECTED = 'risk.critical.detected',
  RISK_STATUS_CHANGED = 'risk.status.changed',
  RISQUE_CREATED = 'risque.created',
  RISQUE_UPDATED = 'risque.updated',
  RISQUE_DELETED = 'risque.deleted',

  // Livrables
  LIVRABLE_OVERDUE = 'livrable.overdue',
  LIVRABLE_SUBMITTED = 'livrable.submitted',
  LIVRABLE_STATUS_CHANGED = 'livrable.status.changed',
  LIVRABLE_CREATED = 'livrable.created',
  LIVRABLE_UPDATED = 'livrable.updated',
  LIVRABLE_DELETED = 'livrable.deleted',

  // EVM
  EVM_SNAPSHOT_CREATED = 'evm.snapshot.created',
  EVM_CPI_ALERT = 'evm.cpi.alert',
  EVM_SPI_ALERT = 'evm.spi.alert',

  // Documents
  DOCUMENT_VALIDATED = 'document.validated',
  DOCUMENT_REJECTED = 'document.rejected',
  DOCUMENT_CREATED = 'document.created',
  DOCUMENT_UPDATED = 'document.updated',
  DOCUMENT_DELETED = 'document.deleted',
  DOCUMENT_UPLOADED = 'document.uploaded',
  DOCUMENT_DOWNLOADED = 'document.downloaded',
  DOCUMENT_VERSION_ADDED = 'document.version.added',

  // Documents Globaux
  DOCUMENT_GLOBAL_CREATED = 'document-global.created',
  DOCUMENT_GLOBAL_UPDATED = 'document-global.updated',
  DOCUMENT_GLOBAL_DELETED = 'document-global.deleted',
  DOCUMENT_GLOBAL_UPLOADED = 'document-global.uploaded',
  DOCUMENT_GLOBAL_DOWNLOADED = 'document-global.downloaded',
  DOCUMENT_GLOBAL_VERSION_ADDED = 'document-global.version.added',

  // Reports
  REPORT_COMPLETED = 'report.completed',
  REPORT_FAILED = 'report.failed',
  REPORT_CREATED = 'report.created',
  REPORT_UPDATED = 'report.updated',
  REPORT_DELETED = 'report.deleted',

  // Notifications
  NOTIFICATION_CREATED = 'notification.created',
  NOTIFICATION_UPDATED = 'notification.updated',
  NOTIFICATION_DELETED = 'notification.deleted',

  // Comments
  COMMENT_CREATED = 'comment.created',
  COMMENT_UPDATED = 'comment.updated',
  COMMENT_DELETED = 'comment.deleted',
  COMMENT_MENTION = 'comment.mention',

  // Users / Auth
  USER_LOGGED_IN = 'user.logged.in',
  USER_LOGGED_OUT = 'user.logged.out',
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_DISABLED = 'user.disabled',
  AUTH_REFRESH_SUCCESS = 'auth.refresh.success',
  AUTH_REFRESH_REUSED = 'auth.refresh.reused',
  AUTH_TOKEN_FAMILY_REVOKED = 'auth.token.family.revoked',
  AUTH_LOGOUT_SUCCESS = 'auth.logout.success',
  AUTH_REFRESH_REVOKED = 'auth.refresh.revoked',
  AUTH_JWT_BLACKLISTED = 'auth.jwt.blacklisted',

  // Gouvernance — Organisations
  ORGANISATION_CREATED = 'organisation.created',
  ORGANISATION_UPDATED = 'organisation.updated',
  ORGANISATION_DELETED = 'organisation.deleted',

  // Gouvernance — Directions
  DIRECTION_CREATED = 'direction.created',
  DIRECTION_UPDATED = 'direction.updated',
  DIRECTION_DELETED = 'direction.deleted',

  // Gouvernance — Départements
  DEPARTEMENT_CREATED = 'departement.created',
  DEPARTEMENT_UPDATED = 'departement.updated',
  DEPARTEMENT_DELETED = 'departement.deleted',

  // Gouvernance — Unités
  UNITE_CREATED = 'unite.created',
  UNITE_UPDATED = 'unite.updated',
  UNITE_DELETED = 'unite.deleted',

  // Gouvernance — Programmes
  PROGRAMME_CREATED = 'programme.created',
  PROGRAMME_UPDATED = 'programme.updated',
  PROGRAMME_DELETED = 'programme.deleted',

  // Dashboard invalidation
  DASHBOARD_INVALIDATE = 'dashboard.invalidate',

  // Exports
  EXPORT_GENERATED = 'export.generated',
}
