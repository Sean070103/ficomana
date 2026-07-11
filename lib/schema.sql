-- SQL Schema for FICO MANA Booking & Payment Verification System

-- Drop tables if they exist
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS receipts;
DROP TABLE IF EXISTS bookings;

-- Bookings table
CREATE TABLE bookings (
  id VARCHAR(50) PRIMARY KEY, -- Booking reference e.g. FM-123456
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_fb_link VARCHAR(255) NOT NULL DEFAULT '',
  customer_fb_name VARCHAR(255) NOT NULL DEFAULT '',
  drive_link TEXT,
  package_id VARCHAR(50) NOT NULL,
  package_name VARCHAR(100) NOT NULL,
  booking_date DATE NOT NULL,
  booking_time VARCHAR(50) NOT NULL,
  note TEXT,
  staff_notes TEXT,
  slot_id VARCHAR(50),
  arrival_time VARCHAR(50),
  shoot_time VARCHAR(100),
  is_walk_in BOOLEAN DEFAULT FALSE,
  receipt_url TEXT,
  payment_history JSONB DEFAULT '[]'::jsonb,
  school_name VARCHAR(200),
  course VARCHAR(200),
  hood_color VARCHAR(100),
  toga_color VARCHAR(100),
  tassel_color VARCHAR(100),
  background_color VARCHAR(100),
  deposit_amount DECIMAL(10, 2) DEFAULT 500.00,
  price DECIMAL(10, 2) NOT NULL,
  transaction_ref VARCHAR(100),
  booking_status VARCHAR(50) DEFAULT 'Pending Payment', 
  -- Statuses: 'Pending Payment', 'Pending Verification', 'Confirmed', 'Rejected', 'Cancelled', 'Completed', 'No Show'
  payment_status VARCHAR(50) DEFAULT 'Unpaid',
  -- Statuses: 'Unpaid', 'Pending Verification', 'Paid Deposit', 'Paid Full', 'Refunded'
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Receipts table
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id VARCHAR(50) REFERENCES bookings(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL, -- Public path or Supabase Storage link
  file_name VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id VARCHAR(50) REFERENCES bookings(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- e.g. 'NEW_BOOKING', 'RECEIPT_UPLOAD', 'CANCELLED', 'RESUBMITTED'
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Logs table (for tracking notifications)
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id VARCHAR(50) REFERENCES bookings(id) ON DELETE CASCADE,
  recipient_email VARCHAR(100) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'SENT', -- e.g. 'SENT', 'FAILED'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments ledger table
CREATE TABLE payments (
  id VARCHAR(50) PRIMARY KEY,
  booking_id VARCHAR(50) REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  method VARCHAR(50) NOT NULL, -- e.g. 'Cash', 'GCash', 'Card', 'Maya', 'Bank Transfer'
  payment_type VARCHAR(50) NOT NULL, -- e.g. 'Deposit', 'Balance Payment'
  transaction_ref VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Per-slot blocks (studio stays open; admin blocks individual MANA session slots)
CREATE TABLE blocked_slots (
  date DATE NOT NULL,
  slot_id VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  PRIMARY KEY (date, slot_id)
);

-- Admin-held FICO daily spots (reduces bookable capacity without closing the day)
CREATE TABLE fico_spot_blocks (
  date DATE PRIMARY KEY,
  spots_blocked INTEGER NOT NULL DEFAULT 0 CHECK (spots_blocked >= 0 AND spots_blocked <= 10),
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

-- Packages catalog (synced with lib/packages-seed.ts)
CREATE TABLE packages (
  id VARCHAR(50) PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  price_display VARCHAR(50) NOT NULL,
  price_amount DECIMAL(10, 2) NOT NULL,
  duration VARCHAR(100),
  description TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  slot_type VARCHAR(20) NOT NULL DEFAULT 'standard',
  secondary_price_display VARCHAR(50),
  secondary_price_amount DECIMAL(10, 2),
  secondary_price_label TEXT,
  book_variants JSONB,
  note TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Packages catalog (synced with lib/packages-seed.ts)
CREATE TABLE packages (
  id VARCHAR(50) PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  price_display VARCHAR(50) NOT NULL,
  price_amount DECIMAL(10, 2) NOT NULL,
  duration VARCHAR(100),
  description TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  slot_type VARCHAR(20) NOT NULL DEFAULT 'standard',
  secondary_price_display VARCHAR(50),
  secondary_price_amount DECIMAL(10, 2),
  secondary_price_label TEXT,
  book_variants JSONB,
  note TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
