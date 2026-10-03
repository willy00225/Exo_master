import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import PushNotificationManager from './components/common/PushNotificationManager';
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
import Support from './pages/admin/Support';
import Invitations from './pages/admin/Invitations';
import Tips from './pages/admin/Tips';
import QuestionBank from './pages/admin/QuestionBank';
import Subjects from './pages/admin/Subjects';
import Schools from './pages/admin/Schools';

// Pages Élève (alias pour éviter les conflits)
import StudentExercises from './pages/student/Exercises';
import StudentQuizzes from './pages/student/Quizzes';
import StudentChallenges from './pages/student/Challenges';
import StudentProfile from './pages/student/Profile';
import Subscription from './pages/student/Subscription';
import StudentPayments from './pages/student/Payments';
import ChangePassword from './pages/student/ChangePassword';
import StudentSupport from './pages/student/Support';
import StudentTips from './pages/student/Tips';
import ChangeClass from './pages/student/ChangeClass';

// Landing page
import LandingPage from './pages/LandingPage';

// Email vérifié
import EmailVerified from './pages/EmailVerified';

// Vérification d'email (lien reçu par mail)
import VerifyEmail from './pages/VerifyEmail';

// Vérification d'email en attente (page intermédiaire après inscription)
import VerifyEmailPending from './pages/auth/VerifyEmailPending';

// Mot de passe oublié
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Invitation à un défi
import InviteLanding from './pages/InviteLanding';

// Page 404
import NotFound from './pages/NotFound';

/* ------------------------------------------------------------------ */
/*  Écran de chargement stable (pas de flash, pas d'animation)         */
/* ------------------------------------------------------------------ */
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
        <p className="text-slate-400 text-sm">Chargement…</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Redirection selon le rôle (utilisée pour /login et /register)      */
/* ------------------------------------------------------------------ */
function RedirectIfAuthenticated({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (user) {
    // Redirige directement vers le bon dashboard selon le rôle
    const target = user.role === 'admin' ? '/admin' : '/student';
    return <Navigate to={target} replace />;
  }

  return children;
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      {/* ✅ Gestionnaire de notifications push
          - Monté uniquement si l'utilisateur est connecté
          - Évite les appels API 401 en boucle sur /login, /register, etc. */}
      {user && <PushNotificationManager />}

      <Routes>
        {/* -------------------- Routes publiques -------------------- */}

        {/* Login — redirige directement vers le dashboard si déjà connecté */}
        <Route
          path="/login"
          element={
            <RedirectIfAuthenticated>
              <Login />
            </RedirectIfAuthenticated>
          }
        />

        {/* Register — idem */}
        <Route
          path="/register"
          element={
            <RedirectIfAuthenticated>
              <Register />
            </RedirectIfAuthenticated>
          }
        />

        {/* Routes publiques indépendantes */}
        <Route path="/invite/:token" element={<InviteLanding />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/email-verified" element={<EmailVerified />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-email-pending" element={<VerifyEmailPending />} />

        {/* -------------------- Route racine -------------------- */}
        {/* Non connecté → LandingPage | Connecté → redirection directe vers dashboard */}
        <Route
          path="/"
          element={
            !user ? (
              <LandingPage />
            ) : (
              <Navigate
                to={user.role === 'admin' ? '/admin' : '/student'}
                replace
              />
            )
          }
        />

        {/* -------------------- Routes Admin -------------------- */}
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
          <Route path="subjects" element={<Subjects />} />
          <Route path="schools" element={<Schools />} />
          <Route path="payments" element={<Payments />} />
          <Route path="exercises" element={<Exercises />} />
          <Route path="quizzes" element={<Quizzes />} />
          <Route path="challenges" element={<Challenges />} />
          <Route path="settings" element={<Settings />} />
          <Route path="support" element={<Support />} />
          <Route path="invitations" element={<Invitations />} />
          <Route path="tips" element={<Tips />} />
          <Route path="question-bank" element={<QuestionBank />} />
        </Route>

        {/* -------------------- Routes Student -------------------- */}
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
          <Route path="support" element={<StudentSupport />} />
          <Route path="tips" element={<StudentTips />} />
          <Route path="change-class" element={<ChangeClass />} />
        </Route>

        {/* -------------------- 404 -------------------- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
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