// ─────────────────────────────────────────────────────────────────────────────
// PILOTE — page de test isolée, HORS ProtectedRoute / authStore NestJS.
// Objectif unique : valider Supabase Auth + RLS + Edge Functions sur le
// module Projets avec un compte de test dédié, sans toucher à l'app existante.
// Route : /pilot-supabase (à retirer une fois la validation terminée ou la
// bascule générale décidée).
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  useProjectsSupabase,
  useCreateProjectSupabase,
  useDeleteProjectSupabase,
} from '@/hooks/useProjectsSupabase';
import {
  useRisquesSupabase,
  useCreateRisqueSupabase,
  useDeleteRisqueSupabase,
} from '@/hooks/useRisksSupabase';
import {
  useWbsNodesSupabase,
  useCreateWbsNodeSupabase,
  useDeleteWbsNodeSupabase,
} from '@/hooks/useWbsSupabase';
import {
  useContractsSupabase,
  useCreateContractSupabase,
  useDeleteContractSupabase,
} from '@/hooks/useContractsSupabase';
import {
  useDocumentsSupabase,
  useCreateDocumentSupabase,
  useDeleteDocumentSupabase,
  useDocumentVersionsSupabase,
  useUploadDocumentVersionSupabase,
  useDownloadDocumentVersionSupabase,
} from '@/hooks/useDocumentsSupabase';
import {
  useLivrablesSupabase,
  useCreateLivrableSupabase,
  useDeleteLivrableSupabase,
} from '@/hooks/useLivrablesSupabase';
import {
  useBudgetVersionsSupabase,
  useCreateBudgetVersionSupabase,
  useDeleteBudgetVersionSupabase,
} from '@/hooks/useBudgetVersionsSupabase';
import {
  useBudgetLinesSupabase,
  useCreateBudgetLineSupabase,
  useDeleteBudgetLineSupabase,
} from '@/hooks/useBudgetLinesSupabase';
import {
  useFundingSourcesSupabase,
  useCreateFundingSourceSupabase,
  useDeleteFundingSourceSupabase,
} from '@/hooks/useFundingSourcesSupabase';
import {
  useDisbursementsSupabase,
  useCreateDisbursementSupabase,
  useDeleteDisbursementSupabase,
} from '@/hooks/useDisbursementsSupabase';
import {
  useJournalOperationsSupabase,
  useCreateJournalOperationSupabase,
  useDeleteJournalOperationSupabase,
} from '@/hooks/useJournalOperationsSupabase';
import {
  useNotificationsSupabase,
  useCreateNotificationSupabase,
  useMarkNotificationReadSupabase,
  useDeleteNotificationSupabase,
} from '@/hooks/useNotificationsSupabase';
import {
  usePpmMarchesSupabase,
  useCreatePpmMarcheSupabase,
  useDeletePpmMarcheSupabase,
} from '@/hooks/usePpmSupabase';
import {
  usePpmEtapesSupabase,
  useCreatePpmEtapeSupabase,
  useDeletePpmEtapeSupabase,
} from '@/hooks/usePpmEtapesSupabase';
import {
  usePtbaActivitesSupabase,
  useCreatePtbaActiviteSupabase,
  useDeletePtbaActiviteSupabase,
} from '@/hooks/usePtbaSupabase';
import {
  useLogframeObjectivesSupabase,
  useCreateLogframeObjectiveSupabase,
  useDeleteLogframeObjectiveSupabase,
  useLogframeIndicatorsSupabase,
  useCreateLogframeIndicatorSupabase,
  useDeleteLogframeIndicatorSupabase,
  type LogframeLevelSupabase,
  type IndicatorTypeSupabase,
} from '@/hooks/useLogframeSupabase';
import {
  useUsersSupabase,
  useCreateUserSupabase,
  useDeleteUserSupabase,
  type UserRoleSupabase,
} from '@/hooks/useUsersSupabase';
import { useDashboardSupabase } from '@/hooks/useDashboardSupabase';

export default function PilotSupabaseProjectsPage() {
  const [session, setSession] = useState<null | { email: string }>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) setSession({ email: data.session.user.email });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s?.user?.email ? { email: s.user.email } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (!session) {
    return (
      <div style={{ maxWidth: 360, margin: '4rem auto', fontFamily: 'system-ui' }}>
        <h1>Pilote Supabase — Connexion test</h1>
        <p style={{ fontSize: 13, color: '#666' }}>
          Utilisez le compte de test créé dans Supabase Auth (pas un compte réel).
        </p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            placeholder="mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Se connecter</button>
          {authError && <p style={{ color: 'red' }}>{authError}</p>}
        </form>
      </div>
    );
  }

  return <PilotProjectsList email={session.email} onLogout={handleLogout} />;
}

