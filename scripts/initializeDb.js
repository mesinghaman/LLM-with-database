 

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
 
dotenv.config();
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const tmpDir = path.join(rootDir, 'tmp');
const repoDir = path.join(tmpDir, 'RAGmonsters');
const postgresqlDir = path.join(repoDir, 'postgresql');
 
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.POSTGRESQL_ADDON_URI,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

 
function execCommand(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command}`);
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.warn(`Warning: ${stderr}`);
      }
      resolve(stdout);
    });
  });
}

 
async function executeSqlFile(filePath) {
  try {
    console.log(`Executing SQL file: ${filePath}`);
    const sql = await fs.readFile(filePath, 'utf8');
    const client = await pool.connect();
    try {
      await client.query(sql);
      console.log(`Successfully executed: ${path.basename(filePath)}`);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error executing SQL file ${filePath}:`, error);
    throw error;
  }
}

 
async function emptyDatabase() {
  try {
    console.log('Emptying database...');
    const client = await pool.connect();
    try { 
      const tableCheckResult = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'monsters' AND table_schema = 'public'
        );`
      );
      
      const ragmonstersTablesExist = tableCheckResult.rows[0].exists;
      
      if (!ragmonstersTablesExist) {
        console.log('No RAGmonsters tables found. Database is ready for initialization.');
        return;
      }
      
      console.log('RAGmonsters tables found. Dropping them...');
       
      await client.query('BEGIN;');
       
      await client.query('SET CONSTRAINTS ALL DEFERRED;');
       
      const tablesToDrop = [
        'hindrances',
        'augments',
        'flaws',
        'abilities',
        'keywords',
        'questworlds_stats',
        'monsters'
      ];
      
      for (const tableName of tablesToDrop) {
        console.log(`Dropping table: ${tableName}`);
        await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
      }
      
      await client.query('COMMIT;');
      console.log('Database emptied successfully.');
    } catch (error) {
      await client.query('ROLLBACK;');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error emptying database:', error);
    throw error;
  }
}
 
async function initializeDatabase() {
  try { 
    await fs.mkdir(tmpDir, { recursive: true }); 
    try {
      await fs.access(repoDir);
      console.log('RAGmonsters repository already exists. Updating...');
      await execCommand('git pull', repoDir);
    } catch (error) { 
      console.log('Cloning RAGmonsters repository...');
      await execCommand(`git clone https://github.com/LostInBrittany/RAGmonsters.git`, tmpDir);
    }
     
    try {
      await fs.access(postgresqlDir);
    } catch (error) {
      console.error('PostgreSQL directory not found in RAGmonsters repository');
      throw error;
    }
     
    try {
      const client = await pool.connect();
      console.log('Successfully connected to PostgreSQL database');
      client.release();
    } catch (error) {
      console.error('Error connecting to PostgreSQL database:', error.message);
      console.error('Please check your POSTGRESQL_ADDON_URI environment variable');
      process.exit(1);
    } 
    await emptyDatabase();
     
    console.log('Initializing database with RAGmonsters schema...');
     
    await executeSqlFile(path.join(postgresqlDir, 'ragmonsters_schema.sql'));
     
    const datasetDir = path.join(postgresqlDir, 'dataset');
    const monsterFiles = await fs.readdir(datasetDir);
    
    console.log(`Found ${monsterFiles.length} monster files to import`);
     
    for (const monsterFile of monsterFiles) {
      if (monsterFile.endsWith('.sql')) {
        await executeSqlFile(path.join(datasetDir, monsterFile));
      }
    }
    
    console.log('Database initialization completed successfully!');
     
    await pool.end();
    
    console.log('\nYou can now start the application with:');
    console.log('npm run dev');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}
 
initializeDatabase();