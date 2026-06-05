export type {
  RoasterCoffeeBeanType,
  RoasterCoffeeTag,
  RoasterCoffeeTagForm,
  RoasterCoffeeTagInsert,
  RoasterCoffeeTagRow
} from './roasterCoffeeTag';

export type SensoryLevel = 'beginner' | 'advanced' | 'expert';
export type VerificationStatus = 'pending' | 'verified' | 'revoked';
export type CoffeeStatus = 'draft' | 'active' | 'archived';
export type BatchStatus = 'draft' | 'active' | 'archived';
export type ProcessingMethod = 'washed' | 'natural' | 'honey' | 'anaerobic' | 'wet-hulled' | 'other';

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

export interface User extends BaseEntity {
  display_name: string;
  avatar_url?: string;
  sensory_level: SensoryLevel;
}

export type RoasterFollowSource =
  | 'legacy-backfill'
  | 'discover-roasters-hub'
  | 'roaster-profile'
  | 'roasters-screen';

export interface UserRoasterFollow {
  user_id: string;
  roaster_id: string;
  source: RoasterFollowSource;
  created_at: string;
  last_seen_at: string;
}

export interface Roaster extends BaseEntity {
  user_id: string;
  name: string;
  country?: string;
  city?: string;
  description?: string;
  website?: string;
  logo_url?: string;
  verification_status: VerificationStatus;
}

export interface Origin extends BaseEntity {
  country: string;
  region?: string;
  farm?: string;
  altitude_min?: number;
  altitude_max?: number;
  producer?: string;
}

export interface Coffee extends BaseEntity {
  roaster_id: string;
  origin_id?: string;
  name: string;
  variety?: string;
  processing_method?: ProcessingMethod;
  producer_notes?: string;
  status: CoffeeStatus;
  cover_image_url?: string;
}

export interface RoastBatch extends BaseEntity {
  coffee_id: string;
  roast_date: string;
  lot_number: string;
  status: BatchStatus;
  brewing_notes?: string;
  roaster_story?: string;
}

export interface QrCode extends BaseEntity {
  batch_id: string;
  hash: string;
  qr_url: string;
  svg_storage_path: string;
  png_storage_path: string;
  generated_at: string;
}

export interface BrewMethod extends BaseEntity {
  name: string;
  sort_order: number;
}

export interface FlavorNote extends BaseEntity {
  name: string;
  label: string;
  category: string;
  sort_order: number;
}

export interface CoffeeLog extends BaseEntity {
  user_id: string;
  batch_id: string;
  brew_method_id?: string;
  rating: number;
  brew_time_seconds?: number;
  free_text_notes?: string;
  logged_at: string;
  synced_at?: string;
}

export interface TastingNote {
  coffee_log_id: string;
  tasting_note_id: string;
}

export interface Review extends BaseEntity {
  coffee_log_id: string;
  body: string;
}

export interface ReviewVote extends BaseEntity {
  review_id: string;
  user_id: string;
  vote: boolean;
}

export interface CoffeeStats extends BaseEntity {
  batch_id: string;
  total_count: number;
  avg_rating: number;
  rating_distribution: Record<string, number>;
  top_flavor_notes: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  user: AuthUser;
}

export interface FlavorNoteSummary {
  id: string;
  name: string;
  label: string;
  category: string;
  count: number;
}

export interface CoffeeStatsResponse {
  total_count: number;
  avg_rating: number;
  rating_distribution: Record<string, number>;
  top_flavor_notes: FlavorNoteSummary[];
}

export interface OriginResponse {
  country: string;
  region: string | null;
  farm: string | null;
  altitude_min: number | null;
  altitude_max: number | null;
  producer: string | null;
}

export interface RoasterSummary {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  logo_url: string | null;
}

export interface BatchSummary {
  id: string;
  roast_date: string;
  lot_number: string;
  status: BatchStatus;
  brewing_notes: string | null;
  roaster_story: string | null;
}

export interface CoffeeResponse {
  id: string;
  name: string;
  variety: string | null;
  varieties: Array<{ id: string; name: string }>;
  processing_method: string | null;
  producer_notes: string | null;
  cover_image_url: string | null;
  status: CoffeeStatus;
}

export interface ScanQRResponse {
  batch: BatchSummary;
  coffee: CoffeeResponse;
  origin: OriginResponse;
  roaster: RoasterSummary;
  stats: CoffeeStatsResponse;
  archived?: boolean;
}

export interface LogTastingRequest {
  batch_id: string;
  rating: number;
  brew_method_id?: string;
  brew_time_seconds?: number;
  tasting_note_ids?: string[];
  free_text_notes?: string;
  review?: string;
}

export interface LogTastingResponse {
  success: boolean;
  coffee_log_id: string;
  message: string;
}

export interface GenerateQRResponse {
  created: boolean;
  hash: string;
  svg_storage_path: string;
  png_storage_path: string;
  svg_signed_url: string;
  png_signed_url: string;
}
