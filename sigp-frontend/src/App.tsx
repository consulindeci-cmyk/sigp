import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import SaisiePOAPage from './pages/project/SaisiePOAPage'
import MoteurEVMPage from './pages/project/MoteurEVMPage'
import ProjectDashboardPage from './pages/project/ProjectDashboardPage'
import BudgetPage from './pages/project/BudgetPage'
import RisksPage from './pages/project/RisksPage'
import LogframePage from './pages/project/LogframePage'
import PTBAPage from './pages/project/PTBAPage'
import WBSPage from './pages/project/WBSPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route publique */}
        <Route path="/login" element={<LoginPage />} />

        {/* Routes protégées avec Layout AppShell */}
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />

          {/* Routes spécifiques à un projet */}
          <Route path="/projects/:id">
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ProjectDashboardPage />} />
            <Route path="saisie-poa" element={<SaisiePOAPage />} />
            <Route path="moteur-evm" element={<MoteurEVMPage />} />
            <Route path="budget" element={<BudgetPage />} />
            <Route path="risks" element={<RisksPage />} />
            <Route path="logframe" element={<LogframePage />} />
            <Route path="ptba" element={<PTBAPage />} />
            <Route path="wbs" element={<WBSPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
