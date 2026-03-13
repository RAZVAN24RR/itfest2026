import { Link } from 'react-router-dom';
import Logo from "../../../assets/logo.png";

export default function NavbarLogo() {
    return (
        <Link to="/" className="flex items-center gap-2 group mr-4">
            <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-700 transition shadow-sm shadow-blue-500/20">
                {/*<Sparkles className="h-5 w-5 text-white fill-white" />*/}
                <img src={Logo} alt="logo" className="h-8 w-auto" />
            </div>
            <span className="text-xl font-bold tracking-tight text-blue-950">CampaiaAI</span>
            <span className="hidden min-[500px]:inline-flex ml-2 items-center rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-600 ring-1 ring-inset ring-purple-600/10">
                Beta
            </span>
        </Link>
    );
}