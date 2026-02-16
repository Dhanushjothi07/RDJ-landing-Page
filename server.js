import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5005;

app.use(cors());
app.use(bodyParser.json());

const DB_PATH = path.resolve(__dirname, 'contacts.db');

// Database setup
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`
            CREATE TABLE IF NOT EXISTS submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT,
                name TEXT,
                phone TEXT,
                email TEXT,
                requirement TEXT,
                message TEXT
            )
        `, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            }
        });
    }
});

// Diagnostic endpoint
app.get('/api/diag', (req, res) => {
    db.all('SELECT * FROM submissions ORDER BY id DESC LIMIT 5', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        db.get('SELECT COUNT(*) as count FROM submissions', [], (err, countRow) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({
                exists: fs.existsSync(DB_PATH),
                path: DB_PATH,
                rowCount: countRow ? countRow.count : 0,
                lastRows: rows
            });
        });
    });
});

// Function to export database to Excel
const exportToExcel = () => {
    const EXCEL_PATH = path.resolve(__dirname, 'contact_form.xlsx');

    db.all('SELECT * FROM submissions', [], (err, rows) => {
        if (err) {
            console.error('Error fetching data for Excel export:', err.message);
            return;
        }

        try {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(rows);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
            XLSX.writeFile(workbook, EXCEL_PATH);
            console.log(`Excel file updated: ${EXCEL_PATH}`);
        } catch (error) {
            console.error('Error creating/writing Excel file:', error);
        }
    });
};

// Function to post data to Google Sheets
const postToGoogleSheet = async (data) => {
    const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxeu7MYzvgoKisbcmC8f9Oy49gDIXdfyxs3-r7zuEBECdRAUouvfU7UdDkap3uruabI/exec';
    try {
        const response = await axios.post(GOOGLE_SHEET_URL, data);
        console.log('Data posted to Google Sheet successfully:', response.status);
    } catch (error) {
        console.error('Error posting to Google Sheet:', error.message);
    }
};

app.post('/api/contact', (req, res) => {
    console.log('Received contact request:', req.body);
    const { name, phone, email, requirement, message } = req.body;

    if (!name || !email || !phone || !requirement) {
        return res.status(400).json({ error: 'All fields except message are required.' });
    }

    const currentDate = new Date().toLocaleString();

    db.run(
        `INSERT INTO submissions (date, name, phone, email, requirement, message) VALUES (?, ?, ?, ?, ?, ?)`,
        [currentDate, name, phone, email, requirement, message || ''],
        function (err) {
            if (err) {
                console.error('DATABASE ERROR:', err);
                return res.status(500).json({ error: 'Error saving to database: ' + err.message });
            }
            console.log(`Data saved to SQL database with ID: ${this.lastID}`);

            // Step 2 & 3: Create Excel and copy data
            exportToExcel();

            // Step 4: Post to Google Sheets
            postToGoogleSheet({ date: currentDate, name, phone, email, requirement, message: message || '' });

            res.status(200).json({
                status: 'success',
                message: 'Data saved successfully to SQL, Excel, and Google Sheets',
                id: this.lastID
            });
        }
    );
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Database file location: ${DB_PATH}`);
});
