/*
  # Add sample data for industries and skill categories

  1. Industries
    - Add common industry categories with descriptions
    - Industries cover major sectors like Technology, Finance, Healthcare etc.

  2. Skill Categories  
    - Add skill category groupings with descriptions
    - Categories cover major skill areas like Programming, Design, Management etc.
*/

-- Insert sample industries
INSERT INTO industries (name, description)
VALUES
  ('Technology', 'Software, hardware, and digital services companies'),
  ('Financial Services', 'Banking, insurance, and investment services'),
  ('Healthcare', 'Medical services, healthcare technology, and pharmaceuticals'),
  ('Manufacturing', 'Production and manufacturing of goods'),
  ('Retail', 'Consumer goods and retail services'),
  ('Education', 'Educational institutions and learning services'),
  ('Consulting', 'Professional services and business consulting'),
  ('Media & Entertainment', 'Digital media, entertainment, and content creation'),
  ('Energy', 'Energy production, utilities, and renewable resources'),
  ('Transportation', 'Transportation, logistics, and mobility services')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

-- Insert sample skill categories
INSERT INTO skill_categories (name, description)
VALUES
  ('Programming Languages', 'Core programming and scripting languages'),
  ('Web Development', 'Frontend and backend web technologies'),
  ('Mobile Development', 'Mobile app development platforms and frameworks'),
  ('Cloud & DevOps', 'Cloud platforms, infrastructure, and deployment'),
  ('Data & Analytics', 'Data science, analytics, and business intelligence'),
  ('Design & UX', 'User interface design and user experience'),
  ('Project Management', 'Project planning, execution, and delivery'),
  ('Business Analysis', 'Business requirements and process analysis'),
  ('Security', 'Information security and cybersecurity'),
  ('Quality Assurance', 'Testing, quality control, and automation'),
  ('Architecture', 'System architecture and technical design'),
  ('Artificial Intelligence', 'Machine learning and AI technologies'),
  ('Infrastructure', 'Network and system infrastructure'),
  ('Database', 'Database management and administration'),
  ('Leadership', 'Team leadership and management skills')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

-- Insert sample customer roles if they don't exist
INSERT INTO customer_roles (name, description)
VALUES
  ('Project Manager', 'Manages project delivery and client relationships'),
  ('Technical Lead', 'Leads technical implementation and architecture'),
  ('Developer', 'Implements technical solutions'),
  ('Business Analyst', 'Analyzes business requirements'),
  ('QA Engineer', 'Ensures quality and testing'),
  ('DevOps Engineer', 'Manages deployment and infrastructure'),
  ('UX Designer', 'Designs user experience and interfaces'),
  ('Product Owner', 'Owns product vision and backlog'),
  ('Scrum Master', 'Facilitates agile processes'),
  ('Solutions Architect', 'Designs technical solutions')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;