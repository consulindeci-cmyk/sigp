import React, { useState } from 'react';
import { Button } from '../components/ui/forms/Button';
import { Input } from '../components/ui/forms/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/data-display/Card';
import { Badge } from '../components/ui/data-display/Badge';
import { Modal, ModalTrigger, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter, ModalClose } from '../components/ui/overlays/Modal';
import { DataTable } from '../components/ui/data-display/DataTable';
import { Search } from 'lucide-react';

export default function UICatalogPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tableColumns = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Nom' },
    { accessorKey: 'status', header: 'Statut', cell: (info: any) => <Badge variant={info.getValue() === 'Actif' ? 'success' : 'warning'}>{info.getValue()}</Badge> },
  ];
  
  const tableData = [
    { id: '1', name: 'Projet Alpha', status: 'Actif' },
    { id: '2', name: 'Projet Beta', status: 'En pause' },
    { id: '3', name: 'Projet Gamma', status: 'Actif' },
  ];

  return (
    <div className="p-8 space-y-12 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-semibold text-navy-900 mb-2">Catalogue UI Enterprise</h1>
        <p className="text-slate">Composants de la Phase 2A & 2B - Agnostiques, Accessibles, et Typés.</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4 border-b border-line pb-2">1. Boutons (Variantes & Tailles)</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="default">Default (Navy)</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button isLoading>Loading</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 border-b border-line pb-2">2. Inputs & Forms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <Input placeholder="Input classique..." />
          <Input placeholder="Avec icône (ex: Recherche)" leftIcon={<Search className="w-4 h-4" />} />
          <Input placeholder="En erreur..." error="Ce champ est requis." />
          <Input placeholder="Désactivé" disabled />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 border-b border-line pb-2">3. Badges</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 border-b border-line pb-2">4. Cards</h2>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Rapport Mensuel</CardTitle>
            <CardDescription>Consultez les statistiques du projet sélectionné.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-20 bg-canvas rounded flex items-center justify-center text-slate text-sm">
              [Contenu du graphique]
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline">Annuler</Button>
            <Button>Générer</Button>
          </CardFooter>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 border-b border-line pb-2">5. Modales (Radix UI)</h2>
        <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
          <ModalTrigger asChild>
            <Button>Ouvrir la Modale</Button>
          </ModalTrigger>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Action Critique</ModalTitle>
              <ModalDescription>
                Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.
              </ModalDescription>
            </ModalHeader>
            <ModalFooter className="mt-4">
              <ModalClose asChild>
                <Button variant="outline">Annuler</Button>
              </ModalClose>
              <Button variant="danger">Supprimer</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 border-b border-line pb-2">6. DataTable (TanStack Table)</h2>
        <div className="max-w-3xl">
          <DataTable columns={tableColumns} data={tableData} />
        </div>
      </section>
    </div>
  );
}
