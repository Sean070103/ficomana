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
