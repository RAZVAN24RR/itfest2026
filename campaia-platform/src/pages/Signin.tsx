import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Lock } from 'lucide-react';
import Footer from "../components/Footer.tsx";
import { useLanguage } from "../context/LanguageContext.tsx";
import { useGoogleLogin } from '@react-oauth/google';
import Navbar from "../components/Navbar.tsx";
import { motion } from 'framer-motion';
import { useUser, type UserData } from "../context/UserContext.tsx";
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { useEffect } from 'react';

export default function Signin() {
    const navigate = useNavigate();
    const { setUser, user, isLoading } = useUser();

    useEffect(() => {
        if (!isLoading && user) {
            navigate('/dashboard');
        }
    }, [user, isLoading, navigate]);
    const languageContext = useLanguage();
    const language = languageContext ? languageContext.language : 'en';

    const content = {
        ro: {
            back: "Înapoi la Home",
            title: "Bine ai venit",
            subtitle: "Autentificare",
            w: "Platforma este în modul Public Beta.",
            r: "Conectează-te pentru a accesa dashboard-ul.",
            googleBtn: "Continuă cu Google",
            loginError: "Autentificare eșuată. Încearcă din nou.",
            secure: "Securizat prin Google"
        },
        en: {
            back: "Back Home",
            title: "Welcome",
            subtitle: "Sign In",
            w: "Platform is currently in Public Beta.",
            r: "Connect to access your dashboard.",
            googleBtn: "Continue with Google",
            loginError: "Login failed. Please try again.",
            secure: "Secured by Google"
        }
    }
    const text = content[language as keyof typeof content] || content.en;

    const loginWeb = useGoogleLogin({
        onSuccess: async (codeResponse) => {
            console.log("Web Login Success:", codeResponse);
            try {
                // Send token to backend for validation and JWT creation
                await handleGoogleAuth(codeResponse.access_token);
            } catch (error) {
                console.error("Web Login Error:", error);
                alert(text.loginError);
            }
        },
        onError: (error) => {
            console.error("Web Login Failed:", error);
            alert(text.loginError);
        }
    });

    const loginNative = async () => {
        try {
            await GoogleAuth.initialize();
            const googleUser = await GoogleAuth.signIn();
            console.log("Native Login Success:", googleUser);

            // For native, we need to get the access token differently
            // The authentication object contains the access token
            if (googleUser.authentication?.accessToken) {
                await handleGoogleAuth(googleUser.authentication.accessToken);
            } else {
                // Fallback: use the ID directly (less secure, for testing)
                handleLoginSuccess({
                    name: googleUser.name || googleUser.givenName || "User",
                    email: googleUser.email,
                    picture: googleUser.imageUrl || '',
                    sub: googleUser.id
                });
            }
        } catch (error) {
            console.error("Native Login Error:", error);
            alert(text.loginError);
        }
    };

    const handleGoogleAuth = async (accessToken: string) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/api/v1/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: accessToken }),
            });

            if (!response.ok) {
                throw new Error('Authentication failed');
            }

            const data = await response.json();
            console.log("Backend Auth Response:", data);

            // Set user with JWT token
            setUser({
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                picture: data.user.picture || '',
                sub: data.user.sub,
            }, data.access_token);

            navigate('/dashboard');
        } catch (error) {
            console.error("Backend Auth Error:", error);
            throw error;
        }
    };

    const handleLoginSuccess = (userData: UserData) => {
        console.log("Final User Data:", userData);
        setUser(userData);
        navigate('/dashboard');
    };

    const handleLoginClick = () => {
        if (Capacitor.isNativePlatform()) {
            loginNative();
        } else {
            loginWeb();
        }
    };


    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-slate-600">
            <Navbar />
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-50/60 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-50/40 rounded-full blur-3xl -z-10"></div>

                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-white shadow-2xl shadow-blue-900/5 rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 opacity-20"></div>

                    <div className="flex justify-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl flex items-center justify-center border border-purple-100/50 shadow-inner relative group">
                            <Lock className="w-8 h-8 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
                            <div className="absolute -top-2 -right-2 bg-white p-1.5 rounded-full shadow-sm border border-slate-50">
                                <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <div className="text-center space-y-3 mb-10">
                        <div className="inline-block px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-600 text-[10px] font-bold uppercase tracking-widest mb-2">
                            {text.subtitle}
                        </div>
                        <h1 className="text-4xl font-extrabold text-blue-950 tracking-tight">
                            {text.title}
                        </h1>
                        <p className="text-base text-slate-500 font-medium leading-relaxed">
                            {text.w} <br className="hidden sm:block" /> {text.r}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <button
                            type={'button'}
                            onClick={handleLoginClick}
                            className="w-full relative group flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-purple-300 text-slate-700 font-bold py-4 px-6 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
                        >
                            <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <title>Google logo</title>
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>

                            <span className="text-lg">{text.googleBtn}</span>

                            <div className="absolute right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 text-purple-500">
                                <ArrowLeft className="rotate-180 w-5 h-5" />
                            </div>
                        </button>

                        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium uppercase tracking-wider">
                            <Lock size={10} />
                            {text.secure}
                        </div>
                    </div>
                    <div className="pt-8 mt-8 border-t border-slate-100 text-center">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-purple-600 transition-colors group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            {text.back}
                        </Link>
                    </div>
                </motion.div>
            </div>
            <Footer />
        </div>
    );
}