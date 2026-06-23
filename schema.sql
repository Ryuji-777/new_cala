-- Enable UUID generation extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE
-- Holds information for all users (Freelancers, Clients, Admins, Super Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    screen_name TEXT UNIQUE,
    description TEXT,
    city TEXT,
    country TEXT,
    state TEXT,
    zip TEXT,
    avatar_url TEXT,
    id_attachment_url TEXT,
    contact_number TEXT,
    is_verified BOOLEAN DEFAULT FALSE, -- Admin must approve the attached ID
    is_freelancer BOOLEAN DEFAULT FALSE,
    is_client BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    is_super_admin BOOLEAN DEFAULT FALSE,
    wallet_balance NUMERIC(10, 2) DEFAULT 1000.00, -- Simulated online wallet
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT description_char_limit CHECK (
        description IS NULL OR (LENGTH(description) >= 150 AND LENGTH(description) <= 600)
    )
);

-- FREELANCER SKILLS TABLE
-- Many-to-many relationship mapping freelancers to skills
CREATE TABLE IF NOT EXISTS public.freelancer_skills (
    freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (freelancer_id, skill_name)
);

-- JOBS TABLE
-- Posted by clients
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    budget NUMERIC(10, 2) NOT NULL CHECK (budget > 0),
    category TEXT NOT NULL,
    skills_required TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT job_description_limit CHECK (
        LENGTH(description) >= 150 AND LENGTH(description) <= 600
    )
);

-- APPLICATIONS TABLE
-- Submitted by freelancers to jobs
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    cover_letter TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shortlisted', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT cover_letter_limit CHECK (
        LENGTH(cover_letter) >= 150 AND LENGTH(cover_letter) <= 600
    ),
    CONSTRAINT unique_job_freelancer UNIQUE (job_id, freelancer_id)
);

-- SERVICES TABLE
-- Posted by freelancers to sell their services directly
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
    delivery_days INTEGER NOT NULL CHECK (delivery_days > 0),
    category TEXT NOT NULL,
    skills_required TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT service_description_limit CHECK (
        LENGTH(description) >= 150 AND LENGTH(description) <= 600
    )
);

-- CONTRACTS TABLE
-- Created when a client hires a freelancer for a job or directly for a service
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE, -- Nullable if hired directly from a service
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE, -- Nullable if hired from a job post
    freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    budget NUMERIC(10, 2) NOT NULL CHECK (budget > 0),
    status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

-- PAYMENTS TABLE
-- Simulated payments between clients and freelancers
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MESSAGES TABLE
-- Simulated direct messages between users
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REVIEWS TABLE
-- Completed by clients for freelancers, or freelancers for clients after a contract is closed
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reviewee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_contract_reviewer UNIQUE (contract_id, reviewer_id)
);

-- SYSTEM LOGS
-- Logs server events, admin actions, and super-admin actions
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_email TEXT,
    action TEXT NOT NULL, -- e.g., 'approve_user_id', 'delete_user', 'add_admin'
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ARCHIVES TABLE
-- Holds archived information for deleted entities
CREATE TABLE IF NOT EXISTS public.archives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type TEXT NOT NULL CHECK (resource_type IN ('user', 'job', 'skill')),
    original_id UUID NOT NULL,
    data JSONB NOT NULL,
    deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_by_email TEXT,
    deleted_at TIMESTAMPTZ DEFAULT NOW()
);


-- TRIGGER FUNCTION FOR AUTH SIGNUP
-- Automatically inserts a corresponding record in public.profiles when an auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_first_user BOOLEAN;
BEGIN
    -- Check if this is the very first user signup to automatically make them a Super Admin for testing convenience
    SELECT count(*) = 0 INTO is_first_user FROM public.profiles;

    INSERT INTO public.profiles (
        id, 
        first_name, 
        last_name, 
        email, 
        is_freelancer, 
        is_client, 
        is_admin, 
        is_super_admin
    )
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'first_name', ''),
        COALESCE(new.raw_user_meta_data->>'last_name', ''),
        new.email,
        FALSE,
        FALSE,
        is_first_user,      -- Set to true if first user
        is_first_user       -- Set to true if first user
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ROW LEVEL SECURITY (RLS) CONFIGURATION
-- Enable Row Level Security (RLS) on all tables and configure granular security access control policies.

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.freelancer_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.archives ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Allow public read on profiles" ON public.profiles;
CREATE POLICY "Allow public read on profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
CREATE POLICY "Allow users to update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. Freelancer Skills Policies
DROP POLICY IF EXISTS "Allow public read on freelancer_skills" ON public.freelancer_skills;
CREATE POLICY "Allow public read on freelancer_skills" ON public.freelancer_skills FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow freelancers to manage own skills" ON public.freelancer_skills;
CREATE POLICY "Allow freelancers to manage own skills" ON public.freelancer_skills FOR ALL USING (auth.uid() = freelancer_id) WITH CHECK (auth.uid() = freelancer_id);

