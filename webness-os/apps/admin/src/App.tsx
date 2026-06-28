import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/AdminLayout.js";
import Overview from "./pages/Overview.js";
import Clients from "./pages/Clients.js";
import ClientDetail from "./pages/ClientDetail.js";
import TaskQueue from "./pages/TaskQueue.js";
import SystemHealth from "./pages/SystemHealth.js";
import AIBrain from "./pages/AIBrain.js";
import Revenue from "./pages/Revenue.js";
import AuditLog from "./pages/AuditLog.js";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Overview />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="tasks" element={<TaskQueue />} />
        <Route path="system" element={<SystemHealth />} />
        <Route path="brain" element={<AIBrain />} />
        <Route path="revenue" element={<Revenue />} />
        <Route path="audit" element={<AuditLog />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
