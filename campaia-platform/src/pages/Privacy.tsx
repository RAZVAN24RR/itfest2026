import { Shield, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { nanoid } from "nanoid";
import { Link } from 'react-router-dom';

export default function Privacy() {
    const languageContext = useLanguage();
    const language = languageContext ? languageContext.language : 'ro';

    const content = {
        ro: {
            headerTitle: "Politica de Confidențialitate",
            headerSub: "Ultima actualizare: 14 Martie 2026",
            backLink: "Înapoi Acasă",
            sections: [
                {
                    title: "1. Informațiile pe care le colectăm",
                    body: "Pentru a furniza serviciul Campaia, colectăm: (a) Date de Campanie: Link-uri țintă (URL), texte publicitare, imagini și preferințe de audiență pe care le introduceți; (b) Date Tehnice: Adresa IP, tipul browser-ului; (c) Date de Contact: Adresa de email furnizată la înscriere."
                },
                {
                    title: "2. Cum utilizăm informațiile",
                    body: "Folosim datele dumneavoastră strict pentru: a genera și publica campaniile pe contul TikTok @CampaiaAi, a vă furniza rapoarte de performanță și a asigura securitatea platformei."
                },
                {
                    title: "3. Partajarea Datelor cu TikTok",
                    body: "Aceasta este o parte esențială a serviciului: Pentru a rula reclamele, materialele campaniei (video, text, link-uri) sunt încărcate pe platforma TikTok Advertising prin intermediul contului nostru. Prin utilizarea serviciului, înțelegeți că acest conținut specific este partajat cu TikTok."
                },
                {
                    title: "4. Stocare și Infrastructură",
                    body: "Datele dumneavoastră sunt stocate securizat folosind furnizori de cloud de top (AWS), respectând standardele industriei pentru criptare (SSL/TLS)."
                },
                {
                    title: "5. Nu vindem datele",
                    body: "Campaia nu vinde datele dumneavoastră personale către terți. Modelul nostru de business se bazează pe servicii de publicitate, nu pe monetizarea datelor utilizatorilor."
                },
                {
                    title: "6. Drepturile Dumneavoastră",
                    body: "Aveți dreptul de a solicita accesul, rectificarea sau ștergerea datelor dumneavoastră personale din sistemele noastre."
                }
            ]
        },
        en: {
            headerTitle: "Privacy Policy",
            headerSub: "Last Updated: March 14, 2026",
            backLink: "Back to Home",
            sections: [
                {
                    title: "1. Information We Collect",
                    body: "To provide the Campaia service, we collect: (a) Campaign Data: Target URLs, ad copy, images, and audience preferences you submit; (b) Technical Data: IP address, browser type; (c) Contact Data: Email address provided during sign-up."
                },
                {
                    title: "2. How We Use Your Information",
                    body: "We use your data strictly to: generate and publish your campaigns on the @CampaiaAi TikTok account, provide performance analytics, and ensure platform security."
                },
                {
                    title: "3. Data Sharing with TikTok",
                    body: "This is a core part of the service: To run ads, campaign materials (videos, text, links) are uploaded to the TikTok Advertising platform via our account. By using the service, you acknowledge that this specific content is shared with TikTok."
                },
                {
                    title: "4. Storage & Infrastructure",
                    body: "Your data is stored securely using top-tier cloud providers (AWS), adhering to industry standards for encryption (SSL/TLS)."
                },
                {
                    title: "5. We Do Not Sell Data",
                    body: "Campaia does not sell your personal data to third parties. Our business model is based on advertising services, not on monetizing user data."
                },
                {
                    title: "6. Your Rights",
                    body: "You have the right to request access to, rectification of, or deletion of your personal data from our systems."
                }
            ]
        }
    };

    const text = content[language as keyof typeof content] || content.en;

    return (
        <div className="min-h-screen bg-white text-slate-500 font-sans selection:bg-purple-100 overflow-x-hidden flex flex-col">
            <Navbar />

            {/* Background Gradient */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#f0f4ff_100%)]"></div>

            <main className="flex-grow relative pt-24 pb-20 sm:pt-32">
                <div className="mx-auto max-w-4xl px-6 lg:px-8">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <div className="mb-6 flex justify-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                                <Shield size={12} />
                                <span>Security</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-blue-950 sm:text-5xl mb-4">
                            {text.headerTitle}
                        </h1>
                        <p className="text-lg text-slate-500 font-medium">
                            {text.headerSub}
                        </p>
                        <div className="mt-8">
                            <Link to="/" className="text-purple-600 hover:text-purple-700 font-bold text-sm inline-flex items-center gap-1 transition-colors">
                                <ArrowLeft size={16} />
                                {text.backLink}
                            </Link>
                        </div>
                    </motion.div>

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="space-y-8"
                    >
                        {text.sections.map((section) => (
                            <div key={nanoid()} className="bg-white/80 backdrop-blur-sm p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                                <h3 className="text-xl font-bold text-blue-950 mb-4">
                                    {section.title}
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {section.body}
                                </p>
                            </div>
                        ))}
                    </motion.div>

                    {/* Contact Info */}
                    <div className="mt-12 text-center">
                        <p className="text-slate-500 text-sm">
                            Questions? Contact us at <a href="mailto:contact@campaia.online" className="text-purple-600 font-bold hover:underline">pasaranprojects@outlook.com</a>
                        </p>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}