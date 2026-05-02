import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import StudentLayout from './components/layout/StudentLayout';
import StudentDashboard from './pages/student/Dashboard';

// Pages Admin
import Groups from './pages/admin/Groups';
import Payments from './pages/admin/Payments';
import Exercises from './pages/admin/Exercises';
import Quizzes from './pages/admin/Quizzes';
import Challenges from './pages/admin/Challenges';
import Settings from './pages/admin/Settings';
import Students from './pages/admin/Students';
import Chapters from './pages/admin/Chapters';

// Pages Élève (alias pour éviter les conflits)
import StudentExercises from './pages/student/Exercises';
import StudentQuizzes from './pages/student/Quizzes';
import StudentChallenges from './pages/student/Challenges';
import StudentProfile from './pages/student/Profile';
import Subscription from './pages/student/Subscription';
import StudentPayments from './pages/student/Payments';
import ChangePassword from './pages/student/ChangePassword';

// Landing page
import LandingPage from './pages/LandingPage';

// Email vérifié
import EmailVerified from './pages/EmailVerified';

// Page 404
import NotFound from './pages/NotFound'; // 🆕

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Chargement...
      </div>
    );
  }

  return (
    <Routes>
      {/* Route publique de connexion */}
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/" />}
      />

      {/* Route publique d'inscription */}
      <Route
        path="/register"
        element={!user ? <Register /> : <Navigate to="/" />}
      />

      {/* Route email vérifié (publique) */}
      <Route path="/email-verified" element={<EmailVerified />} />

      {/* Route racine : Landing page si non connecté, sinon redirection selon le rôle */}
      <Route
        path="/"
        element={
          !user ? (
            <LandingPage />
          ) : (
            <Navigate to={user.role === 'admin' ? '/admin' : '/student'} />
          )
        }
      />

      {/* Routes Admin avec Layout */}
      <Route
        path="/admin"
        element={
          <PrivateRoute role="admin">
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="groups" element={<Groups />} />
        <Route path="chapters" element={<Chapters />} />
        <Route path="payments" element={<Payments />} />
        <Route path="exercises" element={<Exercises />} />
        <Route path="quizzes" element={<Quizzes />} />
        <Route path="challenges" element={<Challenges />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Routes Student avec Layout */}
      <Route
        path="/student"
        element={
          <PrivateRoute role="student">
            <StudentLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="exercises" element={<StudentExercises />} />
        <Route path="quizzes" element={<StudentQuizzes />} />
        <Route path="challenges" element={<StudentChallenges />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="payments" element={<StudentPayments />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="change-password" element={<ChangePassword />} />
      </Route>

      {/* Route 404 - doit rester en dernier */}
      <Route path="*" element={<NotFound />} /> {/* 🆕 */}
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;