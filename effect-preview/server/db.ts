import 'dotenv/config'
import pg from 'pg'
const raw=process.env.DATABASE_URL
if(!raw) throw new Error('Missing DATABASE_URL. See .env.example.')
const url=new URL(raw)
if(url.hostname!=='127.0.0.1'||url.port!=='5438'||url.pathname!=='/nail_studio') {
  throw new Error('This application only uses its isolated local nail_studio database at 127.0.0.1:5438.')
}
export const pool=new pg.Pool({connectionString:raw,max:5,connectionTimeoutMillis:3000})
export async function migrate(){
  const client=await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(432009)')
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`)
    const exists=await client.query('SELECT version FROM schema_migrations WHERE version=1')
    if(!exists.rowCount){
      await client.query(`CREATE TABLE designs (
        id uuid PRIMARY KEY, name varchar(60) NOT NULL,
        document jsonb NOT NULL CHECK (document->>'version'='1' AND jsonb_array_length(document->'nails')=10),
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      )`)
      await client.query(`CREATE TABLE drafts (
        id text PRIMARY KEY CHECK (id='local'), document jsonb NOT NULL,
        revision integer NOT NULL DEFAULT 1, updated_at timestamptz NOT NULL DEFAULT now()
      )`)
      await client.query('INSERT INTO schema_migrations(version) VALUES(1)')
    }
    await client.query('COMMIT')
  } catch(e){await client.query('ROLLBACK');throw e} finally{client.release()}
}
