import type { Contract, ContractStatus } from '@/types/contract';

const statuses: ContractStatus[] = ['BROUILLON', 'SIGNE', 'EN_EXECUTION', 'SUSPENDU', 'TERMINE', 'CLOTURE', 'RESILIE'];
const fournisseurs = ['SOGEA SATOM', 'EIFFAGE', 'BOUYGUES', 'RAZEL', 'CGC', 'SINOHYDRO', 'Local Entreprise SARL'];
const bailleurs = ['Banque Mondiale', 'BAD', 'AFD', 'Union Européenne', 'État', 'BOAD'];

export function generateMockContracts(count: number): Contract[] {
  return Array.from({ length: count }).map((_, index) => {
    const isEuro = Math.random() > 0.7;
    const currency = isEuro ? 'EUR' : (Math.random() > 0.5 ? 'USD' : 'XOF');
    const montant = Math.floor(Math.random() * 1000000000) + 5000000;
    const taux_change_contractuel = currency === 'XOF' ? 1 : (currency === 'EUR' ? 655.957 : 600);
    const baseMontant = montant * taux_change_contractuel;
    const dateSign = new Date(Date.now() - Math.floor(Math.random() * 10000000000));
    
    return {
      id: `contract-mock-${index}`,
      projet_id: '1',
      reference: `MAR-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}`,
      intitule: `Travaux de construction du lot ${index + 1} - Infrastructure routière et aménagement urbain pour le développement de la zone nord`,
      statut: statuses[Math.floor(Math.random() * statuses.length)],
      fournisseur_id: fournisseurs[Math.floor(Math.random() * fournisseurs.length)],
      bailleur_id: bailleurs[Math.floor(Math.random() * bailleurs.length)],
      
      // Imputations (1 chance sur 3 d'être vide)
      wbs_id: Math.random() > 0.3 ? `WBS-1.0.${Math.floor(Math.random() * 5)}` : '',
      budget_ligne_id: Math.random() > 0.3 ? `BDG-2026-${Math.floor(Math.random() * 99)}` : '',
      ppm_ligne_id: Math.random() > 0.3 ? `PPM-${Math.floor(Math.random() * 200)}` : '',
      
      // Finances
      montant_initial_devise: montant,
      devise_code: currency,
      taux_change_contractuel,
      montant_initial_base: baseMontant,
      
      // Dates
      date_signature: dateSign.toISOString(),
      date_ordre_service: new Date(dateSign.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      fin_prevue: new Date(dateSign.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version_hash: 'v1',
    };
  });
}
