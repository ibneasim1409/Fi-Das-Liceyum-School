import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import MainDashboard from './pages/MainDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Inquiries from './pages/Inquiries';
import Admissions from './pages/Admissions';
import Classes from './pages/Classes';
import { AuthProvider } from './store/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/Login';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans antialiased">
      <Navbar />
      <div className="flex flex-1 pt-16">
        <Sidebar />
        <main className="flex-1 lg:ml-64 w-full py-6 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<MainDashboard />} />

              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>

              <Route element={<ProtectedRoute roles={['admin', 'hr', 'front_desk']} />}>
                <Route path="/inquiries" element={<Inquiries />} />
              </Route>

              <Route element={<ProtectedRoute roles={['admin', 'hr']} />}>
                <Route path="/admissions" element={<Admissions />} />
                <Route path="/classes" element={<Classes />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
