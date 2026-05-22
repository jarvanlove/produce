import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ClassListPage from './pages/ClassListPage'
import DashboardPage from './pages/DashboardPage'
import ImportPage from './pages/ImportPage'
import StudentProfilePage from './pages/StudentProfilePage'
import RiskAlertPage from './pages/RiskAlertPage'
import ReportPage from './pages/ReportPage'
import Layout from './components/Layout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/classes" replace />} />
          <Route path="classes" element={<ClassListPage />} />
          <Route path="dashboard/:classId" element={<DashboardPage />} />
          <Route path="dashboard/:classId/:examId" element={<DashboardPage />} />
          <Route path="import/:classId" element={<ImportPage />} />
          <Route path="students/:classId" element={<StudentProfilePage />} />
          <Route path="risk/:classId" element={<RiskAlertPage />} />
          <Route path="report/:classId/:examId" element={<ReportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
