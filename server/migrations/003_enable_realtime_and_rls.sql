-- Enable Realtime on messages and replies tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE replies;

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read messages (needed for realtime subscriptions with anon key)
CREATE POLICY "messages_select_all" ON messages FOR SELECT USING (true);

-- Allow anyone to insert messages (anonymous message sending)
CREATE POLICY "messages_insert_all" ON messages FOR INSERT WITH CHECK (true);

-- Allow anyone to read replies
CREATE POLICY "replies_select_all" ON replies FOR SELECT USING (true);

-- Allow anyone to insert replies
CREATE POLICY "replies_insert_all" ON replies FOR INSERT WITH CHECK (true);

-- Keep full access for service_role (backend)
-- service_role bypasses RLS by default, so no extra policy needed
