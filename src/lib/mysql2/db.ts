import mysql from "mysql2/promise";

let connection: mysql.Pool | undefined;

function getConnection(): mysql.Pool {
    if (!connection) {
        connection = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,      
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        
        console.log("Database pool created");
    }
    
    return connection;
}

const db = getConnection();

export default db;