function PilotProjectsList({ email, onLogout }: { email: string; onLogout: () => void }) {
  const { data: projects, isLoading, isError, error } = useProjectsSupabase();
  const createProject = useCreateProjectSupabase();
  const deleteProject = useDeleteProjectSupabase();
  const [programmeId, setProgrammeId] = useState('');
  const [code, setCode] = useState('');
  const [nom, setNom] = useState('');

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Pilote Supabase — Projets ({email})</h1>
        <button onClick={onLogout}>Déconnexion</button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createProject.mutate({ code, nom, programmeId });
        }}
        style={{ display: 'flex', gap: 8, margin: '1rem 0' }}
      >
        <input placeholder="code (ex: PROJ-TEST)" value={code} onChange={(e) => setCode(e.target.value)} />
        <input placeholder="nom" value={nom} onChange={(e) => setNom(e.target.value)} />
        <input placeholder="programmeId (uuid)" value={programmeId} onChange={(e) => setProgrammeId(e.target.value)} />
        <button type="submit" disabled={createProject.isPending}>Créer</button>
      </form>
      {createProject.isError && <p style={{ color: 'red' }}>{(createProject.error as Error).message}</p>}

      {isLoading && <p>Chargement…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}

      <ul>
        {projects?.map((p) => (
          <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>{p.code} — {p.nom} ({p.statut})</span>
            <button onClick={() => deleteProject.mutate(p.id)} disabled={deleteProject.isPending}>
              Supprimer
            </button>
          </li>
        ))}
      </ul>

      <PilotRisquesList />
      <PilotWbsList />
      <PilotContractsList />
      <PilotDocumentsList />
      <PilotBudgetVersionsList />
    </div>
  );
}

function PilotBudgetVersionsList() {
  const { data: versions, isLoading, isError, error } = useBudgetVersionsSupabase();
  const createVersion = useCreateBudgetVersionSupabase();
  const deleteVersion = useDeleteBudgetVersionSupabase();
  const [projectId, setProjectId] = useState('fe420645-8f49-4ff3-87d4-645a2db2c0aa'); // PROJ-TEST
  const [version, setVersion] = useState('1');
  const [nom, setNom] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h2>Budget — Versions</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createVersion.mutate({ projectId, version: Number(version), nom });
        }}
        style={{ display: 'flex', gap: 8, margin: '1rem 0', flexWrap: 'wrap' }}
      >
        <input placeholder="projectId (uuid)" value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ width: 280 }} />
        <input placeholder="version (n°)" type="number" value={version} onChange={(e) => setVersion(e.target.value)} required style={{ width: 100 }} />
        <input placeholder="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
        <button type="submit" disabled={createVersion.isPending}>Créer la version</button>
      </form>
      {createVersion.isError && <p style={{ color: 'red' }}>{(createVersion.error as Error).message}</p>}

      {isLoading && <p>Chargement…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}

      <ul>
        {versions?.map((v) => (
          <li key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>
              <button onClick={() => setSelectedVersionId(v.id === selectedVersionId ? null : v.id)} style={{ marginRight: 8 }}>
                {v.id === selectedVersionId ? '▼' : '▶'}
              </button>
              v{v.version} — {v.nom} ({v.statut}) — {v.montant_total} FCFA
            </span>
            <button onClick={() => deleteVersion.mutate(v.id)} disabled={deleteVersion.isPending}>
              Supprimer (ADMIN requis → doit échouer)
            </button>
          </li>
        ))}
      </ul>

      {selectedVersionId && <PilotBudgetLinesList versionId={selectedVersionId} />}
      <PilotFundingSourcesList />
      <PilotDisbursementsList />
      <PilotJournalOperationsList />
      <PilotNotificationsList />
      <PilotPpmList />
      <PilotPtbaList />
      <PilotLogframeObjectivesList />
      <PilotUsersList />
      <PilotDashboardSummary />
    </div>
  );
}

