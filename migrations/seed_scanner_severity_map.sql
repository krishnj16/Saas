INSERT INTO scanner_severity_map (scanner, scanner_severity, normalized_severity) VALUES
('nikto', 'Info', 'low'),
('nikto', 'Low', 'low'),
('nikto', 'Medium', 'medium'),
('nikto', 'High', 'high'),
('nikto', 'Critical', 'critical'),
('zap', 'Low', 'low'),
('zap', 'Medium', 'medium'),
('zap', 'High', 'high'),
('burp', 'Informational', 'low'),
('burp', 'Low', 'low'),
('burp', 'Medium', 'medium'),
('burp', 'High', 'high')
ON CONFLICT DO NOTHING;
