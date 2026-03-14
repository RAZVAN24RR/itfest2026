import { apiRequest } from './api';

export interface CampaignSchedule {
  id: string;
  campaign_id: string;
  is_enabled: boolean;
  days_of_week: number[];
  days_labels: string[];
  start_time: string;
  end_time: string;
  timezone: string;
}

export interface ScheduleRequest {
  is_enabled: boolean;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  timezone?: string;
}

export async function getSchedule(campaignId: string): Promise<CampaignSchedule | null> {
  return apiRequest<CampaignSchedule | null>(`/scheduler/${campaignId}`);
}

export async function saveSchedule(campaignId: string, data: ScheduleRequest): Promise<CampaignSchedule> {
  return apiRequest<CampaignSchedule>(`/scheduler/${campaignId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteSchedule(campaignId: string): Promise<void> {
  await apiRequest(`/scheduler/${campaignId}`, { method: 'DELETE' });
}

export const DAY_LABELS_RO = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'];
export const DAY_LABELS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TIME_SLOTS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
];