function PilotDashboardSummary() {
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboardSupabase()

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h2>Dashboard — Agrégation (dashboard-summary)</h2>
      <button onClick={() => refetch()} disabled={isFetching}>Rafraîchir</button>
      {isLoading && <p>Chargement…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}
      {data && (
        <pre style={{ maxHeight: 400, overflow: 'auto', background: '#f7f7f7', padding: '0.75rem', fontSize: 12 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function PilotUsersList() {
  const { data: users, isLoading, isError, error } = useUsersSupabase();
  const createUser = useCreateUserSupabase();
  const deleteUser = useDeleteUserSupabase();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRoleSupabase>('VIEWER');

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h2>Users/RBAC</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createUser.mutate({ nom, prenom, email, password, role });
        }}
        style={{ display: 'flex', gap: 8, margin: '1rem 0', flexWrap: 'wrap' }}
      >
        <input placeholder="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
        <input placeholder="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: 220 }} />
        <input placeholder="mot de passe (Str0ng@Pass)" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: 200 }} />
        <select value={role} onChange={(e) => setRole(e.target.value as UserRoleSupabase)}>
          <option value="VIEWER">Viewer</option>
          <option value="AUDITEUR">Auditeur</option>
          <option value="FINANCIER">Financier</option>
          <option value="CHARGE_PROGRAMME">Chargé de programme</option>
          <option value="COORDINATEUR">Coordinateur</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button type="submit" disabled={createUser.isPending}>Créer l'utilisateur</button>
      </form>
      {createUser.isError && <p style={{ color: 'red' }}>{(createUser.error as Error).message}</p>}
      {createUser.isSuccess && (createUser.data as { warning?: string }).warning && (
        <p style={{ color: 'orange' }}>{(createUser.data as { warning?: string }).warning}</p>
      )}

      {isLoading && <p>Chargement…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}

      <ul>
        {users?.map((u) => (
          <li key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>{u.prenom} {u.nom} — {u.email} ({u.role}, {u.actif ? 'actif' : 'désactivé'})</span>
            <button onClick={() => deleteUser.mutate(u.id)} disabled={deleteUser.isPending}>
              Supprimer (ADMIN requis → doit échouer si vous ne l'êtes pas)
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PilotLogframeObjectivesList() {
  const { data: objectives, isLoading, isError, error } = useLogframeObjectivesSupabase();
  const createObjective = useCreateLogframeObjectiveSupabase();
  const deleteObjective = useDeleteLogframeObjectiveSupabase();
  const [projectId, setProjectId] = useState('fe420645-8f49-4ff3-87d4-645a2db2c0aa'); // PROJ-TEST
  const [code, setCode] = useState('');
  const [libelle, setLibelle] = useState('');
  const [niveau, setNiveau] = useState<LogframeLevelSupabase>('OBJECTIF_SPECIFIQUE');
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h2>Logframe — Objectifs</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createObjective.mutate({ projectId, code, libelle, niveau });
        }}
        style={{ display: 'flex', gap: 8, margin: '1rem 0', flexWrap: 'wrap' }}
      >
        <input placeholder="projectId (uuid)" value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ width: 280 }} />
        <input placeholder="code" value={code} onChange={(e) => setCode(e.target.value)} required />
        <input placeholder="libelle" value={libelle} onChange={(e) => setLibelle(e.target.value)} required />
        <select value={niveau} onChange={(e) => setNiveau(e.target.value as LogframeLevelSupabase)}>
          <option value="OBJECTIF_GLOBAL">Objectif global</option>
          <option value="OBJECTIF_SPECIFIQUE">Objectif spécifique</option>
          <option value="RESULTAT">Résultat</option>
          <option value="ACTIVITE">Activité</option>
        </select>
        <button type="submit" disabled={createObjective.isPending}>Créer l'objectif</button>
      </form>
      {createObjective.isError && <p style={{ color: 'red' }}>{(createObjective.error as Error).message}</p>}

      {isLoading && <p>Chargement…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}

      <ul>
        {objectives?.map((o) => (
          <li key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>
              <button onClick={() => setSelectedObjectiveId(o.id === selectedObjectiveId ? null : o.id)} style={{ marginRight: 8 }}>
                {o.id === selectedObjectiveId ? '▼' : '▶'}
              </button>
              {o.code} — {o.libelle} ({o.niveau})
            </span>
            <button onClick={() => deleteObjective.mutate(o.id)} disabled={deleteObjective.isPending}>
              Supprimer (ADMIN requis → doit échouer)
            </button>
          </li>
        ))}
      </ul>

      {selectedObjectiveId && <PilotLogframeIndicatorsList objectiveId={selectedObjectiveId} />}
    </div>
  );
}

function PilotLogframeIndicatorsList({ objectiveId }: { objectiveId: string }) {
  const { data: indicators, isLoading, isError, error } = useLogframeIndicatorsSupabase(objectiveId);
  const createIndicator = useCreateLogframeIndicatorSupabase();
  const deleteIndicator = useDeleteLogframeIndicatorSupabase();
  const [code, setCode] = useState('');
  const [libelle, setLibelle] = useState('');
  const [type, setType] = useState<IndicatorTypeSupabase>('OUTPUT');

  return (
    <div style={{ margin: '0.5rem 0 1rem 2rem', padding: '0.75rem', background: '#f7f7f7', borderRadius: 6 }}>
      <h3 style={{ marginTop: 0 }}>Indicateurs de l'objectif sélectionné</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createIndicator.mutate({ objectiveId, code, libelle, type });
        }}
        style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}
      >
        <input placeholder="code" value={code} onChange={(e) => setCode(e.target.value)} required />
        <input placeholder="libelle" value={libelle} onChange={(e) => setLibelle(e.target.value)} required />
        <select value={type} onChange={(e) => setType(e.target.value as IndicatorTypeSupabase)}>
          <option value="IMPACT">Impact</option>
          <option value="OUTCOME">Outcome</option>
          <option value="OUTPUT">Output</option>
          <option value="PROCESS">Process</option>
        </select>
        <button type="submit" disabled={createIndicator.isPending}>Créer l'indicateur</button>
      </form>
      {createIndicator.isError && <p style={{ color: 'red' }}>{(createIndicator.error as Error).message}</p>}

      {isLoading && <p>Chargement des indicateurs…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}

      <ul>
        {indicators?.map((i) => (
          <li key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>{i.code} — {i.libelle} ({i.type})</span>
            <button onClick={() => deleteIndicator.mutate({ id: i.id, objectiveId })} disabled={deleteIndicator.isPending}>
              Supprimer (ADMIN requis → doit échouer)
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PilotPtbaList() {
  const { data: activites, isLoading, isError, error } = usePtbaActivitesSupabase();
  const createActivite = useCreatePtbaActiviteSupabase();
  const deleteActivite = useDeletePtbaActiviteSupabase();
  const [projectId, setProjectId] = useState('fe420645-8f49-4ff3-87d4-645a2db2c0aa'); // PROJ-TEST
  const [code, setCode] = useState('');
  const [libelle, setLibelle] = useState('');
  const [annee, setAnnee] = useState('2026');
  const [trimestre, setTrimestre] = useState('1');

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h2>PTBA — Activités</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createActivite.mutate({ projectId, code, libelle, annee: Number(annee), trimestre: Number(trimestre) });
        }}
        style={{ display: 'flex', gap: 8, margin: '1rem 0', flexWrap: 'wrap' }}
      >
        <input placeholder="projectId (uuid)" value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ width: 280 }} />
        <input placeholder="code" value={code} onChange={(e) => setCode(e.target.value)} required />
        <input placeholder="libelle" value={libelle} onChange={(e) => setLibelle(e.target.value)} required />
        <input placeholder="année" type="number" value={annee} onChange={(e) => setAnnee(e.target.value)} required style={{ width: 100 }} />
        <input placeholder="trimestre (1-4)" type="number" min={1} max={4} value={trimestre} onChange={(e) => setTrimestre(e.target.value)} required style={{ width: 120 }} />
        <button type="submit" disabled={createActivite.isPending}>Créer l'activité</button>
      </form>
      {createActivite.isError && <p style={{ color: 'red' }}>{(createActivite.error as Error).message}</p>}

      {isLoading && <p>Chargement…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}

      <ul>
        {activites?.map((a) => (
          <li key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>
              {a.code} — {a.libelle} ({a.statut}) — {a.annee} T{a.trimestre}
            </span>
            <button onClick={() => deleteActivite.mutate(a.id)} disabled={deleteActivite.isPending}>
              Supprimer (ADMIN requis → doit échouer)
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PilotPpmList() {
  const { data: marches, isLoading, isError, error } = usePpmMarchesSupabase();
  const createMarche = useCreatePpmMarcheSupabase();
  const deleteMarche = useDeletePpmMarcheSupabase();
  const [projectId, setProjectId] = useState('fe420645-8f49-4ff3-87d4-645a2db2c0aa'); // PROJ-TEST
  const [code, setCode] = useState('');
  const [intitule, setIntitule] = useState('');
  const [type, setType] = useState<'FOURNITURES' | 'TRAVAUX' | 'SERVICES' | 'CONSULTANTS'>('SERVICES');
  const [selectedMarcheId, setSelectedMarcheId] = useState<string | null>(null);

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h2>PPM — Marchés</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMarche.mutate({ projectId, code, intitule, type });
        }}
        style={{ display: 'flex', gap: 8, margin: '1rem 0', flexWrap: 'wrap' }}
      >
        <input placeholder="projectId (uuid)" value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ width: 280 }} />
        <input placeholder="code" value={code} onChange={(e) => setCode(e.target.value)} required />
        <input placeholder="intitule" value={intitule} onChange={(e) => setIntitule(e.target.value)} required />
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
          <option value="FOURNITURES">Fournitures</option>
          <option value="TRAVAUX">Travaux</option>
          <option value="SERVICES">Services</option>
          <option value="CONSULTANTS">Consultants</option>
        </select>
        <button type="submit" disabled={createMarche.isPending}>Créer le marché</button>
      </form>
      {createMarche.isError && <p style={{ color: 'red' }}>{(createMarche.error as Error).message}</p>}

      {isLoading && <p>Chargement…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}

      <ul>
        {marches?.map((m) => (
          <li key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>
              <button onClick={() => setSelectedMarcheId(m.id === selectedMarcheId ? null : m.id)} style={{ marginRight: 8 }}>
                {m.id === selectedMarcheId ? '▼' : '▶'}
              </button>
              {m.code} — {m.intitule} ({m.type}, {m.statut})
            </span>
            <button onClick={() => deleteMarche.mutate(m.id)} disabled={deleteMarche.isPending}>
              Supprimer (ADMIN requis → doit échouer)
            </button>
          </li>
        ))}
      </ul>

      {selectedMarcheId && <PilotPpmEtapesList marcheId={selectedMarcheId} />}
    </div>
  );
}

