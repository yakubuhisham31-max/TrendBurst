#!/usr/bin/env node
import { Pool } from '@neondatabase/serverless';
import  ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

// Fix DATABASE_URL before using it
if (process.env.DATABASE_URL) {
  let url = process.env.DATABASE_URL;
  try { url = decodeURIComponent(url); } catch (e) {}
  url = url.replace(/^psql\s*'?/, '').replace(/'$/, '').trim();
  process.env.DATABASE_URL = url;
  console.log('✅ DATABASE_URL cleaned');
}

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDatabase() {
  try {
    console.log('🚀 Initializing database...');
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR NOT NULL UNIQUE,
        email VARCHAR UNIQUE,
        full_name VARCHAR,
        password VARCHAR NOT NULL,
        bio TEXT,
        profile_picture VARCHAR,
        categories VARCHAR[],
        role VARCHAR NOT NULL,
        followers_count INTEGER DEFAULT 0,
        following_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Users table created');

    // Create trends table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trends (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        name VARCHAR NOT NULL,
        description TEXT,
        instructions TEXT NOT NULL,
        rules TEXT[],
        category VARCHAR NOT NULL,
        cover_picture VARCHAR,
        views INTEGER DEFAULT 0,
        participants INTEGER DEFAULT 0,
        chat_count INTEGER DEFAULT 0,
        reference_media VARCHAR[],
        points_awarded INTEGER DEFAULT 0,
        end_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Trends table created');

    // Create posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        trend_id VARCHAR NOT NULL REFERENCES trends(id),
        image_url VARCHAR NOT NULL,
        caption TEXT,
        votes INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        is_disqualified INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Posts table created');

    // Create votes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id VARCHAR NOT NULL REFERENCES posts(id),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        trend_id VARCHAR NOT NULL REFERENCES trends(id),
        UNIQUE(post_id, user_id)
      );
    `);
    console.log('✅ Votes table created');

    // Create comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        post_id VARCHAR REFERENCES posts(id),
        trend_id VARCHAR REFERENCES trends(id),
        parent_id VARCHAR,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Comments table created');

    // Create follows table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS follows (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        follower_id VARCHAR NOT NULL REFERENCES users(id),
        following_id VARCHAR NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(follower_id, following_id)
      );
    `);
    console.log('✅ Follows table created');

    // Create view_tracking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS view_tracking (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        identifier TEXT NOT NULL,
        last_viewed_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ View tracking table created');

    // Create saved_trends table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_trends (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        trend_id VARCHAR NOT NULL REFERENCES trends(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Saved trends table created');

    // Create saved_posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_posts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        post_id VARCHAR NOT NULL REFERENCES posts(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Saved posts table created');

    // Create session table (for express-session)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        PRIMARY KEY (sid)
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON session (expire);
    `);
    console.log('✅ Session table created');

    console.log('\n🎉 Database initialized successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
