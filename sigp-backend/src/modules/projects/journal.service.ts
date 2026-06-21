import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JournalService {
  constructor(private readonly prisma: PrismaService) {}

  async getProjectJournal(projectId: string) {
    const projet = await this.prisma.projet.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    
    if (!projet) {
      throw new NotFoundException('Projet introuvable');
    }

    // Récupérer toutes les opérations immuables du Ledger
    const journalOps = await this.prisma.journalOperation.findMany({
      where: { projet_id: projectId },
      orderBy: { numero_sequence: 'desc' },
    });

    let prevuTotal = 0;
    let engageTotal = 0;
    let decaisseTotal = 0;

    const operations = journalOps.map((op) => {
      const engage = Number(op.montant_engage?.toString() || 0);
      const decaisse = Number(op.montant_decaisse?.toString() || 0);
      // "Prévu" n'a plus forcément de sens brut ici, sauf si on récupère le budget via snapshot, 
      // ou on l'assimile à l'engagement maximal si c'est un engagement budgétaire.
      // Pour le moment on va juste reporter engage et decaisse.
      // L'écart = engage - decaisse.
      const ecart = engage - decaisse;

      engageTotal += engage;
      decaisseTotal += decaisse;
      
      // On peut enrichir la vue avec le snapshot JSON
      const snapshot = op.entite_snapshot ? JSON.parse(op.entite_snapshot as string) : {};

      return {
        id: op.id,
        id_journal: op.code_operation,
        date: op.date_operation.toISOString(),
        wbs: snapshot?.code_wbs || '—',
        description: op.description,
        ligne_budgetaire: snapshot?.rubrique || op.entite_type,
        statut: op.type_evenement,
        prevu: engage, // Simplification pour la vue
        engage,
        decaisse,
        ecart,
        hash: op.hash_signature,
        entite_type: op.entite_type,
        entite_id: op.entite_id,
      };
    });

    return {
      kpis: {
        operationsCount: operations.length,
        prevuTotal: engageTotal, // Dans un vrai SIGP, le "Prévu" global viendrait du budget, pas du Ledger, le ledger trace le consommé/engagé
        engageTotal,
        decaisseTotal,
      },
      operations,
    };
  }
}
