// migrations/YYYYMMDDHHMM_convert_notifications_to_uuid.js
exports.up = async function(knex) {
  // 1) Drop FK constraints if they exist (safe)
  await knex.raw(`ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;`);
  await knex.raw(`ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_site_id_fkey;`);

  // 2) Drop old columns (bigint) if they exist
  await knex.raw(`
    ALTER TABLE public.notifications
      DROP COLUMN IF EXISTS user_id,
      DROP COLUMN IF EXISTS site_id;
  `);

  // 3) Add new uuid columns
  await knex.raw(`
    ALTER TABLE public.notifications
      ADD COLUMN IF NOT EXISTS user_id uuid,
      ADD COLUMN IF NOT EXISTS site_id uuid;
  `);

  // 4) Add foreign key constraints pointing to users(id) and websites(id)
  await knex.raw(`
    ALTER TABLE public.notifications
      ADD CONSTRAINT IF NOT EXISTS notifications_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users(id) ON DELETE CASCADE;
  `);

  await knex.raw(`
    ALTER TABLE public.notifications
      ADD CONSTRAINT IF NOT EXISTS notifications_site_id_fkey FOREIGN KEY (site_id)
        REFERENCES public.websites(id) ON DELETE CASCADE;
  `);

  // 5) Ensure vulnerabilities.updated_at exists (worker expects it)
  await knex.raw(`
    ALTER TABLE public.vulnerabilities
      ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
  `);

  // 6) Backfill updated_at with created_at for existing rows
  await knex.raw(`
    UPDATE public.vulnerabilities
      SET updated_at = COALESCE(updated_at, created_at);
  `);
};

exports.down = async function(knex) {
  // reverse: drop new constraints and columns, recreate bigint columns (nullable)
  await knex.raw(`ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;`);
  await knex.raw(`ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_site_id_fkey;`);

  await knex.raw(`
    ALTER TABLE public.notifications
      DROP COLUMN IF EXISTS user_id,
      DROP COLUMN IF EXISTS site_id;
  `);

  // recreate numeric columns so older app code that expects bigint won't break (nullable)
  await knex.raw(`
    ALTER TABLE public.notifications
      ADD COLUMN IF NOT EXISTS user_id bigint,
      ADD COLUMN IF NOT EXISTS site_id bigint;
  `);

  // drop updated_at in vulnerabilities (only if you want full rollback)
  await knex.raw(`
    ALTER TABLE public.vulnerabilities
      DROP COLUMN IF EXISTS updated_at;
  `);
};
