import type React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Building, MapPin, ArrowRight, Sparkles, Lock } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';
import Notification, { type NotificationType } from '../components/Notification';
import Footer from "../components/Footer";
import type { AuthData } from "../interfaces/authDataInterface.ts";
import type { BusinessData } from "../interfaces/businessData.ts";
import { motion } from 'framer-motion';
import type { Variants } from "framer-motion";
import { useUser } from '../context/UserContext';
import { useEffect } from 'react';


const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 50, damping: 15 }
    }
};

export default function Signup() {
    const { language } = useLanguage();
    const { user, isLoading } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && user) {
            navigate('/dashboard');
        }
    }, [user, isLoading, navigate]);

    const [notification, setNotification] = useState<{
        show: boolean;
        message: string | null;
        type: NotificationType;
    }>({
        show: false,
        message: null,
        type: 'info'
    });

    const [formData, setFormData] = useState<AuthData & BusinessData>({
        name: '',
        email: '',
        password: '',
        companyName: '',
        vatId: '',
        address: '',
        city: '',
        county: '',
        zip: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setNotification({
            show: true,
            message: language === 'ro'
                ? "Această funcționalitate este momentan în lucru. Te rugăm să încerci mai târziu."
                : "This feature is currently under development. Please try again later.",
            type: 'info'
        });
    };

    const text = {
        ro: {
            title: "Creează un cont",
            subtitle: "Începe să generezi reclame virale pentru afacerea ta.",
            google: "Continuă cu Google",
            or: "sau continuă cu email",
            sectPersonal: "Informații Personale",
            sectBusiness: "Detalii Business",
            sectBilling: "Adresă Facturare",
            lbl: {
                name: "Nume Complet",
                email: "Adresă Email",
                pass: "Parolă",
                comp: "Nume Companie",
                vat: "CUI / VAT ID",
                addr: "Stradă și Număr",
                city: "Oraș",
                county: "Județ / Sector",
                zip: "Cod Poștal"
            },
            ph: {
                name: "Ex: Andrei Popescu",
                email: "nume@exemplu.com",
                pass: "Minim 8 caractere",
                comp: "Ex: Campaia SRL",
                vat: "RO123456",
                addr: "Str. Victoriei nr. 10",
                city: "București",
                county: "Ex: Ilfov",
                zip: "010000"
            },
            btn: "Creează Cont",
            login: "Ai deja un cont?",
            loginLink: "Autentifică-te"
        },
        en: {
            title: "Create an account",
            subtitle: "Start generating viral ads for your business.",
            google: "Continue with Google",
            or: "or continue with email",
            sectPersonal: "Personal Information",
            sectBusiness: "Business Details",
            sectBilling: "Billing Address",
            lbl: {
                name: "Full Name",
                email: "Email Address",
                pass: "Password",
                comp: "Company Name",
                vat: "VAT ID",
                addr: "Street Address",
                city: "City",
                county: "County / State",
                zip: "Postal Code"
            },
            ph: {
                name: "Ex: John Doe",
                email: "name@example.com",
                pass: "Min 8 characters",
                comp: "Ex: Campaia Inc.",
                vat: "US123456",
                addr: "10 Victory St.",
                city: "New York",
                county: "Ex: NY",
                zip: "10001"
            },
            btn: "Create Account",
            login: "Already have an account?",
            loginLink: "Log In"
        }
    };

    const t = text[language as keyof typeof text] || text.ro;

    return (
        <div className="min-h-screen bg-white flex flex-col text-slate-600">
            <Navbar />

            <div className="fixed inset-0 -z-20 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#f0f4ff_100%)]"></div>

            <div className="flex-1 flex flex-col items-center justify-start pt-10 pb-20 px-4 sm:px-6 relative">

                <motion.div
                    className="max-w-3xl w-full pt-8"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants} className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 mb-4 shadow-sm border border-purple-100">
                            <Sparkles size={28} />
                        </div>

                        <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-950 tracking-tight mb-2">
                            {t.title}
                        </h1>

                        <p className="text-slate-500 text-lg mb-6">{t.subtitle}</p>
                        <button type={"button"} className="mx-auto w-full sm:w-80 flex items-center justify-center gap-3 border border-slate-300 rounded-xl py-3.5 bg-white shadow-sm hover:bg-slate-50 transition">
                            <img
                                src="https://www.svgrepo.com/show/475656/google-color.svg"
                                className="w-5 h-5"
                                alt="Google"
                            />
                            <span className="font-medium">{t.google}</span>
                        </button>
                        <div className="flex items-center gap-4 mt-6 mb-2">
                            <div className="flex-1 h-px bg-slate-200"></div>
                            <span className="text-sm text-slate-400 font-medium">{t.or}</span>
                            <div className="flex-1 h-px bg-slate-200"></div>
                        </div>
                    </motion.div>
                    <motion.form
                        variants={itemVariants}
                        onSubmit={handleSubmit}
                        className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl space-y-10"
                    >
                        <motion.div variants={itemVariants} className="space-y-6">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                                    <User size={22} />
                                </div>
                                <h3 className="text-xl font-bold text-blue-950">{t.sectPersonal}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                <div className="space-y-2">
                                    <label htmlFor={"name"} className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.lbl.name}</label>
                                    <input
                                        id={"name"}
                                        name="name"
                                        type="text"
                                        placeholder={t.ph.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor={"email"} className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.lbl.email}</label>
                                    <input
                                        id={"email"}
                                        name="email"
                                        type="email"
                                        placeholder={t.ph.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label htmlFor={"pass"} className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.lbl.pass}</label>
                                    <div className="relative">
                                        <input
                                            id={"pass"}
                                            name="password"
                                            type="password"
                                            placeholder={t.ph.pass}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3.5 pl-11 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                                        />
                                        <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                        <motion.div variants={itemVariants} className="space-y-6">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                                    <Building size={22} />
                                </div>
                                <h3 className="text-xl font-bold text-blue-950">{t.sectBusiness}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                <div className="space-y-2">
                                    <label htmlFor={"companyName"} className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.lbl.comp}</label>
                                    <input
                                        id={"companyName"}
                                        name="companyName"
                                        type="text"
                                        placeholder={t.ph.comp}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor={"vat"} className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.lbl.vat}</label>
                                    <input
                                        id={"vat"}
                                        name="vatId"
                                        type="text"
                                        placeholder={t.ph.vat}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                                    />
                                </div>

                            </div>
                        </motion.div>
                        <motion.div variants={itemVariants} className="space-y-6">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                                    <MapPin size={22} />
                                </div>
                                <h3 className="text-xl font-bold text-blue-950">{t.sectBilling}</h3>
                            </div>

                            <div className="space-y-4">

                                <div className="space-y-2">
                                    <label htmlFor={"addr"} className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.lbl.addr}</label>
                                    <input
                                        id={"addr"}
                                        name="address"
                                        type="text"
                                        placeholder={t.ph.addr}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">

                                    <div className="space-y-2">
                                        <label htmlFor={"city"} className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.lbl.city}</label>
                                        <input
                                            id={"city"}
                                            name="city"
                                            type="text"
                                            placeholder={t.ph.city}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor={"county"} className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.lbl.county}</label>
                                        <input
                                            id={"county"}
                                            name="county"
                                            type="text"
                                            placeholder={t.ph.county}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                                        />
                                    </div>

                                    <div className="space-y-2 col-span-2">
                                        <label htmlFor={"zip"} className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.lbl.zip}</label>
                                        <input
                                            id={"zip"}
                                            name="zip"
                                            type="text"
                                            placeholder={t.ph.zip}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                                        />
                                    </div>

                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="pt-6">
                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg shadow-xl flex items-center justify-center gap-2"
                            >
                                {t.btn} <ArrowRight size={20} />
                            </motion.button>

                            <p className="mt-6 text-center text-sm text-slate-500 font-medium">
                                {t.login}{' '}
                                <Link to="/signin" className="text-purple-600 hover:underline font-bold">
                                    {t.loginLink}
                                </Link>
                            </p>
                        </motion.div>

                    </motion.form>
                </motion.div>
            </div>

            <Footer />

            <Notification
                isVisible={notification.show}
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification(prev => ({ ...prev, show: false }))}
            />
        </div>
    );
}