-- 3. Jobs Policies
DROP POLICY IF EXISTS "Allow public read on jobs" ON public.jobs;
CREATE POLICY "Allow public read on jobs" ON public.jobs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow client to insert jobs" ON public.jobs;
CREATE POLICY "Allow client to insert jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = client_id);
DROP POLICY IF EXISTS "Allow client to update own jobs" ON public.jobs;
CREATE POLICY "Allow client to update own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);
DROP POLICY IF EXISTS "Allow client to delete own jobs" ON public.jobs;
CREATE POLICY "Allow client to delete own jobs" ON public.jobs FOR DELETE USING (auth.uid() = client_id);

-- 4. Applications Policies
DROP POLICY IF EXISTS "Allow freelancer and job client to read applications" ON public.applications;
CREATE POLICY "Allow freelancer and job client to read applications" ON public.applications FOR SELECT USING (auth.uid() = freelancer_id OR EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_id AND jobs.client_id = auth.uid()));
DROP POLICY IF EXISTS "Allow freelancers to apply" ON public.applications;
CREATE POLICY "Allow freelancers to apply" ON public.applications FOR INSERT WITH CHECK (auth.uid() = freelancer_id);
DROP POLICY IF EXISTS "Allow freelancer or job client to update applications" ON public.applications;
CREATE POLICY "Allow freelancer or job client to update applications" ON public.applications FOR UPDATE USING (auth.uid() = freelancer_id OR EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_id AND jobs.client_id = auth.uid()));
DROP POLICY IF EXISTS "Allow freelancer to delete application" ON public.applications;
CREATE POLICY "Allow freelancer to delete application" ON public.applications FOR DELETE USING (auth.uid() = freelancer_id);

-- 5. Services Policies
DROP POLICY IF EXISTS "Allow public read on services" ON public.services;
CREATE POLICY "Allow public read on services" ON public.services FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow freelancers to post services" ON public.services;
CREATE POLICY "Allow freelancers to post services" ON public.services FOR INSERT WITH CHECK (auth.uid() = freelancer_id);
DROP POLICY IF EXISTS "Allow freelancers to update own services" ON public.services;
CREATE POLICY "Allow freelancers to update own services" ON public.services FOR UPDATE USING (auth.uid() = freelancer_id) WITH CHECK (auth.uid() = freelancer_id);
DROP POLICY IF EXISTS "Allow freelancers to delete own services" ON public.services;
CREATE POLICY "Allow freelancers to delete own services" ON public.services FOR DELETE USING (auth.uid() = freelancer_id);

-- 6. Contracts Policies
DROP POLICY IF EXISTS "Allow parties to view contracts" ON public.contracts;
CREATE POLICY "Allow parties to view contracts" ON public.contracts FOR SELECT USING (auth.uid() = client_id OR auth.uid() = freelancer_id);
DROP POLICY IF EXISTS "Allow parties to insert contracts" ON public.contracts;
CREATE POLICY "Allow parties to insert contracts" ON public.contracts FOR INSERT WITH CHECK (auth.uid() = client_id OR auth.uid() = freelancer_id);
DROP POLICY IF EXISTS "Allow parties to update contracts" ON public.contracts;
CREATE POLICY "Allow parties to update contracts" ON public.contracts FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = freelancer_id) WITH CHECK (auth.uid() = client_id OR auth.uid() = freelancer_id);

