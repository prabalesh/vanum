import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom"
import AuthProvider, { useAuth } from "./hooks/useAuth"
import { Toaster } from "react-hot-toast"
import { Login } from "./pages/Login";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import Roles from "./pages/Roles";
import Users from "./pages/Users";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="roles" element={<Roles />} />
        <Route path="users" element={<Users />} />
        {/* <Route path="theaters" element={<Theaters />} />
        <Route path="movies" element={<Movies />} />
        <Route path="screenings" element={<Screenings />} />
        <Route path="bookings" element={<Bookings />} /> */}
      </Route>
    </Routes>
  );
};

function App() {

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
