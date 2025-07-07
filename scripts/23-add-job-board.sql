-- Create jobs table for the job board feature
CREATE TABLE IF NOT EXISTS jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_title VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    application_deadline DATE NOT NULL,
    location VARCHAR(255) NOT NULL,
    salary_type VARCHAR(20) NOT NULL CHECK (salary_type IN ('negotiable', 'fixed_range', 'exact_amount')),
    salary_min DECIMAL(10,2),
    salary_max DECIMAL(10,2),
    salary_exact DECIMAL(10,2),
    salary_currency VARCHAR(10) DEFAULT 'GHS',
    employer_name VARCHAR(255) NOT NULL,
    application_method VARCHAR(20) NOT NULL CHECK (application_method IN ('email', 'hyperlink')),
    application_contact TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_industry ON jobs(industry);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs(application_deadline);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active);

-- Insert sample job data
INSERT INTO jobs (
    job_title, 
    industry, 
    description, 
    application_deadline, 
    location, 
    salary_type, 
    salary_min, 
    salary_max, 
    salary_currency, 
    employer_name, 
    application_method, 
    application_contact,
    is_featured
) VALUES 
(
    'Digital Marketing Specialist',
    'Marketing',
    '**Key Responsibilities:**
• Develop and execute digital marketing campaigns
• Manage social media accounts and content creation
• Analyze marketing metrics and prepare reports
• Collaborate with design team on marketing materials

**Requirements:**
• Bachelor''s degree in Marketing or related field
• 2+ years experience in digital marketing
• Proficiency in Google Analytics and social media platforms
• Strong communication and analytical skills',
    '2024-02-15',
    'Accra, Greater Accra',
    'fixed_range',
    2500.00,
    4000.00,
    'GHS',
    'TechGhana Solutions',
    'email',
    'careers@techghana.com',
    true
),
(
    'Software Developer',
    'Technology',
    '**Job Description:**
We are seeking a talented Software Developer to join our growing team.

**Key Responsibilities:**
• Develop and maintain web applications
• Write clean, efficient, and well-documented code
• Participate in code reviews and team meetings
• Troubleshoot and debug applications

**Requirements:**
• Bachelor''s degree in Computer Science or related field
• Experience with JavaScript, React, and Node.js
• Knowledge of database systems (MySQL, PostgreSQL)
• Strong problem-solving skills',
    '2024-02-20',
    'Kumasi, Ashanti',
    'exact_amount',
    NULL,
    NULL,
    5000.00,
    'GHS',
    'Innovate Tech Hub',
    'hyperlink',
    'https://innovatetechhub.com/careers/software-developer',
    false
),
(
    'Customer Service Representative',
    'Customer Service',
    '**Position Overview:**
Join our customer service team and help provide excellent support to our clients.

**Responsibilities:**
• Handle customer inquiries via phone, email, and chat
• Resolve customer complaints and issues
• Maintain accurate customer records
• Provide product information and support

**Requirements:**
• High school diploma or equivalent
• Excellent communication skills in English and local languages
• Previous customer service experience preferred
• Patience and problem-solving abilities',
    '2024-02-10',
    'Tema, Greater Accra',
    'negotiable',
    NULL,
    NULL,
    NULL,
    'GHS',
    'Ghana Customer Care Ltd',
    'email',
    'hr@ghanacustomercare.com',
    false
),
(
    'Accountant',
    'Finance',
    '**Job Summary:**
We are looking for a detail-oriented Accountant to join our finance team.

**Key Duties:**
• Prepare financial statements and reports
• Manage accounts payable and receivable
• Assist with budget preparation and analysis
• Ensure compliance with financial regulations
• Support month-end and year-end closing processes

**Qualifications:**
• Bachelor''s degree in Accounting or Finance
• Professional certification (ACCA, CPA) preferred
• 3+ years of accounting experience
• Proficiency in accounting software (QuickBooks, SAP)
• Strong attention to detail and analytical skills',
    '2024-02-25',
    'Accra, Greater Accra',
    'fixed_range',
    3000.00,
    5500.00,
    'GHS',
    'Financial Services Ghana',
    'email',
    'jobs@financialservicesgh.com',
    true
),
(
    'Sales Executive',
    'Sales',
    '**Role Description:**
Dynamic Sales Executive needed to drive business growth and client acquisition.

**Responsibilities:**
• Identify and pursue new business opportunities
• Build and maintain client relationships
• Achieve monthly and quarterly sales targets
• Prepare sales proposals and presentations
• Attend networking events and trade shows

**Requirements:**
• Bachelor''s degree in Business, Marketing, or related field
• 2+ years of sales experience
• Excellent negotiation and communication skills
• Self-motivated with strong work ethic
• Valid driver''s license',
    '2024-02-18',
    'Takoradi, Western',
    'fixed_range',
    2000.00,
    3500.00,
    'GHS',
    'West Coast Trading Co.',
    'hyperlink',
    'https://westcoasttrading.com/careers',
    false
);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_jobs_updated_at();
