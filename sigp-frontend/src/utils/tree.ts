import type { WBS, CadreLogique } from '@/types';

/**
 * Aplatit un arbre WBS en respectant l'ordre de tri.
 */
export const flattenWBSTree = (nodes: WBS[], allNodes: WBS[]): WBS[] => {
  let result: WBS[] = [];
  nodes.forEach(node => {
    result.push(node);
    const children = allNodes.filter(n => n.parent_id === node.id).sort((a, b) => a.ordre - b.ordre);
    if (children.length > 0) {
      result = result.concat(flattenWBSTree(children, allNodes));
    }
  });
  return result;
};

const NIVEAUX_HIERARCHIE = ['IMPACT', 'OBJECTIF', 'RESULTAT', 'PRODUIT', 'ACTIVITE'];

/**
 * Aplatit un arbre Cadre Logique en injectant le niveau d'indentation.
 */
export const flattenLogframeHierarchy = (
  nodes: CadreLogique[], 
  allNodes: CadreLogique[], 
  level: number = 0
): (CadreLogique & { level: number })[] => {
  let result: (CadreLogique & { level: number })[] = [];
  nodes.forEach(node => {
    result.push({ ...node, level });
    const children = allNodes.filter(n => n.parent_id === node.id);
    if (children.length > 0) {
      const sortedChildren = children.sort((a, b) => 
        NIVEAUX_HIERARCHIE.indexOf(a.niveau_intervention) - NIVEAUX_HIERARCHIE.indexOf(b.niveau_intervention)
      );
      result = result.concat(flattenLogframeHierarchy(sortedChildren, allNodes, level + 1));
    }
  });
  return result;
};
