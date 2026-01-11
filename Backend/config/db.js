import 'dotenv/config';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'task_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

pool.getConnection()
  .then((connection) => {
    console.log('Database pool created successfully');
    console.log('Connected to MySQL database');
    connection.release();
  })
  .catch((error) => {
    console.error('Error connecting to database:', error.message);
  });

export default pool;
