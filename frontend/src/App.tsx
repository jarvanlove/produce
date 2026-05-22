import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ClassListPage from './pages/ClassListPage'
import DashboardPage from './pages/DashboardPage'
import ImportPage from './pages/ImportPage'
import StudentProfilePage from './pages/StudentProfilePage'
import RiskAlertPage from './pages/RiskAlertPage'
import HeatmapPage from './pages/HeatmapPage'
import ReportPage from './pages/ReportPage'
import KnowledgePointPage from './pages/KnowledgePointPage'
import SettingsPage from './pages/SettingsPage'
import Layout from './components/Layout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/classes" replace />} />
          <Route path="classes" element={<ClassListPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="dashboard/:classId" element={<DashboardPage />} />
          <Route path="dashboard/:classId/:examId" element={<DashboardPage />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="import/:classId" element={<ImportPage />} />
          <Route path="students" element={<StudentProfilePage />} />
          <Route path="students/:classId" element={<StudentProfilePage />} />
          <Route path="risk" element={<RiskAlertPage />} />
          <Route path="risk/:classId" element={<RiskAlertPage />} />
          <Route path="risk/:classId/:examId" element={<RiskAlertPage />} />
          <Route path="heatmap" element={<HeatmapPage />} />
          <Route path="heatmap/:classId" element={<HeatmapPage />} />
          <Route path="heatmap/:classId/:examId" element={<HeatmapPage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="report/:classId/:examId" element={<ReportPage />} />
          <Route path="knowledge-points" element={<KnowledgePointPage />} />
          <Route path="knowledge-points/:classId" element={<KnowledgePointPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
