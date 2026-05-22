-- OJT Buddy Database Schema

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  course VARCHAR(100) DEFAULT 'BS Information Technology',
  batch VARCHAR(20),
  ojt_start_date DATE,
  required_hours INTEGER DEFAULT 486,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  address TEXT,
  contact_person VARCHAR(100),
  email VARCHAR(150),
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'wishlist' CHECK (status IN ('wishlist','applied','interview','accepted','rejected')),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('high','normal','low')),
  notes TEXT,
  applied_at DATE,
  deadline DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE document_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

INSERT INTO document_types (name, description) VALUES
  ('Letter of Intent', 'Formal letter expressing your intent to apply for OJT'),
  ('Endorsement Letter', 'Letter from your school endorsing you for OJT'),
  ('Medical Certificate', 'Certificate of good health from a licensed physician'),
  ('NBI Clearance', 'National Bureau of Investigation clearance'),
  ('Memorandum of Agreement', 'MOA signed between school and company'),
  ('Resume / CV', 'Your updated curriculum vitae'),
  ('OJT Insurance', 'Student accident insurance for the OJT period'),
  ('Barangay Clearance', 'Clearance from your local barangay');

CREATE TABLE company_documents (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  doc_type_id INTEGER REFERENCES document_types(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','prepared','submitted')),
  submitted_at DATE,
  notes TEXT
);

CREATE TABLE logbook_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  location VARCHAR(150),
  tasks_done TEXT,
  mood VARCHAR(20) CHECK (mood IN ('great','good','okay','tired','rough')),
  hours_rendered NUMERIC(4,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

CREATE TABLE interview_questions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  sample_answer TEXT,
  category VARCHAR(50),
  is_default BOOLEAN DEFAULT TRUE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_question_confidence (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES interview_questions(id) ON DELETE CASCADE,
  confidence VARCHAR(20) DEFAULT 'not-practiced' CHECK (confidence IN ('confident','needs-practice','not-practiced')),
  UNIQUE(user_id, question_id)
);

CREATE TABLE batch_shares (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  review TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Default interview questions
INSERT INTO interview_questions (question, sample_answer, category, is_default) VALUES
  ('Tell me about yourself.', 'Start with your name, course, year, and key skills. Mention a notable project briefly.', 'General', TRUE),
  ('Why do you want to intern here?', 'Research the company and connect their work to your skills and goals.', 'General', TRUE),
  ('What programming languages do you know?', 'List your languages with honest proficiency levels. Mention real projects.', 'Technical', TRUE),
  ('Describe a project you built.', 'Use the STAR method: Situation, Task, Action, Result.', 'Technical', TRUE),
  ('What is your greatest strength?', 'Choose a strength relevant to IT work and back it with an example.', 'General', TRUE),
  ('What is your greatest weakness?', 'Be honest but show self-awareness and what you are doing to improve.', 'General', TRUE),
  ('How do you handle deadlines?', 'Talk about prioritization, time management, and a real example.', 'Behavioral', TRUE),
  ('Are you comfortable working in a team?', 'Yes — give an example of successful group work (e.g., a school project).', 'Behavioral', TRUE),
  ('Where do you see yourself in 5 years?', 'Show ambition but stay grounded — mention growth in tech.', 'General', TRUE),
  ('Do you have any questions for us?', 'Always prepare 2-3 questions about the team, work culture, or tech stack.', 'General', TRUE),
  ('What do you know about REST APIs?', 'Explain the concept of client-server, HTTP methods, and JSON responses.', 'Technical', TRUE),
  ('Explain the difference between frontend and backend.', 'Frontend is what users see (HTML/CSS/JS). Backend is server logic and database.', 'Technical', TRUE);
