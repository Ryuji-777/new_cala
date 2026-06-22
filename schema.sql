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
-- For testing convenience in staging, we disable RLS on all tables so the web app can perform reads/writes.
-- You can run the following block in your Supabase SQL Editor:
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.freelancer_skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.archives DISABLE ROW LEVEL SECURITY;

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

