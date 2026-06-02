-- Add free_tier column to models table (exists only in model_aliases so far)
ALTER TABLE models ADD COLUMN free_tier BOOLEAN DEFAULT FALSE COMMENT 'Available on free tier' AFTER agents_enabled;
-- Mark Ollama models as visible and free tier for anonymous users
UPDATE models SET free_tier = TRUE, is_visible = TRUE WHERE provider_id = (SELECT id FROM providers WHERE name = 'Ollama' LIMIT 1);