import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './components/common/NotificationSystem';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import './App.css';

// Lazy load all pages — only downloaded when the user navigates to them
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Auth = lazy(() => import('./pages/Auth'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));
const CreateStory = lazy(() => import('./pages/CreateStory'));
const EditArticle = lazy(() => import('./pages/EditArticle'));
const Article = lazy(() => import('./pages/Article'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const Subscribers = lazy(() => import('./pages/Subscribers'));
const AuthorProfile = lazy(() => import('./pages/AuthorProfile'));
const Privacy = lazy(() => import('./pages/Privacy'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const Disclaimer = lazy(() => import('./pages/Disclaimer'));

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="app">
            <Navbar />
            <main>
              <Suspense fallback={<div className="loading-container"><div className="loading-spinner"></div></div>}>
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
                  path="/subscribers"
                  element={
                    <ProtectedRoute>
                      <Subscribers />
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

                {/* Public Author Profile */}
                <Route path="/author/:uid" element={<AuthorProfile />} />

                {/* Category Pages */}
                <Route path="/word" element={<CategoryPage category="word" />} />
                <Route path="/lens" element={<CategoryPage category="lens" />} />
                <Route path="/motion" element={<CategoryPage category="motion" />} />

                {/* Legal Pages */}
                <Route path="/privacy-policy" element={<Privacy />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/disclaimer" element={<Disclaimer />} />
              </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
      </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
