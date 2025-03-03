-- Database Schema for Local Services Directory
-- Compatible with Neon PostgreSQL

-- USERS TABLE
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    profile_picture_url VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'provider', 'admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP WITH TIME ZONE
);

-- USER ADDRESSES TABLE
CREATE TABLE user_addresses (
    address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'United States',
    is_default BOOLEAN DEFAULT FALSE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SERVICE CATEGORIES TABLE
CREATE TABLE service_categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SERVICE SUBCATEGORIES TABLE
CREATE TABLE service_subcategories (
    subcategory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES service_categories(category_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, name)
);

-- SERVICE PROVIDER PROFILES TABLE
CREATE TABLE service_provider_profiles (
    provider_profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    business_description TEXT,
    years_of_experience INTEGER,
    license_number VARCHAR(100),
    is_licensed BOOLEAN DEFAULT FALSE,
    is_insured BOOLEAN DEFAULT FALSE,
    service_radius INTEGER, -- in miles or kilometers
    average_rating DECIMAL(3, 2),
    total_reviews INTEGER DEFAULT 0,
    total_completed_jobs INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- PROVIDER SERVICES TABLE
CREATE TABLE provider_services (
    provider_service_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_profile_id UUID NOT NULL REFERENCES service_provider_profiles(provider_profile_id) ON DELETE CASCADE,
    subcategory_id UUID NOT NULL REFERENCES service_subcategories(subcategory_id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    price_type VARCHAR(20) NOT NULL CHECK (price_type IN ('hourly', 'fixed', 'quote_based')),
    base_price DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PROVIDER AVAILABILITY TABLE
CREATE TABLE provider_availability (
    availability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_profile_id UUID NOT NULL REFERENCES service_provider_profiles(provider_profile_id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PROVIDER BLOCKED DATES TABLE
CREATE TABLE provider_blocked_dates (
    blocked_date_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_profile_id UUID NOT NULL REFERENCES service_provider_profiles(provider_profile_id) ON DELETE CASCADE,
    blocked_date DATE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PORTFOLIO ITEMS TABLE
CREATE TABLE portfolio_items (
    portfolio_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_profile_id UUID NOT NULL REFERENCES service_provider_profiles(provider_profile_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    completed_date DATE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- BOOKINGS TABLE
CREATE TABLE bookings (
    booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(user_id),
    provider_service_id UUID NOT NULL REFERENCES provider_services(provider_service_id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    address_id UUID REFERENCES user_addresses(address_id),
    notes TEXT,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TRANSACTIONS TABLE
CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(booking_id),
    customer_id UUID NOT NULL REFERENCES users(user_id),
    provider_id UUID NOT NULL REFERENCES users(user_id),
    amount DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) NOT NULL,
    provider_payout DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded')),
    payment_method VARCHAR(50) NOT NULL,
    payment_intent_id VARCHAR(255), -- For Stripe
    charge_id VARCHAR(255), -- For Stripe
    refund_id VARCHAR(255), -- For refunds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INVOICES TABLE
CREATE TABLE invoices (
    invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(transaction_id),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    pdf_url VARCHAR(255),
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- REVIEWS TABLE
CREATE TABLE reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(booking_id),
    customer_id UUID NOT NULL REFERENCES users(user_id),
    provider_id UUID NOT NULL REFERENCES users(user_id),
    provider_service_id UUID NOT NULL REFERENCES provider_services(provider_service_id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    provider_response TEXT,
    provider_response_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(booking_id)
);

-- MESSAGES TABLE
CREATE TABLE messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(user_id),
    recipient_id UUID NOT NULL REFERENCES users(user_id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- NOTIFICATIONS TABLE
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    entity_type VARCHAR(50), -- e.g., 'booking', 'message', 'review'
    entity_id UUID, -- ID reference to the related entity
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- DEVICE TOKENS TABLE (for push notifications)
CREATE TABLE device_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    device_token VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_token)
);

-- PAYMENT METHODS TABLE
CREATE TABLE payment_methods (
    payment_method_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('stripe', 'paypal')),
    token_id VARCHAR(255), -- Token from payment provider
    last_four VARCHAR(4),
    card_type VARCHAR(50),
    expiry_month VARCHAR(2),
    expiry_year VARCHAR(4),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PROVIDER PAYOUT ACCOUNTS TABLE
CREATE TABLE provider_payout_accounts (
    payout_account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_profile_id UUID NOT NULL REFERENCES service_provider_profiles(provider_profile_id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('stripe', 'paypal')),
    account_id VARCHAR(255) NOT NULL, -- ID from payment provider
    is_verified BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index creation for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_service_subcategories_category_id ON service_subcategories(category_id);
CREATE INDEX idx_provider_profiles_user_id ON service_provider_profiles(user_id);
CREATE INDEX idx_provider_services_provider_profile_id ON provider_services(provider_profile_id);
CREATE INDEX idx_provider_services_subcategory_id ON provider_services(subcategory_id);
CREATE INDEX idx_provider_availability_provider_profile_id ON provider_availability(provider_profile_id);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_provider_service_id ON bookings(provider_service_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_transactions_booking_id ON transactions(booking_id);
CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);

-- Create trigger functions for updating timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables to update the updated_at timestamp
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_user_addresses_modtime BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_service_categories_modtime BEFORE UPDATE ON service_categories FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_service_subcategories_modtime BEFORE UPDATE ON service_subcategories FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_service_provider_profiles_modtime BEFORE UPDATE ON service_provider_profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_provider_services_modtime BEFORE UPDATE ON provider_services FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_provider_availability_modtime BEFORE UPDATE ON provider_availability FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_provider_blocked_dates_modtime BEFORE UPDATE ON provider_blocked_dates FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_portfolio_items_modtime BEFORE UPDATE ON portfolio_items FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_bookings_modtime BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_transactions_modtime BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_invoices_modtime BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_reviews_modtime BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_messages_modtime BEFORE UPDATE ON messages FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_notifications_modtime BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_device_tokens_modtime BEFORE UPDATE ON device_tokens FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_payment_methods_modtime BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_provider_payout_accounts_modtime BEFORE UPDATE ON provider_payout_accounts FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Trigger to update average rating when a new review is added
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
DECLARE
    provider_id UUID;
BEGIN
    -- Get the provider profile ID
    SELECT spp.provider_profile_id INTO provider_id
    FROM provider_services ps
    JOIN service_provider_profiles spp ON ps.provider_profile_id = spp.provider_profile_id
    WHERE ps.provider_service_id = NEW.provider_service_id;
    
    -- Update the average rating and total reviews
    UPDATE service_provider_profiles
    SET 
        average_rating = (
            SELECT AVG(rating)::DECIMAL(3,2)
            FROM reviews r
            JOIN provider_services ps ON r.provider_service_id = ps.provider_service_id
            WHERE ps.provider_profile_id = provider_id
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM reviews r
            JOIN provider_services ps ON r.provider_service_id = ps.provider_service_id
            WHERE ps.provider_profile_id = provider_id
        )
    WHERE provider_profile_id = provider_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE PROCEDURE update_provider_rating();

-- Sample seed data for categories and subcategories
INSERT INTO service_categories (name, description, icon_url) VALUES
('Home Services', 'Services for home maintenance and improvement', '/icons/home.svg'),
('Health & Wellness', 'Health and wellness related services', '/icons/health.svg'),
('Professional Services', 'Business and professional services', '/icons/professional.svg'),
('Beauty', 'Beauty and personal care services', '/icons/beauty.svg'),
('Education', 'Educational services and tutoring', '/icons/education.svg');

INSERT INTO service_subcategories (category_id, name, description) VALUES
((SELECT category_id FROM service_categories WHERE name = 'Home Services'), 'Plumbing', 'Plumbing installation and repair services'),
((SELECT category_id FROM service_categories WHERE name = 'Home Services'), 'Electrical', 'Electrical installation and repair services'),
((SELECT category_id FROM service_categories WHERE name = 'Home Services'), 'Cleaning', 'Home cleaning services'),
((SELECT category_id FROM service_categories WHERE name = 'Home Services'), 'Landscaping', 'Yard and garden services'),
((SELECT category_id FROM service_categories WHERE name = 'Health & Wellness'), 'Massage Therapy', 'Professional massage services'),
((SELECT category_id FROM service_categories WHERE name = 'Health & Wellness'), 'Personal Training', 'Fitness and training services'),
((SELECT category_id FROM service_categories WHERE name = 'Professional Services'), 'Accounting', 'Accounting and bookkeeping services'),
((SELECT category_id FROM service_categories WHERE name = 'Professional Services'), 'Legal Consultation', 'Legal advice and services'),
((SELECT category_id FROM service_categories WHERE name = 'Beauty'), 'Hair Styling', 'Hair cutting and styling services'),
((SELECT category_id FROM service_categories WHERE name = 'Beauty'), 'Nail Care', 'Manicure and pedicure services'),
((SELECT category_id FROM service_categories WHERE name = 'Education'), 'Tutoring', 'Academic subject tutoring'),
((SELECT category_id FROM service_categories WHERE name = 'Education'), 'Music Lessons', 'Instrumental and vocal music instruction');