import { type Campaign } from "../services/campaignService.ts";

export default interface OverviewProps {
    campaigns: Campaign[];
    onCreateNew: () => void;
    lang: string;
    onDelete: (id: string) => Promise<void>;
    onToggle: (id: string) => Promise<void>;
    onView: (id: string) => void;
}