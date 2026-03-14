import { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, Settings as SettingsIcon, Sparkles, BarChart3, Receipt, UserCircle, Coins, Plus, Video, Share2, Map, Bot } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Notification, { type NotificationType } from "../components/Notification.tsx";
import MobileBottomNav from "../components/navbar/MobileBottomNav.tsx";
import { useLanguage } from '../context/LanguageContext';
import campaignService, { CampaignStatus, type Campaign } from '../services/campaignService';
import paymentService, { type WalletBalance } from '../services/paymentService';
import type { CampaignData } from "../interfaces/campaign.ts";
import Overview from './dashboard/Overview';
import NewCampaign from './dashboard/NewCampaign';
import SettingsPage from './dashboard/Settings';
import Billing from './dashboard/Billing';
import Profile from './dashboard/Profile';
import BuyTokens from './dashboard/BuyTokens';
import MyVideos from './dashboard/MyVideos';
import CampaignDetails from './dashboard/CampaignDetails';
import Integrations from './dashboard/Integrations';
import CommunityMap from './dashboard/CommunityMap';
import CampaiaAgent from './dashboard/CampaiaAgent';
import targetingService from '../services/targetingService';
import { useUser } from '../context/UserContext';

export default function Dashboard() {
    const { language } = useLanguage();
    const { user } = useUser();
    const isAdmin = user?.email === 'razvanandreipasaran@gmail.com';
    const [activePage, setActivePage] = useState<'overview' | 'new' | 'settings' | 'analytics' | 'billing' | 'profile' | 'buyTokens' | 'videos' | 'details' | 'integrations' | 'communityMap' | 'agent'>('overview');
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

    // State now holds API campaigns, but we might want to keep using CampaignData for compatibility with children for now,
    // OR keep strict API state and map on render. Mapping on render is cleaner.
    const [apiCampaigns, setApiCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [wallet, setWallet] = useState<WalletBalance | null>(null);

    const [notification, setNotification] = useState<{ show: boolean; message: string | null; type: NotificationType }>({
        show: false,
        message: null,
        type: 'success'
    });

    const sidebarTexts = {
        ro: { overview: "Privire Generală", new: "Campanie Nouă", settings: "Setări", analytics: "Analitice", billing: "Plata", profile: "Profilul Meu", soon: "SOON", tip: "Bugetele > 100 RON au +40% șanse.", created: "Campania a fost creată cu succes!", paused: "Campania a fost pusă pe pauză.", reopened: "Campania a fost repornită.", deleted: "Campania a fost ștearsă.", tokens: "Tokens", buyTokens: "Cumpără", videos: "Videoclipuri", integrations: "Integrări", communityMap: "Harta Comunitară", agent: "Campaia Agent" },
        en: { overview: "Overview", new: "New Campaign", settings: "Settings", analytics: "Analytics", billing: "Billing", profile: "My Profile", soon: "SOON", tip: "Budgets > 100 RON are +40% viral.", created: "The campaign was successfully created!", paused: "The campaign was put on pause.", reopened: "The campaign has been restarted.", deleted: "The campaign has been deleted.", tokens: "Tokens", buyTokens: "Buy", videos: "Videos", integrations: "Integrations", communityMap: "Community Map", agent: "Campaia Agent" }
    };
    const t = language === 'ro' ? sidebarTexts.ro : sidebarTexts.en;
    const showNotification = (message: string, type: NotificationType = 'success') => { setNotification({ show: true, message, type }); };

    // Fetch campaigns
    const fetchCampaigns = async () => {
        try {
            setIsLoading(true);
            const response = await campaignService.getCampaigns({ per_page: 100 }); // Get all for now
            setApiCampaigns(response.items);
        } catch (error) {
            console.error('Failed to fetch campaigns:', error);
            showNotification('Failed to load campaigns', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
        // Fetch wallet balance
        paymentService.getWallet().then(setWallet).catch(console.error);
    }, []);

    // Adapter: API Campaign -> Frontend CampaignData

    const handlePublish = async (data: CampaignData) => {
        try {
            // 1. Create Campaign (DRAFT) - include videoId if available
            const createPayload: {
                url: string;
                budget: number;
                product_desc?: string;
                name: string;
                video_id?: string;
            } = {
                url: data.url,
                budget: data.budget,
                product_desc: data.productDesc,
                name: data.name || 'New Campaign'
            };

            // Add video_id if a video was selected/generated
            if (data.videoId) {
                createPayload.video_id = data.videoId;
            }

            const campaign = await campaignService.createCampaign(createPayload);

            // 2. Update Script (if exists)
            if (data.aiScript) {
                await campaignService.updateScript(campaign.id, {
                    ai_script: data.aiScript,
                    tokens_spent: 5 // Default cost
                });
            }

            // 2.1 Update Targeting
            if (data.targeting) {
                await targetingService.updateTargeting(campaign.id, data.targeting);
            }

            // 3. Campaign stays in DRAFT until published to TikTok
            // We removed activateCampaign(campaign.id) call here

            await fetchCampaigns();
            showNotification(t.created);
        } catch (error) {
            console.error('Failed to create campaign:', error);
            showNotification('Failed to create campaign', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await campaignService.deleteCampaign(id);
            // Optimistic update
            setApiCampaigns(prev => prev.filter(c => c.id !== id));
            showNotification(t.deleted, 'info');
        } catch (error) {
            console.error('Failed to delete campaign:', error);
            showNotification('Failed to delete campaign', 'error');
            await fetchCampaigns(); // Revert on error
        }
    };

    const handleToggle = async (id: string) => {
        const campaign = apiCampaigns.find(c => c.id === id);
        if (!campaign) return;

        const isCurrentlyActive = campaign.status === CampaignStatus.ACTIVE;
        const isDraft = campaign.status === CampaignStatus.DRAFT;
        const newStatus = isCurrentlyActive ? CampaignStatus.PAUSED : CampaignStatus.ACTIVE;

        // Optimistic update
        setApiCampaigns(prev => prev.map(c =>
            c.id === id ? { ...c, status: newStatus } : c
        ));

        const msg = !isCurrentlyActive ? t.reopened : t.paused;
        showNotification(msg, !isCurrentlyActive ? 'success' : 'info');

        try {
            if (isCurrentlyActive) {
                await campaignService.pauseCampaign(id);
            } else if (isDraft) {
                await campaignService.activateCampaign(id);
            } else {
                await campaignService.resumeCampaign(id);
            }
        } catch (error) {
            console.error('Failed to toggle campaign:', error);
            showNotification('Failed to update campaign status', 'error');
            await fetchCampaigns(); // Revert
        }
    };

    const handleViewDetails = (id: string) => {
        setSelectedCampaignId(id);
        setActivePage('details');
    };


    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-600 selection:bg-purple-100">
            <Navbar
                type="dashboard"
                onNavigate={(page) => setActivePage(page)}
            />

            <div className="flex flex-1 max-w-7xl mx-auto w-full relative">
                {/* Desktop Sidebar */}
                <aside className="w-72 bg-white border-r border-slate-100 hidden lg:flex flex-col p-8 sticky top-16 h-[calc(100vh-4rem)]">
                    <div className="space-y-4 flex-1">
                        <div className="pb-4">
                            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Main Menu</p>
                            <div className="space-y-1.5">
                                <SidebarItem icon={<LayoutDashboard size={20} />} label={t.overview} active={activePage === 'overview'} onClick={() => setActivePage('overview')} />
                                <SidebarItem icon={<Map size={20} />} label={t.communityMap} active={activePage === 'communityMap'} onClick={() => setActivePage('communityMap')} />
                                <SidebarItem icon={<PlusCircle size={20} />} label={t.new} active={activePage === 'new'} onClick={() => setActivePage('new')} />
                                <SidebarItem icon={<BarChart3 size={20} />} label={t.analytics} active={activePage === 'analytics'} onClick={() => setActivePage('analytics')} />
                                <SidebarItem icon={<Video size={20} />} label={t.videos} active={activePage === 'videos'} onClick={() => setActivePage('videos')} />
                                <SidebarItem icon={<Bot size={20} />} label={t.agent} active={activePage === 'agent'} onClick={() => setActivePage('agent')} />
                                {isAdmin && (
                                    <SidebarItem icon={<Share2 size={20} />} label={t.integrations} active={activePage === 'integrations'} onClick={() => setActivePage('integrations')} />
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50">
                            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Account</p>
                            <div className="space-y-1.5">
                                <SidebarItem icon={<Receipt size={20} />} label={t.billing} active={activePage === 'billing'} onClick={() => setActivePage('billing')} />
                                <SidebarItem icon={<UserCircle size={20} />} label={t.profile} active={activePage === 'profile'} onClick={() => setActivePage('profile')} />
                                <SidebarItem icon={<SettingsIcon size={20} />} label={t.settings} active={activePage === 'settings'} onClick={() => setActivePage('settings')} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 mt-auto space-y-5">
                        {/* Token Balance Card - Premium Version */}
                        <div className="relative group overflow-hidden bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>

                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-amber-600 font-black text-[11px] uppercase tracking-wider">
                                        <div className="p-1.5 bg-amber-50 rounded-lg"><Coins size={14} /></div>
                                        {t.tokens}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setActivePage('buyTokens')}
                                        className="h-8 w-8 flex items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600 hover:scale-110 transition-all active:scale-95"
                                    >
                                        <Plus size={16} strokeWidth={3} />
                                    </button>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-slate-950 tracking-tight">{wallet?.balance ?? 0}</span>
                                    <span className="text-xs font-black text-slate-400 uppercase">tokens</span>
                                </div>
                            </div>
                        </div>

                        {/* Pro Tip Card - Premium version */}
                        <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 blur-2xl opacity-20"></div>
                            <div className="flex items-center gap-2 mb-3 text-purple-400 font-black text-[10px] uppercase tracking-wider italic">
                                <Sparkles size={14} className="animate-pulse" />
                                Pro Tip
                            </div>
                            <p className="text-xs text-slate-300 font-medium leading-relaxed group-hover:text-white transition-colors">
                                {t.tip}
                            </p>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 p-4 sm:p-10 overflow-y-auto pb-32 lg:pb-10 relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/40 z-50 flex items-center justify-center backdrop-blur-md">
                            <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center gap-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizare...</span>
                            </div>
                        </div>
                    )}
                    <div className="max-w-6xl mx-auto">
                        {activePage === 'overview' && (
                            <Overview
                                campaigns={apiCampaigns}
                                onCreateNew={() => setActivePage('new')}
                                lang={language}
                                onDelete={handleDelete}
                                onToggle={handleToggle}
                                onView={handleViewDetails}
                            />
                        )}
                        {activePage === 'communityMap' && <CommunityMap />}
                        {activePage === 'new' && (
                            <NewCampaign onPublish={handlePublish} onCancel={() => setActivePage('overview')} lang={language} />
                        )}
                        {activePage === 'settings' && (
                            <SettingsPage />
                        )}

                        {activePage === 'billing' && (<Billing />)}
                        {activePage === 'buyTokens' && (<BuyTokens />)}
                        {activePage === 'analytics' && (<></>)}
                        {activePage === 'videos' && (
                            <MyVideos
                                userCredits={wallet?.balance ?? 0}
                                onCreditsUpdate={() => paymentService.getWallet().then(setWallet).catch(console.error)}
                            />
                        )}
                        {activePage === 'agent' && (<CampaiaAgent />)}
                        {activePage === 'profile' && (<Profile />)}
                        {activePage === 'integrations' && isAdmin && (<Integrations />)}
                        {activePage === 'details' && selectedCampaignId && (
                            <CampaignDetails
                                campaignId={selectedCampaignId}
                                lang={language}
                                onBack={() => setActivePage('overview')}
                                onDeleted={() => {
                                    setActivePage('overview');
                                    fetchCampaigns();
                                }}
                            />
                        )}
                    </div>
                </main>
            </div>

            <MobileBottomNav
                activePage={activePage}
                setActivePage={setActivePage}
            />

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

function SidebarItem({ icon, label, active, onClick, disabled, badge }: {
    icon: React.ReactNode, label: string, active: boolean, onClick: () => void, disabled?: boolean, badge?: string
}) {
    return (
        <button
            type={'button'}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-300
            ${active
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
            ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
            `}
        >
            <div className="flex items-center gap-3">
                <span className={`${active ? 'text-purple-400' : 'text-slate-400 transition-colors group-hover:text-slate-600'}`}>
                    {icon}
                </span>
                <span className="tracking-tight">{label}</span>
            </div>
            {badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider
                    ${active ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {badge}
                </span>
            )}
        </button>
    );
}