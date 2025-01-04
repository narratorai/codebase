INSERT INTO tag_relations (value) VALUES
    ('dataset'),
    ('narrative'),
    ('metric')
ON CONFLICT (value) DO NOTHING;
