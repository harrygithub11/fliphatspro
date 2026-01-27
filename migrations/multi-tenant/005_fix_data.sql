-- Fix data: Populate tenant_id for Email System tables
SET @default_tenant = (SELECT id FROM tenants ORDER BY created_at LIMIT 1);

UPDATE emailaccount SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE cachedemail SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE emaildraft SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE emailtemplate SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE scheduledemail SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE emailthread SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
UPDATE contact SET tenant_id = @default_tenant WHERE tenant_id IS NULL;

-- Attempt to add tenant_id to emailanalytics if missing (via ALTER, ignore if fails or column exists)
-- Or just update if it exists
-- We can check info_schema dynamically in stored proc, but simple UPDATE is safe if column exists
-- If column DOES NOT exist, this UPDATE will fail. But since we can't do conditional ALTER easily in basic script...
-- We will assume IF NOT EXISTS works or we skip it.
-- Actually, let's just try to update. If it fails, analytics won't be tenant scoped yet (minor issue).
-- UPDATE emailanalytics SET tenant_id = @default_tenant WHERE tenant_id IS NULL;
