-- Insert sample services
INSERT INTO services (title, description, commission_amount, materials_link) VALUES
('Basic Website (5 Pages)', 'Professional 5-page business website with contact form and mobile optimization', 50000.00, 'https://example.com/website-materials'),
('Logo Design', 'Custom logo design with 3 concepts and unlimited revisions', 25000.00, 'https://example.com/logo-materials'),
('Social Media Setup', 'Complete social media presence setup for Facebook, Instagram, and WhatsApp Business', 30000.00, 'https://example.com/social-materials'),
('E-commerce Store', 'Full e-commerce website with payment integration and product management', 100000.00, 'https://example.com/ecommerce-materials'),
('Digital Marketing Package', 'Monthly social media management and content creation', 75000.00, 'https://example.com/marketing-materials');

-- Insert sample agent (for testing)
INSERT INTO agents (full_name, phone_number, momo_number, region, isApproved) VALUES
('John Doe', '+233123456789', '+233123456789', 'Greater Accra', true);
