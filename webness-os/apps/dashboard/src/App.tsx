import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tools from "./pages/Tools";
import ToolExecute from "./pages/ToolExecute";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Credits from "./pages/Credits";
import ByokSettings from "./pages/ByokSettings";
import DealEngine from "./pages/DealEngine";
import AiOs from "./pages/AiOs";
import HermesChat from "./pages/HermesChat";
import EbookWriter from "./pages/EbookWriter";
import Vault from "./pages/Vault";
import MemoryManager from "./pages/MemoryManager";
import BusinessIntelligence from "./pages/BusinessIntelligence";
import DeveloperSettings from "./pages/DeveloperSettings";
import LinkScanner from "./pages/LinkScanner";
import NotebookSpace from "./pages/NotebookSpace";
import SignalRoomList from "./pages/SignalRoomList";
import SignalRoomDetail from "./pages/SignalRoomDetail";
import SignalIntake from "./pages/SignalIntake";
import ReportDetail from "./pages/ReportDetail";
import AgentWorkspace from "./components/AgentWorkspace";
import MemoryViewer from "./components/MemoryViewer";
import HarborSeo from "./pages/HarborSeo";
import LegalAi from "./pages/LegalAi";
import AgentCoder from "./pages/AgentCoder";
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Bypassing auth temporarily to make local development easier
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Login />} /> {/* Login is now repurposed as LauncherHub */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tools" element={<Tools />} />
        <Route path="tools/:slug" element={<ToolExecute />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="credits" element={<Credits />} />
        <Route path="byok" element={<ByokSettings />} />
        <Route path="ai-os" element={<AiOs />} />
        <Route path="agent-coder" element={<AgentCoder />} />
        <Route path="hermes" element={<HermesChat />} />
        <Route path="ebook-writer" element={<EbookWriter />} />
        <Route path="vault" element={<Vault />} />
        <Route path="notebook" element={<NotebookSpace />} />
        <Route path="link-scanner" element={<LinkScanner />} />
        <Route path="harbor-seo" element={<HarborSeo />} />
        <Route path="legal" element={<LegalAi />} />
        <Route path="deal-engine" element={<DealEngine />} />
        <Route path="memory" element={<MemoryManager />} />
        <Route path="business-intelligence" element={<BusinessIntelligence />} />
        <Route path="developer-settings" element={<DeveloperSettings />} />
        <Route path="signal-room" element={<SignalRoomList />} />
        <Route path="signal-room/:id" element={<SignalRoomDetail />} />
        <Route path="signal-room/:id/intake" element={<SignalIntake />} />
        <Route path="signal-room/reports/:id" element={<ReportDetail />} />
        <Route path="agent-workspace" element={<AgentWorkspace />} />
        <Route path="memory-viewer" element={<MemoryViewer />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
