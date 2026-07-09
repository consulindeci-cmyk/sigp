import { Prisma } from '@prisma/client';

// Prisma 6: $use middleware removed — replaced by Client Extensions.
// This extension adds deleted_at: null filter on all reads for soft-delete models.
// Delete operations are intercepted and converted to soft-deletes (update deleted_at).

const SOFT_DELETE_MODELS = new Set([
  'User',
  'Organisation',
  'Direction',
  'Departement',
  'Unite',
  'Programme',
  'Project',
  'ProjectMember',
  'Gouvernance',
  'LogframeObjective',
  'LogframeIndicator',
  'WbsNode',
  'BudgetVersion',
  'BudgetLigne',
  'JournalOperation',
  'FundingSource',
  'PpmMarche',
  'Contract',
  'Disbursement',
  'PtbaActivite',
  'Risque',
  'Livrable',
  'DocumentProjet',
  'RapportProjet',
  'DocumentGlobal',
  'Notification',
  'Comment',
]);

function addDeletedAtNull(where: unknown): unknown {
  return { ...((where as object) ?? {}), deleted_at: null };
}

export const softDeleteExtension = Prisma.defineExtension({
  name: 'soft-delete',
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        if (SOFT_DELETE_MODELS.has(model)) {
          (args as Record<string, unknown>).where = addDeletedAtNull(
            (args as Record<string, unknown>).where,
          );
        }
        return query(args);
      },
      async findFirst({ model, args, query }) {
        if (SOFT_DELETE_MODELS.has(model)) {
          (args as Record<string, unknown>).where = addDeletedAtNull(
            (args as Record<string, unknown>).where,
          );
        }
        return query(args);
      },
      async count({ model, args, query }) {
        if (SOFT_DELETE_MODELS.has(model)) {
          (args as Record<string, unknown>).where = addDeletedAtNull(
            (args as Record<string, unknown>).where,
          );
        }
        return query(args);
      },
      // findUnique cannot add deleted_at to where (not a unique field), so we
      // fetch the record normally then return null if it is soft-deleted.
      async findUnique({ model, args, query }) {
        if (!SOFT_DELETE_MODELS.has(model)) return query(args);
        const enrichedArgs = { ...args } as Record<string, unknown>;
        // When a select is used, ensure deleted_at is always fetched so we can check it.
        if (enrichedArgs['select']) {
          enrichedArgs['select'] = {
            ...(enrichedArgs['select'] as Record<string, unknown>),
            deleted_at: true,
          };
        }
        const result = await query(enrichedArgs as typeof args);
        if (!result) return null;
        const deletedAt = (result as Record<string, unknown>)['deleted_at'];
        if (deletedAt !== null && deletedAt !== undefined) return null;
        return result;
      },
    },
  },
});
