import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { Lightbulb, Target, BrainCircuit, Users, Zap } from 'lucide-react';
import { nanoid } from "nanoid";

export default function Concept() {
    const { language } = useLanguage();

    const content = {
        ro: {
            heroTitle: "Viziunea Campaia",
            heroSub: "Tehnologie care transformă modul în care comunitățile comunică.",
            conceptTitle: "Conceptul",
            conceptDesc: "Campaia este o platformă care sprijină inițiativele comunitare pe TikTok. Prin integrarea Inteligenței Artificiale, transformăm ideile asociațiilor într-o campanie completă. Sistemul nostru analizează punctele forte ale proiectului, tendințele actuale și nevoile publicului pentru a genera mesaje optimizate pentru impact social, eliminând orele de brainstorming și editare manuală.",
            missionTitle: "Misiunea Noastră",
            missionDesc: "Misiunea noastră este să democratizăm accesul la vizibilitate digitală de înaltă performanță pentru ONG-uri. Credem că orice inițiativă comunitară merită instrumente de nivel enterprise. Ne propunem să egalizăm șansele, oferind asociațiilor puterea de a concura pe atenție cu marile branduri prin conținut generat inteligent, rapid și eficient din punct de vedere al costurilor.",
            stat1: "Accesibilitate",
            stat1Desc: "Impact pro, fără agenții.",
            stat2: "Viteză",
            stat2Desc: "De la idee la viral în secunde.",
            stat3: "Inovație",
            stat3Desc: "AI antrenat pe trenduri reale."
        },
        en: {
            heroTitle: "The Campaia Vision",
            heroSub: "Technology that transforms how communities communicate.",
            conceptTitle: "The Concept",
            conceptDesc: "Campaia is a platform that empowers community initiatives on TikTok. By integrating Artificial Intelligence, we turn association's ideas into a full-fledged campaign. Our system analyzes project strengths, current trends, and audience needs to generate impact-optimized scripts, eliminating hours of brainstorming and manual editing.",
            missionTitle: "Our Mission",
            missionDesc: "Our mission is to democratize access to high-performance digital visibility for NGOs. We believe every community initiative deserves enterprise-level tools. We aim to level the playing field, giving associations the power to compete for attention with big brands through intelligently generated, fast, and cost-effective content.",
            stat1: "Accessibility",
            stat1Desc: "Pro impact, no agencies.",
            stat2: "Speed",
            stat2Desc: "From idea to viral in seconds.",
            stat3: "Innovation",
            stat3Desc: "AI trained on real trends."
        }
    };

    const t = language === 'ro' ? content.ro : content.en;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <div className="min-h-screen bg-white text-slate-600 font-sans selection:bg-purple-100 overflow-x-hidden">
            <Navbar />

            <div className="fixed inset-0 -z-10 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#f0f4ff_100%)]"></div>

            <main className="pt-24 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-20">
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl sm:text-5xl font-extrabold text-blue-950 mb-4 tracking-tight"
                        >
                            {t.heroTitle}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-slate-500 max-w-2xl mx-auto"
                        >
                            {t.heroSub}
                        </motion.p>
                    </div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20"
                    >
                        <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 hover:shadow-purple-500/10 transition-all duration-300">
                            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                                <BrainCircuit size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-blue-950 mb-4">{t.conceptTitle}</h2>
                            <p className="text-slate-600 leading-relaxed">
                                {t.conceptDesc}
                            </p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-[2.5rem] shadow-xl shadow-purple-600/20 text-white">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-6 backdrop-blur-sm">
                                <Target size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">{t.missionTitle}</h2>
                            <p className="text-purple-50 leading-relaxed opacity-90">
                                {t.missionDesc}
                            </p>
                        </motion.div>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: Users, title: t.stat1, desc: t.stat1Desc },
                            { icon: Zap, title: t.stat2, desc: t.stat2Desc }, // Changed from Lightbulb to Zap for consistency
                            { icon: Lightbulb, title: t.stat3, desc: t.stat3Desc }
                        ].map((item, index) => (
                            <motion.div
                                key={nanoid()}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4 + (index * 0.1) }}
                                className="flex flex-col items-center text-center p-6 rounded-3xl bg-slate-50 border border-slate-100"
                            >
                                <item.icon className="text-purple-500 mb-3" size={28} />
                                <h3 className="font-bold text-blue-950 text-lg">{item.title}</h3>
                                <p className="text-sm text-slate-500">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}