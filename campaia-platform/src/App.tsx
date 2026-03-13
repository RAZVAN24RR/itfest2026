import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Privacy from './pages/Privacy.tsx';
import { LanguageProvider } from './context/LanguageContext';
import { UserProvider } from './context/UserContext';
import Terms from "./pages/Terms.tsx";
import Signin from "./pages/Signin.tsx";
import Signup from "./pages/Signup.tsx";
import Concept from "./pages/ConceptPage.tsx";
import PaymentSuccess from "./pages/PaymentSuccess.tsx";
import PaymentCancel from "./pages/PaymentCancel.tsx";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { SplashScreen } from '@capacitor/splash-screen';

function ScrollToTop() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    return null;
}

const GOOGLE_CLIENT_ID = "557714121600-r6jh90ghjj22uc1qj6kibqf5cjpfmqak.apps.googleusercontent.com";

function App() {
    useEffect(() => {
        SplashScreen.hide();
    }, []);
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <LanguageProvider>
                <UserProvider>
                    <div className="mobile-fixed-layout">
                        <div className="scrollable-content font-sans bg-white">
                            <Router>
                                <ScrollToTop />
                                <Routes>
                                    <Route path="/" element={<LandingPage />} />
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/privacy" element={<Privacy />} />
                                    <Route path="/terms" element={<Terms />} />
                                    <Route path="/signin" element={<Signin />} />
                                    <Route path="/signup" element={<Signup />} />
                                    <Route path="/concept" element={<Concept />} />
                                    <Route path="/payment/success" element={<PaymentSuccess />} />
                                    <Route path="/payment/cancel" element={<PaymentCancel />} />
                                </Routes>
                            </Router>
                        </div>
                    </div>
                </UserProvider>
            </LanguageProvider>
        </GoogleOAuthProvider>
    );
}

export default App;