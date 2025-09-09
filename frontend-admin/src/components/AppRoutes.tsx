import { Route, Routes } from "react-router-dom";
import { Login } from "../pages/Login";
import ProtectedRoute from "./walls/ProtectedRoute";
import { Layout } from "./layout/Layout";
import { Dashboard } from "../pages/Dashboard";
import Roles from "../pages/Roles";
import Users from "../pages/Users";
import Movies from "../pages/Movies";
import Screenings from "../pages/Screenings";
import MovieDetail from "./movies/MovieDetail";

export default function AppRoutes() {
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
        <Route path="movies" element={<Movies />} />
        <Route path="movies/:id" element={<MovieDetail />} />
        <Route path="screenings" element={<Screenings />} />
        {/* <Route path="theaters" element={<Theaters />} />
        <Route path="bookings" element={<Bookings />} /> */}
      </Route>
    </Routes>
  );
}