-- 7. Payments Policies
DROP POLICY IF EXISTS "Allow parties to view payments" ON public.payments;
CREATE POLICY "Allow parties to view payments" ON public.payments FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS "Allow inserting payments" ON public.payments;
CREATE POLICY "Allow inserting payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 8. Messages Policies
DROP POLICY IF EXISTS "Allow users to view their messages" ON public.messages;
CREATE POLICY "Allow users to view their messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS "Allow sending messages" ON public.messages;
CREATE POLICY "Allow sending messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "Allow updating messages" ON public.messages;
CREATE POLICY "Allow updating messages" ON public.messages FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 9. Notifications Policies
DROP POLICY IF EXISTS "Allow users to view own notifications" ON public.notifications;
CREATE POLICY "Allow users to view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Allow inserting notifications" ON public.notifications;
CREATE POLICY "Allow inserting notifications" ON public.notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow users to update own notifications" ON public.notifications;
CREATE POLICY "Allow users to update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. Reviews Policies
DROP POLICY IF EXISTS "Allow public read on reviews" ON public.reviews;
CREATE POLICY "Allow public read on reviews" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow contract parties to insert reviews" ON public.reviews;
CREATE POLICY "Allow contract parties to insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- 11. System Logs Policies
DROP POLICY IF EXISTS "Allow admin read on system_logs" ON public.system_logs;
CREATE POLICY "Allow admin read on system_logs" ON public.system_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)));
DROP POLICY IF EXISTS "Allow public insert on system_logs" ON public.system_logs;
CREATE POLICY "Allow public insert on system_logs" ON public.system_logs FOR INSERT WITH CHECK (true);

-- 12. Archives Policies
DROP POLICY IF EXISTS "Allow admin read on archives" ON public.archives;
CREATE POLICY "Allow admin read on archives" ON public.archives FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)));
DROP POLICY IF EXISTS "Allow admin write on archives" ON public.archives;
CREATE POLICY "Allow admin write on archives" ON public.archives FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)));


-- PORTFOLIO ITEMS TABLE
-- Added for freelancers to showcase portfolio items
CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SERVICE WORKS TABLE
-- Added for freelancers to attach work samples to services
CREATE TABLE IF NOT EXISTS public.service_works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable row level security for these tables as well
ALTER TABLE IF EXISTS public.portfolio_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_works DISABLE ROW LEVEL SECURITY;

-- Add image_urls column to jobs table to support 1-4 project screenshots/images
ALTER TABLE IF EXISTS public.jobs ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Create attachments storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects just in case
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Recreate policies for 'attachments' bucket to allow public uploads and downloads
DROP POLICY IF EXISTS "Allow public read access on attachments" ON storage.objects;
CREATE POLICY "Allow public read access on attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments');

DROP POLICY IF EXISTS "Allow public insert access on attachments" ON storage.objects;
CREATE POLICY "Allow public insert access on attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'attachments');

DROP POLICY IF EXISTS "Allow public update access on attachments" ON storage.objects;
CREATE POLICY "Allow public update access on attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'attachments')
WITH CHECK (bucket_id = 'attachments');

DROP POLICY IF EXISTS "Allow public delete access on attachments" ON storage.objects;
CREATE POLICY "Allow public delete access on attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'attachments');


-- REPORTS TABLE
-- Allows clients and freelancers to report profiles or postings (jobs/services)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('profile', 'job', 'service')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved_no_violation', 'resolved_violation')),
    resolution_notes TEXT,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Enable RLS and add policies for reports table
ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow viewing reports" ON public.reports;
CREATE POLICY "Allow viewing reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)));
DROP POLICY IF EXISTS "Allow inserting reports" ON public.reports;
CREATE POLICY "Allow inserting reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "Allow admin update on reports" ON public.reports;
CREATE POLICY "Allow admin update on reports" ON public.reports FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)));

-- Enable RLS and add public access policies for portfolio_items (resiliency against client/auth RLS limits)
ALTER TABLE IF EXISTS public.portfolio_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on portfolio_items" ON public.portfolio_items;
CREATE POLICY "Allow public read on portfolio_items" ON public.portfolio_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on portfolio_items" ON public.portfolio_items;
CREATE POLICY "Allow public insert on portfolio_items" ON public.portfolio_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete on portfolio_items" ON public.portfolio_items;
CREATE POLICY "Allow public delete on portfolio_items" ON public.portfolio_items FOR DELETE USING (true);

-- Enable RLS and add public access policies for service_works (resiliency against client/auth RLS limits)
ALTER TABLE IF EXISTS public.service_works ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on service_works" ON public.service_works;
CREATE POLICY "Allow public read on service_works" ON public.service_works FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on service_works" ON public.service_works;
CREATE POLICY "Allow public insert on service_works" ON public.service_works FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete on service_works" ON public.service_works;
CREATE POLICY "Allow public delete on service_works" ON public.service_works FOR DELETE USING (true);

-- Migration to add skills_required column to public.services on existing database
ALTER TABLE IF EXISTS public.services ADD COLUMN IF NOT EXISTS skills_required TEXT[] DEFAULT '{}';