function PilotPpmEtapesList({ marcheId }: { marcheId: string }) {
  const { data: etapes, isLoading, isError, error } = usePpmEtapesSupabase(marcheId);
  const createEtape = useCreatePpmEtapeSupabase();
  const deleteEtape = useDeletePpmEtapeSupabase();
  const [libelle, setLibelle] = useState('');
  const [ordre, setOrdre] = useState('1');

  return (
    <div style={{ margin: '0.5rem 0 1rem 2rem', padding: '0.75rem', background: '#f7f7f7', borderRadius: 6 }}>
      <h3 style={{ marginTop: 0 }}>Étapes du marché sélectionné</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createEtape.mutate({ marcheId, libelle, ordre: Number(ordre) });
        }}
        style={{ display: 'flex', gap: 8, marginBottom: 8 }}
      >
        <input placeholder="libelle" value={libelle} onChange={(e) => setLibelle(e.target.value)} required />
        <input placeholder="ordre" type="number" value={ordre} onChange={(e) => setOrdre(e.target.value)} required style={{ width: 80 }} />
        <button type="submit" disabled={createEtape.isPending}>Créer l'étape</button>
      </form>
      {createEtape.isError && <p style={{ color: 'red' }}>{(createEtape.error as Error).message}</p>}

      {isLoading && <p>Chargement des étapes…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}

      <ul>
        {etapes?.map((e) => (
          <li key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>#{e.ordre} — {e.libelle} {e.complete ? '✅' : ''}</span>
            <button onClick={() => deleteEtape.mutate({ id: e.id, marcheId })} disabled={deleteEtape.isPending}>
              Supprimer (ADMIN requis → doit échouer, mais DELETE réel si ça passe)
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PilotNotificationsList() {
  const { data: notifications, isLoading, isError, error } = useNotificationsSupabase();
  const createNotification = useCreateNotificationSupabase();
  const markRead = useMarkNotificationReadSupabase();
  const deleteNotification = useDeleteNotificationSupabase();
  const [userId, setUserId] = useState('b7f30cae-8b1f-4b5e-931f-6188674827af'); // test-supabase@sigp.com lui-même
  const [titre, setTitre] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h2>Notifications</h2>
      <p style={{ fontSize: 12, color: '#666' }}>
        userId pré-rempli avec votre propre compte de test — vous ne pouvez notifier que
        quelqu'un de votre organisation.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createNotification.mutate({ userId, type: 'PROJET_STATUT_CHANGE', titre, message });
        }}
        style={{ display: 'flex', gap: 8, margin: '1rem 0', flexWrap: 'wrap' }}
      >
        <input placeholder="userId (uuid)" value={userId} onChange={(e) => setUserId(e.target.value)} style={{ width: 280 }} />
        <input placeholder="titre" value={titre} onChange={(e) => setTitre(e.target.value)} required />
        <input placeholder="message" value={message} onChange={(e) => setMessage(e.target.value)} required />
        <button type="submit" disabled={createNotification.isPending}>Créer la notification</button>
      </form>
      {createNotification.isError && <p style={{ color: 'red' }}>{(createNotification.error as Error).message}</p>}

      {isLoading && <p>Chargement…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}

      <ul>
        {notifications?.map((n) => (
          <li key={n.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>{n.lue ? '✅' : '🔵'} {n.titre} — {n.message}</span>
            <span>
              <button onClick={() => markRead.mutate(n.id)} disabled={markRead.isPending || n.lue} style={{ marginRight: 8 }}>
                Marquer lu
              </button>
              <button onClick={() => deleteNotification.mutate(n.id)} disabled={deleteNotification.isPending}>
                Supprimer (ADMIN requis → doit échouer)
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PilotJournalOperationsList() {
  const { data: operations, isLoading, isError, error } = useJournalOperationsSupabase();
  const createOperation = useCreateJournalOperationSupabase();
  const deleteOperation = useDeleteJournalOperationSupabase();
  const [budgetLigneId, setBudgetLigneId] = useState('');
  const [type, setType] = useState<'RECETTE' | 'DEPENSE' | 'VIREMENT'>('DEPENSE');
  const [montant, setMontant] = useState('');
  const [dateOperation, setDateOperation] = useState('');

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h2>Budget — Journal des opérations (dernière étape, 5/5)</h2>
      <p style={{ fontSize: 12, color: '#666' }}>
        budgetLigneId (uuid) obligatoire — utilisez l'id d'une ligne créée dans la section Budget — Versions plus haut.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createOperation.mutate({ budgetLigneId, type, montant: Number(montant), dateOperation });
        }}
        style={{ display: 'flex', gap: 8, margin: '1rem 0', flexWrap: 'wrap' }}
      >
        <input placeholder="budgetLigneId (uuid)" value={budgetLigneId} onChange={(e) => setBudgetLigneId(e.target.value)} required style={{ width: 280 }} />
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
          <option value="RECETTE">Recette</option>
          <option value="DEPENSE">Dépense</option>
          <option value="VIREMENT">Virement</option>
        </select>
        <input placeholder="montant" type="number" value={montant} onChange={(e) => setMontant(e.target.value)} required />
        <input type="date" value={dateOperation} onChange={(e) => setDateOperation(e.target.value)} required />
        <button type="submit" disabled={createOperation.isPending}>Créer l'opération</button>
      </form>
      {createOperation.isError && <p style={{ color: 'red' }}>{(createOperation.error as Error).message}</p>}

      {isLoading && <p>Chargement…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}

      <ul>
        {operations?.map((o) => (
          <li key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>{o.type} — {o.montant} FCFA ({o.date_operation})</span>
            <button onClick={() => deleteOperation.mutate(o.id)} disabled={deleteOperation.isPending}>
              Supprimer (ADMIN requis → doit échouer)
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PilotFundingSourcesList() {
  const { data: sources, isLoading, isError, error } = useFundingSourcesSupabase();
  const createSource = useCreateFundingSourceSupabase();
  const deleteSource = useDeleteFundingSourceSupabase();
  const [projectId, setProjectId] = useState('fe420645-8f49-4ff3-87d4-645a2db2c0aa'); // PROJ-TEST
  const [nom, setNom] = useState('');
  const [montant, setMontant] = useState('');

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h2>Budget — Sources de financement</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createSource.mutate({ projectId, nom, montant: Number(montant) });
        }}
        style={{ display: 'flex', gap: 8, margin: '1rem 0', flexWrap: 'wrap' }}
      >
        <input placeholder="projectId (uuid)" value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ width: 280 }} />
        <input placeholder="nom (ex: AFD)" value={nom} onChange={(e) => setNom(e.target.value)} required />
        <input placeholder="montant" type="number" value={montant} onChange={(e) => setMontant(e.target.value)} required />
        <button type="submit" disabled={createSource.isPending}>Créer la source</button>
      </form>
      {createSource.isError && <p style={{ color: 'red' }}>{(createSource.error as Error).message}</p>}

      {isLoading && <p>Chargement…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}

      <ul>
        {sources?.map((s) => (
          <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>{s.nom} ({s.type}) — {s.montant} {s.devise}</span>
            <button onClick={() => deleteSource.mutate(s.id)} disabled={deleteSource.isPending}>
              Supprimer (ADMIN requis → doit échouer)
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PilotDisbursementsList() {
  const { data: disbursements, isLoading, isError, error } = useDisbursementsSupabase();
  const createDisbursement = useCreateDisbursementSupabase();
  const deleteDisbursement = useDeleteDisbursementSupabase();
  const [budgetVersionId, setBudgetVersionId] = useState('');
  const [montant, setMontant] = useState('');

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h2>Budget — Décaissements</h2>
      <p style={{ fontSize: 12, color: '#666' }}>
        budgetVersionId (uuid) obligatoire pour ce test — sans aucune référence (version/ligne/contrat/source),
        seul un ADMIN pourrait créer le décaissement (organisation non résolvable).
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createDisbursement.mutate({ budgetVersionId: budgetVersionId || undefined, montant: Number(montant) });
        }}
        style={{ display: 'flex', gap: 8, margin: '1rem 0', flexWrap: 'wrap' }}
      >
        <input placeholder="budgetVersionId (uuid)" value={budgetVersionId} onChange={(e) => setBudgetVersionId(e.target.value)} style={{ width: 280 }} />
        <input placeholder="montant" type="number" value={montant} onChange={(e) => setMontant(e.target.value)} required />
        <button type="submit" disabled={createDisbursement.isPending}>Créer le décaissement</button>
      </form>
      {createDisbursement.isError && <p style={{ color: 'red' }}>{(createDisbursement.error as Error).message}</p>}

      {isLoading && <p>Chargement…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}

      <ul>
        {disbursements?.map((d) => (
          <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>{d.montant} FCFA — {d.statut}</span>
            <button onClick={() => deleteDisbursement.mutate(d.id)} disabled={deleteDisbursement.isPending}>
              Supprimer (ADMIN requis → doit échouer)
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PilotBudgetLinesList({ versionId }: { versionId: string }) {
  const { data: lignes, isLoading, isError, error } = useBudgetLinesSupabase(versionId);
  const createLigne = useCreateBudgetLineSupabase();
  const deleteLigne = useDeleteBudgetLineSupabase();
  const [codeLigne, setCodeLigne] = useState('');
  const [libelle, setLibelle] = useState('');
  const [montantPrevu, setMontantPrevu] = useState('');

  return (
    <div style={{ margin: '0.5rem 0 1rem 2rem', padding: '0.75rem', background: '#f7f7f7', borderRadius: 6 }}>
      <h3 style={{ marginTop: 0 }}>Lignes de la version sélectionnée</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createLigne.mutate({ versionId, codeLigne, libelle, montantPrevu: Number(montantPrevu) || 0 });
        }}
        style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}
      >
        <input placeholder="code (ex: L1)" value={codeLigne} onChange={(e) => setCodeLigne(e.target.value)} required />
        <input placeholder="libelle" value={libelle} onChange={(e) => setLibelle(e.target.value)} required />
        <input placeholder="montant prévu" type="number" value={montantPrevu} onChange={(e) => setMontantPrevu(e.target.value)} />
        <button type="submit" disabled={createLigne.isPending}>Créer la ligne</button>
      </form>
      {createLigne.isError && <p style={{ color: 'red' }}>{(createLigne.error as Error).message}</p>}

      {isLoading && <p>Chargement des lignes…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}

      <ul>
        {lignes?.map((l) => (
          <li key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>
              {l.code_ligne} — {l.libelle} (prévu: {l.montant_prevu}, engagé: {l.montant_engage}, payé: {l.montant_paye})
              {' '}<code style={{ fontSize: 11, background: '#eee', padding: '1px 4px', borderRadius: 3 }}>{l.id}</code>
            </span>
            <button onClick={() => deleteLigne.mutate({ id: l.id, versionId })} disabled={deleteLigne.isPending}>
              Supprimer (ADMIN requis → doit échouer)
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PilotDocumentsList() {
  const { data: documents, isLoading, isError, error } = useDocumentsSupabase();
  const createDocument = useCreateDocumentSupabase();
  const deleteDocument = useDeleteDocumentSupabase();
  const [projectId, setProjectId] = useState('fe420645-8f49-4ff3-87d4-645a2db2c0aa'); // PROJ-TEST
  const [titre, setTitre] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h2>Documents (métadonnées + versions/upload)</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createDocument.mutate({ projectId, titre });
        }}
        style={{ display: 'flex', gap: 8, margin: '1rem 0', flexWrap: 'wrap' }}
      >
        <input placeholder="projectId (uuid)" value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ width: 280 }} />
        <input placeholder="titre" value={titre} onChange={(e) => setTitre(e.target.value)} required />
        <button type="submit" disabled={createDocument.isPending}>Créer le document</button>
      </form>
      {createDocument.isError && <p style={{ color: 'red' }}>{(createDocument.error as Error).message}</p>}

      {isLoading && <p>Chargement…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}

      <ul>
        {documents?.map((d) => (
          <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>
              <button onClick={() => setSelectedDocId(d.id === selectedDocId ? null : d.id)} style={{ marginRight: 8 }}>
                {d.id === selectedDocId ? '▼' : '▶'}
              </button>
              {d.titre} ({d.statut})
            </span>
            <button onClick={() => deleteDocument.mutate(d.id)} disabled={deleteDocument.isPending}>
              Supprimer (COORDINATEUR/ADMIN → doit réussir cette fois)
            </button>
          </li>
        ))}
      </ul>

      {selectedDocId && <PilotDocumentVersions documentId={selectedDocId} />}
      <PilotLivrablesList />
    </div>
  );
}

function PilotLivrablesList() {
  const { data: livrables, isLoading, isError, error } = useLivrablesSupabase();
  const createLivrable = useCreateLivrableSupabase();
  const deleteLivrable = useDeleteLivrableSupabase();
  const [projectId, setProjectId] = useState('fe420645-8f49-4ff3-87d4-645a2db2c0aa'); // PROJ-TEST
  const [nom, setNom] = useState('');
  const [datePrevue, setDatePrevue] = useState('');

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h2>Livrables / Jalons</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createLivrable.mutate({ projectId, nom, datePrevue: datePrevue || undefined });
        }}
        style={{ display: 'flex', gap: 8, margin: '1rem 0', flexWrap: 'wrap' }}
      >
        <input placeholder="projectId (uuid)" value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ width: 280 }} />
        <input placeholder="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
        <input type="date" value={datePrevue} onChange={(e) => setDatePrevue(e.target.value)} />
        <button type="submit" disabled={createLivrable.isPending}>Créer le livrable</button>
      </form>
      {createLivrable.isError && <p style={{ color: 'red' }}>{(createLivrable.error as Error).message}</p>}

      {isLoading && <p>Chargement…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}

      <ul>
        {livrables?.map((l) => (
          <li key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>{l.nom} ({l.statut}) — prévu : {l.date_prevue ?? '—'}</span>
            <button onClick={() => deleteLivrable.mutate(l.id)} disabled={deleteLivrable.isPending}>
              Supprimer (ADMIN requis → doit échouer)
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PilotDocumentVersions({ documentId }: { documentId: string }) {
  const { data: versions, isLoading, isError, error } = useDocumentVersionsSupabase(documentId);
  const uploadVersion = useUploadDocumentVersionSupabase();
  const downloadVersion = useDownloadDocumentVersionSupabase();
  const [file, setFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  return (
    <div style={{ margin: '0.5rem 0 1rem 2rem', padding: '0.75rem', background: '#f7f7f7', borderRadius: 6 }}>
      <h3 style={{ marginTop: 0 }}>Versions du document sélectionné</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!file) return;
          uploadVersion.mutate({ documentId, file });
        }}
        style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}
      >
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button type="submit" disabled={!file || uploadVersion.isPending}>Téléverser une nouvelle version</button>
      </form>
      {uploadVersion.isError && <p style={{ color: 'red' }}>{(uploadVersion.error as Error).message}</p>}

      {isLoading && <p>Chargement des versions…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}

      <ul>
        {versions?.map((v) => (
          <li key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>
              v{v.numero_version} — {v.uploads?.original_name} ({v.uploads?.size_bytes} octets)
            </span>
            <button
              onClick={async () => {
                const res = await downloadVersion.mutateAsync({ documentId, versionNumber: v.numero_version });
                setDownloadUrl(res.data.url);
              }}
              disabled={downloadVersion.isPending}
            >
              Générer le lien de téléchargement
            </button>
          </li>
        ))}
      </ul>
      {downloadUrl && (
        <p>
          <a href={downloadUrl} target="_blank" rel="noreferrer">Télécharger (lien valable 60s)</a>
        </p>
      )}
      {downloadVersion.isError && <p style={{ color: 'red' }}>{(downloadVersion.error as Error).message}</p>}
    </div>
  );
}

function PilotContractsList() {
  const { data: contracts, isLoading, isError, error } = useContractsSupabase();
  const createContract = useCreateContractSupabase();
  const deleteContract = useDeleteContractSupabase();
  const [projectId, setProjectId] = useState('fe420645-8f49-4ff3-87d4-645a2db2c0aa'); // PROJ-TEST
  const [numero, setNumero] = useState('');
  const [intitule, setIntitule] = useState('');
  const [titulaire, setTitulaire] = useState('');
  const [montant, setMontant] = useState('');

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h2>Contrats</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createContract.mutate({ projectId, numero, intitule, titulaire, montant: Number(montant) });
        }}
        style={{ display: 'flex', gap: 8, margin: '1rem 0', flexWrap: 'wrap' }}
      >
        <input placeholder="projectId (uuid)" value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ width: 280 }} />
        <input placeholder="numero" value={numero} onChange={(e) => setNumero(e.target.value)} required />
        <input placeholder="intitule" value={intitule} onChange={(e) => setIntitule(e.target.value)} required />
        <input placeholder="titulaire" value={titulaire} onChange={(e) => setTitulaire(e.target.value)} required />
        <input placeholder="montant" type="number" value={montant} onChange={(e) => setMontant(e.target.value)} required />
        <button type="submit" disabled={createContract.isPending}>Créer le contrat</button>
      </form>
      {createContract.isError && <p style={{ color: 'red' }}>{(createContract.error as Error).message}</p>}

      {isLoading && <p>Chargement…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}

      <ul>
        {contracts?.map((c) => (
          <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>{c.numero} — {c.intitule} ({c.titulaire}, {c.montant} {c.devise})</span>
            <button onClick={() => deleteContract.mutate(c.id)} disabled={deleteContract.isPending}>
              Supprimer (ADMIN requis → doit échouer)
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PilotWbsList() {
  const { data: nodes, isLoading, isError, error } = useWbsNodesSupabase();
  const createNode = useCreateWbsNodeSupabase();
  const deleteNode = useDeleteWbsNodeSupabase();
  const [projectId, setProjectId] = useState('fe420645-8f49-4ff3-87d4-645a2db2c0aa'); // PROJ-TEST
  const [code, setCode] = useState('');
  const [libelle, setLibelle] = useState('');
  const [type, setType] = useState<'PHASE' | 'LOT' | 'ACTIVITE' | 'LIVRABLE'>('PHASE');

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h2>WBS</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createNode.mutate({ projectId, code, libelle, type });
        }}
        style={{ display: 'flex', gap: 8, margin: '1rem 0', flexWrap: 'wrap' }}
      >
        <input placeholder="projectId (uuid)" value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ width: 280 }} />
        <input placeholder="code (ex: P1)" value={code} onChange={(e) => setCode(e.target.value)} required />
        <input placeholder="libelle" value={libelle} onChange={(e) => setLibelle(e.target.value)} required />
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
          <option value="PHASE">Phase</option>
          <option value="LOT">Lot</option>
          <option value="ACTIVITE">Activité</option>
          <option value="LIVRABLE">Livrable</option>
        </select>
        <button type="submit" disabled={createNode.isPending}>Créer le nœud</button>
      </form>
      {createNode.isError && <p style={{ color: 'red' }}>{(createNode.error as Error).message}</p>}

      {isLoading && <p>Chargement…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}

      <ul>
        {nodes?.map((n) => (
          <li key={n.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>[{n.type}] {n.code} — {n.libelle} (niveau {n.niveau})</span>
            <button onClick={() => deleteNode.mutate(n.id)} disabled={deleteNode.isPending}>
              Supprimer (ADMIN requis → doit échouer)
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PilotRisquesList() {
  const { data: risques, isLoading, isError, error } = useRisquesSupabase();
  const createRisque = useCreateRisqueSupabase();
  const deleteRisque = useDeleteRisqueSupabase();
  const [projectId, setProjectId] = useState('fe420645-8f49-4ff3-87d4-645a2db2c0aa'); // PROJ-TEST
  const [description, setDescription] = useState('');
  const [probabilite, setProbabilite] = useState<'FAIBLE' | 'POSSIBLE' | 'PROBABLE' | 'QUASI_CERTAIN'>('POSSIBLE');
  const [impact, setImpact] = useState<'FAIBLE' | 'MODERE' | 'IMPORTANT' | 'CRITIQUE'>('MODERE');

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h2>Risques</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createRisque.mutate({ projectId, description, probabilite, impact });
        }}
        style={{ display: 'flex', gap: 8, margin: '1rem 0', flexWrap: 'wrap' }}
      >
        <input placeholder="projectId (uuid)" value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ width: 280 }} />
        <input placeholder="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
        <select value={probabilite} onChange={(e) => setProbabilite(e.target.value as typeof probabilite)}>
          <option value="FAIBLE">Faible</option>
          <option value="POSSIBLE">Possible</option>
          <option value="PROBABLE">Probable</option>
          <option value="QUASI_CERTAIN">Quasi certain</option>
        </select>
        <select value={impact} onChange={(e) => setImpact(e.target.value as typeof impact)}>
          <option value="FAIBLE">Faible</option>
          <option value="MODERE">Modéré</option>
          <option value="IMPORTANT">Important</option>
          <option value="CRITIQUE">Critique</option>
        </select>
        <button type="submit" disabled={createRisque.isPending}>Créer le risque</button>
      </form>
      {createRisque.isError && <p style={{ color: 'red' }}>{(createRisque.error as Error).message}</p>}

      {isLoading && <p>Chargement…</p>}
      {isError && <p style={{ color: 'red' }}>Erreur : {(error as Error).message}</p>}

      <ul>
        {risques?.map((r) => (
          <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>{r.description} — {r.niveau_criticite} ({r.probabilite} × {r.impact})</span>
            <button onClick={() => deleteRisque.mutate(r.id)} disabled={deleteRisque.isPending}>
              Supprimer (ADMIN requis → doit échouer)
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
