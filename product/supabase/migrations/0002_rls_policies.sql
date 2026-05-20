-- T015: Row-Level Security (RLS) policies
-- Version: 0002
-- Created: 2026-04-08

BEGIN;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roasters ENABLE ROW LEVEL SECURITY;
ALTER TABLE origins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coffees ENABLE ROW LEVEL SECURITY;
ALTER TABLE roast_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE brew_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE flavor_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coffee_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coffee_stats ENABLE ROW LEVEL SECURITY;

-- Users: Users can read their own profile, read public profiles
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Roasters: Anyone can read verified roasters, owners can manage their own
CREATE POLICY "Anyone can read verified roasters" ON roasters
    FOR SELECT USING (verification_status = 'verified');

CREATE POLICY "Users can insert own roaster" ON roasters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own roaster" ON roasters
    FOR UPDATE USING (auth.uid() = user_id);

-- Origins: Read-only for all authenticated users
CREATE POLICY "Authenticated users can read origins" ON origins
    FOR SELECT TO authenticated USING (true);

-- Coffees: Anyone can read active coffees from verified roasters
CREATE POLICY "Anyone can read active coffees" ON coffees
    FOR SELECT USING (
        status = 'active' AND 
        EXISTS (SELECT 1 FROM roasters WHERE id = roaster_id AND verification_status = 'verified')
    );

CREATE POLICY "Roaster owners can manage coffees" ON coffees
    FOR ALL USING (
        EXISTS (SELECT 1 FROM roasters WHERE id = roaster_id AND user_id = auth.uid())
    );

-- Roast Batches: Anyone can read active batches
CREATE POLICY "Anyone can read active batches" ON roast_batches
    FOR SELECT USING (
        status = 'active' AND
        EXISTS (SELECT 1 FROM coffees WHERE id = coffee_id AND status = 'active')
    );

CREATE POLICY "Roaster owners can manage batches" ON roast_batches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM coffees c 
            JOIN roasters r ON c.roaster_id = r.id 
            WHERE c.id = coffee_id AND r.user_id = auth.uid()
        )
    );

-- QR Codes: Read-only for all, generate only via function
CREATE POLICY "Anyone can read qr_codes" ON qr_codes
    FOR SELECT USING (true);

-- Brew Methods and Flavor Notes: Public read
CREATE POLICY "Anyone can read brew_methods" ON brew_methods
    FOR SELECT USING (true);

CREATE POLICY "Anyone can read flavor_notes" ON flavor_notes
    FOR SELECT USING (true);

-- Coffee Logs: Users can read their own, read public
CREATE POLICY "Users can read own coffee logs" ON coffee_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own coffee logs" ON coffee_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coffee logs" ON coffee_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own coffee logs" ON coffee_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Tasting Notes: Owner can manage
CREATE POLICY "Users can manage own tasting notes" ON tasting_notes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM coffee_logs WHERE id = coffee_log_id AND user_id = auth.uid())
    );

-- Reviews: Read all, create/update own
CREATE POLICY "Anyone can read reviews" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create own review" ON reviews
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM coffee_logs WHERE id = coffee_log_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can update own review" ON reviews
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM coffee_logs WHERE id = coffee_log_id AND user_id = auth.uid())
    );

-- Review Votes: Users can vote on any review
CREATE POLICY "Users can vote on reviews" ON review_votes
    FOR ALL USING (auth.uid() = user_id);

-- Coffee Stats: Public read
CREATE POLICY "Anyone can read coffee_stats" ON coffee_stats
    FOR SELECT USING (true);

COMMIT;