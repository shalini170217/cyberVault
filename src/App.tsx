import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Shield, Lock, Key, Server, Database, Eye, AlertTriangle, Clock, ChevronRight, Github, Twitter, Linkedin, LogOut, User } from 'lucide-react';
import { supabase } from './supabase';
import AuthModal from './components/AuthModal';
import Folder from './components/folder';
import FileManager from './components/FileManager';

// Animated Background Components
function AnimatedStars() {
  const [stars, setStars] = useState<Array<{id: number, x: number, delay: number, duration: number}>>([]);

  useEffect(() => {
    const starArray = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4
    }));
    setStars(starArray);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-70 animate-pulse"
          style={{
            left: `${star.x}%`,
            animationDelay: `${star.delay}s`,
            animation: `fallingStar ${star.duration}s linear infinite`
          }}
        />
      ))}
      <style jsx>{`
        @keyframes fallingStar {
          0% {
            transform: translateY(-100vh) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(-50px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function AnimatedRockets() {
  const [rockets, setRockets] = useState<Array<{id: number, y: number, delay: number, duration: number}>>([]);

  useEffect(() => {
    const rocketArray = Array.from({ length: 3 }, (_, i) => ({
      id: i,
      y: 20 + Math.random() * 60,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 4
    }));
    setRockets(rocketArray);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {rockets.map((rocket) => (
        <div
          key={rocket.id}
          className="absolute text-cyan-400 opacity-30"
          style={{
            top: `${rocket.y}%`,
            animationDelay: `${rocket.delay}s`,
            animation: `floatingRocket ${rocket.duration}s ease-in-out infinite`
          }}
        >
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
              🚀
            </div>
            <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-6 h-1 bg-gradient-to-r from-orange-400 to-transparent rounded-full opacity-60"></div>
          </div>
        </div>
      ))}
      <style jsx>{`
        @keyframes floatingRocket {
          0% {
            transform: translateX(-100px) translateY(0) rotate(-10deg);
          }
          25% {
            transform: translateX(25vw) translateY(-20px) rotate(5deg);
          }
          50% {
            transform: translateX(50vw) translateY(10px) rotate(-5deg);
          }
          75% {
            transform: translateX(75vw) translateY(-15px) rotate(10deg);
          }
          100% {
            transform: translateX(calc(100vw + 100px)) translateY(5px) rotate(-10deg);
          }
        }
      `}</style>
    </div>
  );
}

function FloatingParticles() {
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, delay: number, duration: number, size: number}>>([]);

  useEffect(() => {
    const particleArray = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 10 + Math.random() * 10,
      size: 2 + Math.random() * 4
    }));
    setParticles(particleArray);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.delay}s`,
            animation: `floatingParticle ${particle.duration}s ease-in-out infinite`
          }}
        />
      ))}
      <style jsx>{`
        @keyframes floatingParticle {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-20px) translateX(10px) scale(1.2);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-10px) translateX(-15px) scale(0.8);
            opacity: 0.4;
          }
          75% {
            transform: translateY(-30px) translateX(5px) scale(1.1);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}

function LandingPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleAccessVault = () => {
    if (user) {
      navigate('/folder');
    } else {
      openAuthModal('login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Animated Background Elements */}
      <AnimatedStars />
      <AnimatedRockets />
      <FloatingParticles />
      
      {/* Header */}
      <header className="fixed top-0 w-full bg-black/20 backdrop-blur-sm border-b border-gray-800/50 z-40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-cyan-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                CyberVault
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex space-x-8">
                <a href="#features" className="text-gray-300 hover:text-cyan-400 transition-colors">Features</a>
                <a href="#security" className="text-gray-300 hover:text-cyan-400 transition-colors">Security</a>
                <a href="#contact" className="text-gray-300 hover:text-cyan-400 transition-colors">Contact</a>
              </nav>
              
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <User className="h-5 w-5" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => openAuthModal('login')}
                    className="px-4 py-2 text-gray-300 hover:text-cyan-400 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg font-medium transition-all duration-300"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse bg-cyan-400/20 rounded-full blur-xl"></div>
                <div className="relative bg-gray-800/50 p-4 rounded-full border border-cyan-400/30">
                  <Lock className="h-16 w-16 text-cyan-400" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent">
              Your Digital
              <span className="block text-cyan-400">Fortress</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Store your most sensitive data in an encrypted digital vault. 
              <span className="text-cyan-400 font-semibold"> Only you hold the key.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={handleAccessVault}
                className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
              >
                <span className="relative z-10 flex items-center">
                  {user ? 'Access Vault' : 'Get Started'}
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
              
              {!user && (
                <button className="px-8 py-4 rounded-lg font-semibold text-lg border border-gray-600 hover:border-cyan-400 hover:bg-gray-800/50 transition-all duration-300">
                  Learn More
                </button>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="flex justify-center items-center space-x-8 text-gray-400 text-sm">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-green-400" />
                256-bit Encryption
              </div>
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-2 text-blue-400" />
                Zero-Knowledge
              </div>
              <div className="flex items-center">
                <Server className="h-4 w-4 mr-2 text-purple-400" />
                24/7 Monitoring
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Unbreakable Security
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Advanced encryption meets user-friendly design. Your data remains yours, always.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
              <div className="mb-6">
                <div className="p-3 bg-cyan-500/10 rounded-lg w-fit">
                  <Key className="h-8 w-8 text-cyan-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Personal Encryption Key</h3>
              <p className="text-gray-300 leading-relaxed">
                Generate a unique encryption key that only you possess. We never store or have access to your key.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
              <div className="mb-6">
                <div className="p-3 bg-red-500/10 rounded-lg w-fit">
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Intrusion Protection</h3>
              <p className="text-gray-300 leading-relaxed">
                Automatic 24-hour lockdown after suspicious activity. Multiple failed attempts trigger security protocols.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
              <div className="mb-6">
                <div className="p-3 bg-purple-500/10 rounded-lg w-fit">
                  <Database className="h-8 w-8 text-purple-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Secure Storage</h3>
              <p className="text-gray-300 leading-relaxed">
                Military-grade encryption ensures your data remains unreadable even if intercepted.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section id="security" className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
                Security First,
                <span className="block text-cyan-400">Always</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Built with paranoid-level security in mind. Every layer of our system is designed to protect your data from unauthorized access.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Shield className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">End-to-End Encryption</h3>
                    <p className="text-gray-300">Your data is encrypted before it leaves your device</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Eye className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Zero-Knowledge Architecture</h3>
                    <p className="text-gray-300">We can't see your data, even if we wanted to</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <Clock className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Automatic Lockdown</h3>
                    <p className="text-gray-300">24-hour protection against brute force attacks</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gray-800/50 p-8 rounded-3xl border border-gray-700/50">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-700/50 rounded-lg flex items-center justify-center">
                      <div className="w-8 h-8 bg-cyan-400/20 rounded-full animate-pulse"></div>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <Lock className="h-12 w-12 text-cyan-400 mx-auto mb-2" />
                  <p className="text-gray-300 text-sm">Your encrypted vault</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
            Ready to Secure Your Digital Life?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust CyberVault with their most sensitive data. Your security is our mission.
          </p>
          {!user && (
            <button
              onClick={() => openAuthModal('signup')}
              className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-12 py-6 rounded-xl font-semibold text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25"
            >
              <span className="relative z-10 flex items-center">
                Get Started Now
                <ChevronRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-12 px-4 sm:px-6 lg:px-8 bg-black/50 border-t border-gray-800/50 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Shield className="h-6 w-6 text-cyan-400" />
              <span className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                CyberVault
              </span>
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                <Github className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                <Linkedin className="h-6 w-6" />
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800/50 text-center text-gray-400">
            <p>&copy; 2025 CyberVault. All rights reserved. Your data, your key, your security.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/folder" element={<Folder />} />
      <Route path="/folder/:folderId" element={<FileManager />} />
    </Routes>
  );
}

export default App;