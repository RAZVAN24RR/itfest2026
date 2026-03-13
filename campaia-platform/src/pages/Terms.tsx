import { FileText, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { nanoid } from "nanoid";
import { Link } from 'react-router-dom';

export default function Terms() {
    const languageContext = useLanguage();
    const language = languageContext ? languageContext.language : 'ro';

    const content = {
        ro: {
            headerTitle: "Termeni și Condiții",
            headerSub: "Ultima actualizare: 29 Noiembrie 2025",
            backLink: "Înapoi Acasă",
            sections: [
                {
                    title: "1. Introducere și Acceptare",
                    body: "Bine ați venit la Campaia (accesibil la https://campaia.online). Prin accesarea sau utilizarea platformei noastre, sunteți de acord să respectați acești Termeni și Condiții. Dacă nu sunteți de acord cu orice parte a termenilor, nu aveți dreptul să accesați serviciul."
                },
                {
                    title: "2. Modelul de Publicare (Publisher Model)",
                    body: "Campaia este o platformă de automatizare marketing. Este crucial să înțelegeți că materialele publicitare create pe platforma noastră sunt publicate și distribuite exclusiv prin intermediul contului nostru oficial de TikTok (@CampaiaAi). Dumneavoastră, în calitate de client, nu vă conectați propriul cont de publicitate, ci achiziționați spațiu și servicii creative pe infrastructura noastră."
                },
                {
                    title: "3. Proprietate Intelectuală și Licențiere",
                    body: "Prin trimiterea de conținut (link-uri de produs, descrieri, imagini) către Campaia, ne acordați o licență neexclusivă, globală și gratuită de a utiliza, reproduce și afișa acest conținut pe contul @CampaiaAi strict în scopul derulării campaniei dumneavoastră."
                },
                {
                    title: "4. Plăți și Bugete",
                    body: "Sumele plătite către Campaia reprezintă bugetul de publicitate și comisionul de serviciu pentru tehnologie. Campaia gestionează licitarea (bidding) și distribuția bugetului pe platforma TikTok Ads în numele dumneavoastră."
                },
                {
                    title: "5. Limitarea Răspunderii",
                    body: "Deși utilizăm AI pentru a optimiza performanța, Campaia nu garantează rezultate specifice (număr fix de vânzări, vizualizări sau viralitate), acestea depinzând de algoritmii terți ai platformei TikTok. Serviciul este furnizat 'ca atare' (as is)."
                },
                {
                    title: "6. Disclaimer Beta",
                    body: "Vă rugăm să rețineți că Campaia este în stadiul de Public Beta. Funcționalitățile se pot modifica, iar serviciul poate experimenta întreruperi temporare."
                }
            ]
        },
        en: {
            headerTitle: "Terms of Service",
            headerSub: "Last Updated: November 29, 2025",
            backLink: "Back to Home",
            sections: [
                {
                    title: "1. Introduction & Acceptance",
                    body: "Welcome to Campaia (accessible at https://campaia.online). By accessing or using our platform, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service."
                },
                {
                    title: "2. The Publisher Model",
                    body: "Campaia is a marketing automation platform. It is crucial to understand that ad campaigns created on our platform are published and distributed exclusively through our official TikTok account (@CampaiaAi). You, as a client, do not connect your own ad account; rather, you purchase ad space and creative services on our infrastructure."
                },
                {
                    title: "3. Intellectual Property & Licensing",
                    body: "By submitting content (product links, descriptions, images) to Campaia, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, and display such content on the @CampaiaAi account strictly for the purpose of running your campaign."
                },
                {
                    title: "4. Payments & Budgets",
                    body: "Amounts paid to Campaia represent the advertising budget and the technology service fee. Campaia manages the bidding and budget distribution on the TikTok Ads platform on your behalf."
                },
                {
                    title: "5. Limitation of Liability",
                    body: "While we use AI to optimize performance, Campaia does not guarantee specific results (fixed number of sales, views, or virality), as these depend on third-party algorithms (TikTok). The Service is provided on an 'AS IS' basis."
                },
                {
                    title: "6. Beta Disclaimer",
                    body: "Please note that Campaia is currently in Public Beta. Features may change, and the service may experience temporary interruptions."
                }
            ]
        }
    };

    const text = content[language as keyof typeof content] || content.en;

    return (
        <div className="min-h-screen bg-white text-slate-500 font-sans selection:bg-purple-100 overflow-x-hidden flex flex-col">
            <Navbar />

            {/* Background Gradient similar to LandingPage */}
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
                                <FileText size={12} />
                                <span>Legal</span>
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