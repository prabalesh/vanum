import { BrowserRouter as Router } from "react-router-dom"
import AuthProvider from "./hooks/useAuth"
import { Toaster } from "react-hot-toast"
import AppRoutes from "./components/AppRoutes"

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
