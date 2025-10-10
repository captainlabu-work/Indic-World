import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './components/common/NotificationSystem';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import CreateStory from './pages/CreateStory';
import EditArticle from './pages/EditArticle';
import Article from './pages/Article';
import PhotoEssay from './pages/PhotoEssay';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="app">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/signup" element={<Auth />} />

                {/* Protected Routes */}
                {/* Redirect old dashboard to new profile */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Navigate to="/profile" replace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <Admin />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/create-story"
                  element={
                    <ProtectedRoute>
                      <CreateStory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit-article/:id"
                  element={
                    <ProtectedRoute>
                      <EditArticle />
                    </ProtectedRoute>
                  }
                />

                {/* Article View */}
                <Route path="/article/:id" element={<Article />} />

                {/* Photo Essay View for Authentic Stories */}
                <Route path="/photo-essay/:storyId" element={<PhotoEssay />} />

                {/* Legal Pages */}
                <Route path="/privacy-policy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
              </Routes>
            </main>
            <Footer />
          </div>
      </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
