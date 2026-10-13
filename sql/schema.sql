-- Sanjivani Sugar Factory - Sugarcane Farmer Database Schema
-- Database: sanjivani_sugar_factory

CREATE TABLE IF NOT EXISTS farmers (
  farmer_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  village VARCHAR(255) NOT NULL,
  sugarcane_supplied_tons NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  payment_pending NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

-- Seed Sample Records (10 distinct farmers)
INSERT INTO farmers (name, village, sugarcane_supplied_tons, amount_paid, payment_pending) VALUES
  ('Ramesh Shinde', 'Kopargaon', 125.50, 80000.00, 45000.00),
  ('Suresh Pawar', 'Yeola', 98.00, 68600.00, 0.00),
  ('Vijay Jadhav', 'Rahata', 160.75, 112525.00, 32000.00),
  ('Ashok More', 'Shirdi', 85.25, 59675.00, 15000.00),
  ('Prakash Wagh', 'Kolpewadi', 210.00, 147000.00, 60000.00),
  ('Sunil Gaikwad', 'Loni', 135.50, 94850.00, 0.00),
  ('Dattatray Patil', 'Sangamner', 175.00, 122500.00, 25000.00),
  ('Ganesh Bhosale', 'Pohegaon', 110.25, 77175.00, 18500.00),
  ('Mahesh Chavan', 'Vaijapur', 145.00, 101500.00, 40000.00),
  ('Nitin Deshmukh', 'Kopargaon', 190.50, 133350.00, 0.00)
ON CONFLICT DO NOTHING;
