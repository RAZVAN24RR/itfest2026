import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Wand2, CheckCircle2, Sparkles, TrendingUp, Zap, Play } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer'
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { nanoid } from "nanoid";
import { useEffect } from 'react';


export default function LandingPage() {
    const languageContext = useLanguage();
    const { user, isLoading } = useUser();
    const navigate = useNavigate();
    const language = languageContext ? languageContext.language : 'ro';

    useEffect(() => {
        if (!isLoading && user) {
            navigate('/dashboard');
        }
    }, [user, isLoading, navigate]);

    const content = {
        ro: {
            badge: "Public Beta Active",
            title1: "TikTok Ads,",
            title2: "Simplificat.",
            desc: "Nu mai pierde ore scriind scripturi. Platforma noastră generează, optimizează și pregătește campaniile tale pentru viralitate.",
            ctaPrimary: "Începe Acum",
            ctaSecondary: "Despre Concept",
            workflowTitle: "Flux de Lucru",
            workflowHeading: "De la idee la viral",
            workflowSub: "Am eliminat complexitatea. Tu vii cu inițiativa, noi venim cu strategia.",
            step1Title: "1. Introduci Detaliile",
            step1Desc: "Setează bugetul și lipește link-ul inițiativei tale. Simplu.",
            step2Title: "2. Generare AI",
            step2Desc: "Algoritmul nostru scrie scenariul perfect bazat pe trenduri.",
            step3Title: "3. Publicare Instantă",
            step3Desc: "Aprobă conținutul cu un click direct către @CampaiaAi.",
            finalCtaTitle: "Pregătit să testezi viitorul?",
            finalCtaDesc: "Fără setări complicate. Doar rezultate rapide.",
            finalCtaButton: "Începe Acum",
            genScript: "Generare Script..."
        },
        en: {
            badge: "Public Beta Live",
            title1: "TikTok Ads,",
            title2: "Simplified.",
            desc: "Stop wasting hours writing scripts. Our platform generates, optimizes, and preps your campaigns for virality.",
            ctaPrimary: "Get Started",
            ctaSecondary: "About Concept",
            workflowTitle: "Workflow",
            workflowHeading: "From idea to viral",
            workflowSub: "We removed the complexity. You bring the product, we bring the strategy.",
            step1Title: "1. Input Details",
            step1Desc: "Set your budget and paste your product link. Simple.",
            step2Title: "2. AI Generation",
            step2Desc: "Our algorithm writes the perfect script based on trends.",
            step3Title: "3. Instant Publish",
            step3Desc: "Approve content with one click to @CampaiaAi.",
            finalCtaTitle: "Ready to test the future?",
            finalCtaDesc: "No complex settings. Just fast results.",
            finalCtaButton: "Start Now",
            genScript: "Generating Script..."
        }
    };

    const text = content[language as keyof typeof content] || content.en;

    return (
        <div className="min-h-screen bg-white text-slate-500 font-sans selection:bg-purple-100 overflow-x-hidden">
            <Navbar />
            <div className="fixed inset-0 -z-10 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#f0f4ff_100%)]"></div>
            <section className="relative pt-20 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mx-auto max-w-4xl text-center flex flex-col items-center"
                    >
                        <div className="mb-8 flex justify-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-600 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                                <Sparkles size={12} className="fill-purple-600" />
                                <span>{text.badge}</span>
                            </div>
                        </div>
                        <h1 className="text-5xl font-extrabold tracking-tight text-blue-950 sm:text-7xl mb-8 leading-[1.1]">
                            {text.title1} <br className="hidden sm:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-violet-600">
                                {text.title2}
                            </span>
                        </h1>
                        <p className="mt-2 text-lg leading-8 text-slate-600 max-w-2xl mx-auto font-medium">
                            {text.desc}
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                            <Link
                                to="/signin"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-10 py-4 text-lg font-bold !text-white shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all duration-200"
                            >
                                {text.ctaPrimary}
                                <ArrowRight className="h-5 w-5" />
                            </Link>

                            <Link
                                to="/concept"
                                className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-purple-700 bg-white border border-purple-100 rounded-full hover:bg-purple-50 hover:border-purple-200 transition-all shadow-sm"
                            >
                                {text.ctaSecondary}
                            </Link>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mt-20 sm:mt-32 flex justify-center relative"
                    >
                        {/* Glow Effect */}
                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-100/30 rounded-full blur-[120px] -z-10"></div>

                        <div className="relative w-full max-w-4xl px-4 sm:px-0">
                            <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-[3rem] p-4 shadow-[0_50px_100px_-20px_rgba(100,80,200,0.15)] border border-purple-200/50">
                                <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100">
                                    {/* Mockup Top Bar */}
                                    <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <div className="h-3 w-3 rounded-full bg-slate-200"></div>
                                            <div className="h-3 w-3 rounded-full bg-slate-200"></div>
                                            <div className="h-3 w-3 rounded-full bg-slate-200"></div>
                                        </div>
                                        <div className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-400 tracking-widest uppercase">
                                            AI Creative Studio
                                        </div>
                                    </div>

                                    {/* Mockup Content */}
                                    <div className="p-10 md:p-14 grid md:grid-cols-5 gap-10 lg:gap-16">
                                        <div className="md:col-span-3 space-y-10">
                                            <div className="flex items-center gap-6">
                                                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-purple-500/30">
                                                    <Wand2 size={36} className="text-purple-400" />
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="h-5 w-48 bg-purple-600 rounded-full"></div>
                                                    <div className="h-3.5 w-32 bg-slate-200 rounded-full"></div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                                                <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                                                <div className="h-2 w-2/3 bg-slate-100 rounded-full"></div>
                                            </div>

                                            <div className="p-8 bg-purple-50/50 border-2 border-dashed border-purple-100 rounded-[2rem] space-y-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">AI Result #01</span>
                                                    <Sparkles size={14} className="text-purple-500" />
                                                </div>
                                                <div className="h-3 w-full bg-purple-100/50 rounded-full"></div>
                                                <div className="h-3 w-5/6 bg-purple-100/50 rounded-full"></div>
                                                <div className="h-3 w-4/6 bg-purple-100/50 rounded-full"></div>
                                            </div>

                                            <div className="flex items-center gap-4 pt-4">
                                                <div className="h-14 w-40 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-500/20">
                                                    Deploy Ad
                                                </div>
                                                <div className="h-14 w-14 border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-300">
                                                    <TrendingUp size={24} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 flex flex-col justify-center">
                                            <div className="relative aspect-[9/16] w-full bg-gradient-to-br from-purple-50 to-indigo-100 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden group">
                                                <div className="absolute inset-0 bg-gradient-to-b from-purple-100/50 to-indigo-200/50" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-purple-500/30 animate-pulse">
                                                        <Play size={24} fill="white" />
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-8 left-6 right-6 space-y-3">
                                                    <div className="h-2 w-3/4 bg-purple-300/40 rounded-full"></div>
                                                    <div className="h-2 w-1/2 bg-purple-200/30 rounded-full"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Stat Chips */}
                                <div className="absolute -top-6 -right-10 hidden lg:flex bg-white border border-slate-100 shadow-2xl p-5 rounded-[2rem] items-center gap-4 animate-bounce duration-[4000ms]">
                                    <div className="bg-green-500 h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversion</p>
                                        <p className="text-xl font-black text-slate-950">+124%</p>
                                    </div>
                                </div>
                                <div className="absolute -bottom-6 -left-10 hidden lg:flex bg-white border border-purple-100 shadow-2xl p-5 rounded-[2rem] items-center gap-4 animate-bounce duration-[5000ms]">
                                    <div className="bg-purple-600 h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
                                        <Zap size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Speed</p>
                                        <p className="text-xl font-black text-purple-700">0.4s</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
            <section className="py-24 relative bg-white">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <h2 className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-3">{text.workflowTitle}</h2>
                        <h3 className="text-4xl font-extrabold text-blue-950 tracking-tight">
                            {text.workflowHeading}
                        </h3>
                        <p className="mt-4 text-lg text-slate-500">
                            {text.workflowSub}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {[
                            { icon: Wand2, title: text.step1Title, desc: text.step1Desc, color: "text-purple-600", bg: "bg-purple-50" },
                            { icon: Sparkles, title: text.step2Title, desc: text.step2Desc, color: "text-indigo-600", bg: "bg-indigo-50" },
                            { icon: CheckCircle2, title: text.step3Title, desc: text.step3Desc, color: "text-violet-600", bg: "bg-violet-50" }
                        ].map((step) => (
                            <div key={nanoid()} className="flex flex-col items-center text-center relative group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300">
                                <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${step.bg} ${step.color} group-hover:scale-110 transition-transform`}>
                                    <step.icon className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold text-blue-950 mb-3">{step.title}</h3>
                                <p className="text-base text-slate-500 leading-relaxed">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            <section className="py-20 px-6">
                <div className="mx-auto max-w-4xl bg-purple-50/50 border border-purple-100 rounded-[3rem] px-6 py-20 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent opacity-60"></div>

                    <h2 className="text-4xl font-extrabold tracking-tight text-blue-950 mb-6 relative z-10">
                        {text.finalCtaTitle}
                    </h2>
                    <p className="mx-auto max-w-lg text-lg text-slate-600 mb-10 relative z-10 font-medium">
                        {text.finalCtaDesc}
                    </p>
                    <div className="relative z-10">
                        <Link
                            to="/signin"
                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-12 py-5 text-lg font-bold !text-white shadow-xl shadow-purple-600/20 hover:shadow-purple-600/40 hover:scale-105 transition-all duration-200"
                        >
                            {text.finalCtaButton}
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
}