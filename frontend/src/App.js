import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, FileText, Mail, MessageSquare, History, CreditCard, 
  Settings, LogOut, Menu, X, Check, ArrowRight, Zap, Crown,
  Copy, Trash2, ChevronDown, Sun, Moon, User, BarChart3,
  Loader2, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  const fetchUser = async (authToken) => {
    try {
      const res = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setUser(res.data);
    } catch (e) {
      localStorage.removeItem("token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await axios.post(`${API}/auth/register`, { name, email, password });
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// Loading Screen
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// Landing Page
const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-[#050505] noise-overlay">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-violet-500" />
            <span className="text-xl font-bold text-white">ContentGenius</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-white/80 hover:text-white" onClick={() => navigate("/login")} data-testid="login-btn">
              Connexion
            </Button>
            <Button className="bg-violet-600 hover:bg-violet-700 rounded-full px-6" onClick={() => navigate("/register")} data-testid="signup-btn">
              Commencer gratuitement
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 mb-6" data-testid="hero-badge">
              Propulsé par l'IA
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight" data-testid="hero-title">
              Générez du contenu
              <span className="text-gradient"> extraordinaire</span>
            </h1>
            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto" data-testid="hero-description">
              Articles, emails, posts sociaux — créez du contenu professionnel en quelques secondes grâce à l&apos;intelligence artificielle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-violet-600 hover:bg-violet-700 rounded-full px-8 h-14 text-lg glow-primary"
                onClick={() => navigate("/register")}
                data-testid="hero-cta-primary"
              >
                Essayer gratuitement <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-full px-8 h-14 text-lg border-white/20 text-white hover:bg-white/10"
                onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
                data-testid="hero-cta-secondary"
              >
                Voir les tarifs
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-20"
          >
            {[
              { value: "10K+", label: "Utilisateurs" },
              { value: "1M+", label: "Contenus générés" },
              { value: "99%", label: "Satisfaction" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-white/50">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-white/60 text-lg">Des outils puissants pour créer du contenu qui convertit</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: FileText, title: "Articles de blog", desc: "Rédigez des articles optimisés SEO en quelques clics", cost: "5 crédits" },
              { icon: Mail, title: "Emails marketing", desc: "Créez des séquences email qui convertissent", cost: "2 crédits" },
              { icon: MessageSquare, title: "Posts sociaux", desc: "Générez des posts viraux pour tous vos réseaux", cost: "1 crédit" }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white/5 border-white/10 hover:border-violet-500/50 transition-colors h-full" data-testid={`feature-card-${i}`}>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-violet-400" />
                    </div>
                    <CardTitle className="text-white">{feature.title}</CardTitle>
                    <CardDescription className="text-white/60">{feature.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                      {feature.cost}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Tarifs simples et transparents</h2>
            <p className="text-white/60 text-lg">Choisissez le plan qui correspond à vos besoins</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: "Free", price: "0€", period: "/mois", credits: "10", features: ["10 crédits/mois", "Génération basique", "Support email"], popular: false },
              { name: "Pro", price: "19€", period: "/mois", credits: "100", features: ["100 crédits/mois", "Tous les templates", "Support prioritaire", "Historique illimité"], popular: true },
              { name: "Enterprise", price: "49€", period: "/mois", credits: "500", features: ["500 crédits/mois", "API Access", "Support dédié", "Templates personnalisés"], popular: false }
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className={`relative h-full ${plan.popular ? 'border-violet-500 bg-violet-500/5' : 'bg-white/5 border-white/10'}`} data-testid={`pricing-card-${plan.name.toLowerCase()}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-violet-600 text-white">Populaire</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-5xl font-bold text-white">{plan.price}</span>
                      <span className="text-white/60">{plan.period}</span>
                    </div>
                    <p className="text-cyan-400 font-medium mt-2">{plan.credits} crédits</p>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-3 text-white/80">
                          <Check className="w-5 h-5 text-violet-400 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full rounded-full ${plan.popular ? 'bg-violet-600 hover:bg-violet-700' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                      onClick={() => navigate("/register")}
                      data-testid={`pricing-cta-${plan.name.toLowerCase()}`}
                    >
                      {plan.price === "0€" ? "Commencer gratuitement" : "Choisir ce plan"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-500" />
            <span className="text-white font-semibold">ContentGenius</span>
          </div>
          <p className="text-white/50 text-sm">© 2024 ContentGenius. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

// Auth Pages
const AuthPage = ({ mode }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/dashboard" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      toast.success(mode === "login" ? "Connexion réussie!" : "Compte créé avec succès!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6 noise-overlay">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-10 h-10 text-violet-500" />
            <span className="text-2xl font-bold text-white">ContentGenius</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="auth-title">
            {mode === "login" ? "Bon retour!" : "Créer un compte"}
          </h1>
          <p className="text-white/60">
            {mode === "login" ? "Connectez-vous pour continuer" : "Commencez gratuitement avec 10 crédits"}
          </p>
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="text-white/80 text-sm mb-2 block">Nom</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    required
                    data-testid="register-name-input"
                  />
                </div>
              )}
              <div>
                <label className="text-white/80 text-sm mb-2 block">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  required
                  data-testid="auth-email-input"
                />
              </div>
              <div>
                <label className="text-white/80 text-sm mb-2 block">Mot de passe</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  required
                  data-testid="auth-password-input"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-violet-600 hover:bg-violet-700 rounded-full h-12"
                disabled={loading}
                data-testid="auth-submit-btn"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === "login" ? "Se connecter" : "Créer mon compte")}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-white/60">
                {mode === "login" ? "Pas encore de compte?" : "Déjà un compte?"}{" "}
                <button
                  onClick={() => navigate(mode === "login" ? "/register" : "/login")}
                  className="text-violet-400 hover:text-violet-300 font-medium"
                  data-testid="auth-toggle-btn"
                >
                  {mode === "login" ? "S'inscrire" : "Se connecter"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

// Dashboard Layout
const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const navItems = [
    { icon: Zap, label: "Générer", path: "/dashboard" },
    { icon: History, label: "Historique", path: "/dashboard/history" },
    { icon: CreditCard, label: "Tarifs", path: "/pricing" },
    { icon: Settings, label: "Paramètres", path: "/dashboard/settings" }
  ];

  return (
    <div className={`min-h-screen ${isDark ? '' : 'light'}`}>
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-violet-500" />
              <span className="font-bold">ContentGenius</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </header>

        {/* Sidebar */}
        <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-card border-r border-border z-40 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <Sparkles className="w-8 h-8 text-violet-500" />
              <span className="text-xl font-bold">ContentGenius</span>
            </div>

            {/* Credits */}
            <Card className="bg-violet-500/10 border-violet-500/20 mb-6" data-testid="credits-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Crédits</span>
                  <Badge variant="secondary" className="bg-violet-500/20 text-violet-400">
                    {user?.plan?.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-3xl font-bold text-violet-500" data-testid="credits-count">{user?.credits || 0}</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-violet-400 hover:text-violet-300"
                  onClick={() => navigate("/pricing")}
                  data-testid="buy-credits-btn"
                >
                  <Plus className="w-4 h-4 mr-1" /> Acheter des crédits
                </Button>
              </CardContent>
            </Card>

            {/* Navigation */}
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-violet-500/10 text-violet-500'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* User Menu */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate" data-testid="user-name">{user?.name}</div>
                <div className="text-sm text-muted-foreground truncate">{user?.email}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsDark(!isDark)}
                className="flex-1"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => { logout(); navigate("/"); }}
                className="flex-1 text-destructive hover:text-destructive"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

// Generator Page
const GeneratorPage = () => {
  const { user, token, refreshUser } = useAuth();
  const [contentType, setContentType] = useState("article");
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [language, setLanguage] = useState("fr");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    if (token) fetchStats();
  }, [token]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Veuillez entrer une description");
      return;
    }
    
    const costs = { article: 5, email: 2, social: 1 };
    if (user.credits < costs[contentType]) {
      toast.error("Crédits insuffisants");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(`${API}/generate`, 
        { content_type: contentType, prompt, tone, language },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setResult(res.data);
      await refreshUser();
      await fetchStats();
      toast.success("Contenu généré avec succès!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.generated_content);
      toast.success("Copié dans le presse-papier!");
    }
  };

  const contentTypes = [
    { id: "article", icon: FileText, label: "Article", cost: 5 },
    { id: "email", icon: Mail, label: "Email", cost: 2 },
    { id: "social", icon: MessageSquare, label: "Post Social", cost: 1 }
  ];

  return (
    <div className="space-y-8" data-testid="generator-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Générer du contenu</h1>
        <p className="text-muted-foreground">Créez du contenu professionnel en quelques secondes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Crédits restants</div>
            <div className="text-2xl font-bold text-violet-500" data-testid="stats-credits">{user?.credits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Générations totales</div>
            <div className="text-2xl font-bold" data-testid="stats-total">{stats?.total_generations || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Articles</div>
            <div className="text-2xl font-bold">{stats?.by_type?.article || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Emails</div>
            <div className="text-2xl font-bold">{stats?.by_type?.email || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Generator Form */}
        <Card>
          <CardHeader>
            <CardTitle>Nouveau contenu</CardTitle>
            <CardDescription>Sélectionnez le type et décrivez ce que vous voulez</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Content Type */}
            <div>
              <label className="text-sm font-medium mb-3 block">Type de contenu</label>
              <div className="grid grid-cols-3 gap-3">
                {contentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setContentType(type.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      contentType === type.id
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-border hover:border-violet-500/50'
                    }`}
                    data-testid={`content-type-${type.id}`}
                  >
                    <type.icon className={`w-6 h-6 mx-auto mb-2 ${contentType === type.id ? 'text-violet-500' : 'text-muted-foreground'}`} />
                    <div className="text-sm font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.cost} crédits</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Décrivez le contenu que vous souhaitez générer..."
                className="min-h-[120px] resize-none"
                data-testid="prompt-input"
              />
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Ton</label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger data-testid="tone-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professionnel</SelectItem>
                    <SelectItem value="casual">Décontracté</SelectItem>
                    <SelectItem value="friendly">Amical</SelectItem>
                    <SelectItem value="formal">Formel</SelectItem>
                    <SelectItem value="humorous">Humoristique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Langue</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger data-testid="language-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={loading || !prompt.trim()}
              className="w-full bg-violet-600 hover:bg-violet-700 h-12 rounded-full"
              data-testid="generate-btn"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Génération en cours...</>
              ) : (
                <><Sparkles className="w-5 h-5 mr-2" /> Générer ({contentTypes.find(t => t.id === contentType)?.cost} crédits)</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader>
            <CardTitle>Résultat</CardTitle>
            <CardDescription>Votre contenu généré apparaîtra ici</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{result.content_type}</Badge>
                  <Button variant="ghost" size="sm" onClick={copyToClipboard} data-testid="copy-btn">
                    <Copy className="w-4 h-4 mr-1" /> Copier
                  </Button>
                </div>
                <ScrollArea className="h-[400px] rounded-lg border border-border p-4">
                  <div className="whitespace-pre-wrap mono text-sm" data-testid="generated-content">
                    {result.generated_content}
                  </div>
                </ScrollArea>
                <div className="text-sm text-muted-foreground">
                  {result.credits_used} crédits utilisés
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground" data-testid="empty-result">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Votre contenu généré apparaîtra ici</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// History Page
const HistoryPage = () => {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API}/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data);
      } catch (e) {
        toast.error("Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchHistory();
  }, [token]);

  const deleteGeneration = async (id) => {
    try {
      await axios.delete(`${API}/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(history.filter(h => h.id !== id));
      toast.success("Supprimé");
    } catch (e) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const copyContent = (content) => {
    navigator.clipboard.writeText(content);
    toast.success("Copié!");
  };

  const typeIcons = {
    article: FileText,
    email: Mail,
    social: MessageSquare
  };

  return (
    <div className="space-y-8" data-testid="history-page">
      <div>
        <h1 className="text-3xl font-bold mb-2">Historique</h1>
        <p className="text-muted-foreground">Retrouvez toutes vos générations précédentes</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : history.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Aucune génération pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
            const Icon = typeIcons[item.content_type] || FileText;
            return (
              <Card key={item.id} data-testid={`history-item-${item.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-violet-500" />
                      </div>
                      <div>
                        <div className="font-medium capitalize">{item.content_type}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{item.credits_used} crédits</Badge>
                      <Button variant="ghost" size="icon" onClick={() => copyContent(item.generated_content)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteGeneration(item.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 mb-3">
                    <div className="text-sm text-muted-foreground mb-1">Prompt:</div>
                    <div className="text-sm">{item.prompt}</div>
                  </div>
                  <ScrollArea className="h-[150px]">
                    <div className="text-sm whitespace-pre-wrap mono">{item.generated_content}</div>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Pricing Page (Dashboard)
const PricingPage = () => {
  const { user, token, refreshUser } = useAuth();
  const [loading, setLoading] = useState(null);
  const navigate = useNavigate();

  const plans = [
    { id: "free", name: "Free", price: 0, credits: 10, features: ["10 crédits/mois", "Génération basique", "Support email"] },
    { id: "pro", name: "Pro", price: 19, credits: 100, features: ["100 crédits/mois", "Tous les templates", "Support prioritaire", "Historique illimité"], popular: true },
    { id: "enterprise", name: "Enterprise", price: 49, credits: 500, features: ["500 crédits/mois", "API Access", "Support dédié", "Templates personnalisés"] }
  ];

  const creditPackages = [
    { id: "small", credits: 20, price: 5 },
    { id: "medium", credits: 50, price: 10 },
    { id: "large", credits: 150, price: 25 }
  ];

  const handleCheckout = async (packageType) => {
    setLoading(packageType);
    try {
      const res = await axios.post(`${API}/payments/checkout`,
        { package_type: packageType, origin_url: window.location.origin },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erreur lors du paiement");
      setLoading(null);
    }
  };

  return (
    <div className="space-y-12" data-testid="pricing-page">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Tarifs</h1>
        <p className="text-muted-foreground">Choisissez le plan qui vous convient</p>
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Plans d&apos;abonnement</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.popular ? 'border-violet-500 relative' : ''} data-testid={`plan-${plan.id}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-violet-600">Populaire</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle>{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
                <p className="text-violet-500 font-medium">{plan.credits} crédits</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-violet-500" />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full rounded-full ${plan.popular ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  disabled={loading === plan.id || user?.plan === plan.id || plan.price === 0}
                  onClick={() => handleCheckout(plan.id)}
                  data-testid={`plan-btn-${plan.id}`}
                >
                  {loading === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                   user?.plan === plan.id ? 'Plan actuel' : 
                   plan.price === 0 ? 'Plan gratuit' : 'Souscrire'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Credit Packages */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Acheter des crédits</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {creditPackages.map((pkg) => (
            <Card key={pkg.id} data-testid={`credits-pkg-${pkg.id}`}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-cyan-500" />
                </div>
                <div className="text-3xl font-bold mb-2">{pkg.credits}</div>
                <div className="text-muted-foreground mb-4">crédits</div>
                <div className="text-2xl font-bold text-violet-500 mb-4">{pkg.price}€</div>
                <Button
                  className="w-full rounded-full"
                  variant="outline"
                  disabled={loading === pkg.id}
                  onClick={() => handleCheckout(pkg.id)}
                  data-testid={`credits-btn-${pkg.id}`}
                >
                  {loading === pkg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Acheter'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// Payment Success
const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const { token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const pollPaymentStatus = async (attempts = 0) => {
      if (attempts >= 5) {
        setStatus('timeout');
        return;
      }

      try {
        const res = await axios.get(`${API}/payments/status/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.payment_status === 'paid') {
          setStatus('success');
          await refreshUser();
        } else if (res.data.status === 'expired') {
          setStatus('expired');
        } else {
          setTimeout(() => pollPaymentStatus(attempts + 1), 2000);
        }
      } catch (e) {
        setStatus('error');
      }
    };

    if (sessionId && token) {
      pollPaymentStatus();
    }
  }, [sessionId, token, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-md w-full" data-testid="payment-result">
        <CardContent className="pt-6 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 animate-spin text-violet-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Vérification du paiement...</h2>
              <p className="text-muted-foreground">Veuillez patienter</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Paiement réussi!</h2>
              <p className="text-muted-foreground mb-6">Vos crédits ont été ajoutés à votre compte</p>
              <Button onClick={() => navigate('/dashboard')} className="bg-violet-600 hover:bg-violet-700 rounded-full">
                Retour au dashboard
              </Button>
            </>
          )}
          {(status === 'error' || status === 'timeout' || status === 'expired') && (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold mb-2">Erreur de paiement</h2>
              <p className="text-muted-foreground mb-6">Une erreur est survenue. Contactez le support si nécessaire.</p>
              <Button onClick={() => navigate('/pricing')} variant="outline" className="rounded-full">
                Retour aux tarifs
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Settings Page
const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8" data-testid="settings-page">
      <div>
        <h1 className="text-3xl font-bold mb-2">Paramètres</h1>
        <p className="text-muted-foreground">Gérez votre compte</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Nom</label>
            <div className="font-medium" data-testid="settings-name">{user?.name}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <div className="font-medium" data-testid="settings-email">{user?.email}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Plan</label>
            <div className="font-medium capitalize" data-testid="settings-plan">{user?.plan}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Crédits</label>
            <div className="font-medium" data-testid="settings-credits">{user?.credits}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Membre depuis</label>
            <div className="font-medium">
              {user?.created_at && new Date(user.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main App
function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><GeneratorPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/history" element={<ProtectedRoute><DashboardLayout><HistoryPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardLayout><SettingsPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/pricing" element={<ProtectedRoute><DashboardLayout><PricingPage /></DashboardLayout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
