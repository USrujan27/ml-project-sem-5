import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Overview from './pages/Overview';
import Tasks from './pages/Tasks';
import Executions from './pages/Executions';
import ExecutionDetail from './pages/ExecutionDetail';
import Models from './pages/Models';
import Analytics from './pages/Analytics';
import Policies from './pages/Policies';
import Evaluations from './pages/Evaluations';
import SettingsPage from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-[#09090b]">
        <Sidebar />
        <main className="ml-56 flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/executions" element={<Executions />} />
            <Route path="/executions/:id" element={<ExecutionDetail />} />
            <Route path="/models" element={<Models />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/evaluations" element={<Evaluations />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
