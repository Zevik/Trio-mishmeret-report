// Super simple version of server for Netlify
'use strict';

const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

// Pre-defined data for fallback
const FALLBACK_USERS = [
  { id: '204248272', name: 'יהונתן בוורסקי גולן' },
  { id: '123456789', name: 'ישראל ישראלי' }
];

// Create app with wide CORS
const app = express();
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
  credentials: true
}));
app.use(express.json());

// Always log incoming requests
app.use((req, res, next) => {
  console.log(`[Netlify] ${req.method} ${req.path}`);
  next();
});

// Initialize Google Sheets - simpler credentials
const CREDENTIALS = {
  type: "service_account",
  project_id: "cursor-1-435620",
  private_key_id: "3faedd72904b4ba10f4d6efac68f81107d6fa336",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCuK2os2fI/WlPy\nvMNwnKmEOrzHbW7o2HrGH7zSnVtkyqGszhwz3THWw78vw9zFImatJZoOJPAkrPyR\nBwj+40piXfUFZDWrhjYwA8FimNeCWLRW25//MSEDDxByhRUSTyN5+eoZ3gyZ2CMV\naXGB59fGyfLyQriuMncm3xnIt1+T288X9sYOPZJJcMxrmX3F+ud5OG5r9m+NRmKl\nW9/YEyFiGe+dCpNecdc+TaZcZfc76kv0SopGewsCbWa+NpcEbsUXPHeBOIK8x7KS\nlIm/ezWuDp98cXHTzcz2wp6lS39BEK2w3zG1FVHfnNvj8vIFJpCSbxYtHg8zf3hQ\nk+bMEguZAgMBAAECggEAOQhtbb92tKkrCTcn1pXuaqbjT3i101ikJ4GYDu3JUkGK\nXLBnitI5ckbKMeV0wzcHIVbJUi1lV9UvpXwExZZ/MqPqyresXX0G/IUWS+eZ1oye\njTzA8UtQsJQ7wgxzQHoat2QPdSYBwVUF9AqByVS2k1lpDUys9hn/a4KuCkyF50AO\njblEVtjT1qrlUqdAJexxUHRj7/waEsfKV7ZPkNDSCJiVKCbIBlqbq+/kKVkmUcrb\ndZpuNLd3mHGDtRQhU95efdCrBrivFyp4gDrh7ieiXcs6MpkM4EzsFrwhX/d/ksDm\neIO+LCeQ1dVArpUtWG5kO3xldXnOiRoAzfr+sR/MqwKBgQDVQESINta75P7WyxqS\nMSl2tDE+nD8Qs18Yjlz73/jQ3p7iBxKJfs4Yl7hYKwgAnORUMMffEFC9Owce09/K\n6Xs+fX25jRPA/g7Fjvh9qwKCTwqqSIguZYnjmb9j6VtFbWgO2eYt5OEAwIXvDIaq\nSFmoQUQTeIfDUrXhi7Z4cjHt5wKBgQDRFYsykr4z1NkrGoP6/1F1Yyk3GHC4kFbx\nP9afB9OQ6CEbMBvb4tdIgB4lhLdqh2n2+I22FUBZxLzy0EU4n1d8UM9Xy8SKZZCp\n8QaWku9TySnhP3GHBw8Ub8rDQNDaODzJXH2BwoBN1hPlIaVusitAS0qfb0h0S1R0\nTPhVqa4KfwKBgCj+9O3W1QtEJ7W1UANgzh7S31CxCvKz+QkofTmywgutcI/1Whvy\ns75IlJjmlOBBSSfiRNpeMZdfXKwRgUlp/1ZxG5VrSKvma4KRTLYkBRR2C4/W5887\nl/mYWhHkD7bWJJYOT9Ds2lChsl3VY6IizJGrEmJH3pmvMeYNTOP02CJrAoGBAJIC\nH3CztQtxCi7ll2ECRxpYowGMmbrpYS2bzP7FcmLxF51q3SmSoZBJl8PPiF5mLgN/\n00ZiVMvbba+K7av66hcwP3sqGxgikQF8BYPFHEhAZHSd32PR9B/raYcsjiy1tQ1Q\n/3xMHVk9tCsAcgx5c2a0rWnlRo2fxVxqG8mGcrl1AoGAQ5W2vseHeSmGH3KlEHMj\nWexCGVL6RgxOrXiucWU/LCbSktBvDe5ne2DJMCNFUGQCS9kxHgAP5wsaSSvRC2/Q\nWH7ykFhMMaOcEfm1+/PGUOn+cfN5kejtszy5QDyNmE9Y/vpmvysE+k82btx8Q3Bx\nrypcfhOP9SfbI2z7mI4mtYU=\n-----END PRIVATE KEY-----\n",
  client_email: "aliexpress-api@cursor-1-435620.iam.gserviceaccount.com"
};

const SPREADSHEET_ID = '1UxQn7mAinamXXZ6WuK0Zp8aRdfYqXCQ6mf-n4fYVZ8c';
const auth = new google.auth.JWT(
  CREDENTIALS.client_email,
  null,
  CREDENTIALS.private_key,
  ['https://www.googleapis.com/auth/spreadsheets.readonly']
);
const sheets = google.sheets({ version: 'v4', auth });

// Basic Routes - with explicit handling for Netlify common paths

// For User ID Lookups - /user/:userId
app.get('/user/:userId', userLookup);
app.get('/api/user/:userId', userLookup);

// For Sheets - /sheets/:sheetName
app.get('/sheets/:sheetName', fetchSheet);
app.get('/api/sheets/:sheetName', fetchSheet);

// For Form Submission
app.post('/sheets/submit', handleSubmit);
app.post('/api/sheets/submit', handleSubmit);

// Root route for checking if API is alive
app.get('/', (req, res) => {
  res.json({ status: 'Netlify Functions API is running' });
});

// User Lookup Function
async function userLookup(req, res) {
  try {
    const { userId } = req.params;
    console.log(`Looking up user ID: ${userId}`);

    // Try to find in fallback first for quicker response
    const fallbackUser = FALLBACK_USERS.find(u => u.id === userId);
    if (fallbackUser) {
      console.log(`Found user in fallback: ${fallbackUser.name}`);
      return res.json({ name: fallbackUser.name });
    }

    try {
      // Get data from sheet
      const data = await fetchSheetData('Medic_card');
      const user = data.find(row => (row.Column_B || '').trim() === userId.trim());
      
      if (user) {
        console.log(`Found user in sheet: ${user.Column_A}`);
        return res.json({ name: user.Column_A });
      } else {
        console.log(`User not found: ${userId}`);
        return res.status(404).json({ error: 'User not found' });
      }
    } catch (sheetError) {
      console.error('Error fetching from sheet:', sheetError);
      // If sheet fetch fails, return default demo data
      if (userId === '204248272') {
        return res.json({ name: 'יהונתן בוורסקי גולן' });
      }
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error in user lookup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Fetch Sheet Function
async function fetchSheet(req, res) {
  try {
    const { sheetName } = req.params;
    console.log(`Fetching sheet: ${sheetName}`);
    
    const data = await fetchSheetData(sheetName);
    return res.json(data);
  } catch (error) {
    console.error(`Error fetching sheet ${req.params.sheetName}:`, error);
    res.status(500).json({ error: 'Failed to fetch sheet data' });
  }
}

// Form Submission Handler
async function handleSubmit(req, res) {
  try {
    console.log('Form submission received:', req.body);
    
    // Always return success in Netlify (simulated)
    return res.json({ 
      success: true, 
      simulatedSuccess: true,
      message: 'Form submitted successfully (simulated in Netlify environment)'
    });
  } catch (error) {
    console.error('Error handling form submission:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
}

// Helper to fetch data from Google Sheets
async function fetchSheetData(sheetName) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`
    });
    
    const rows = response.data.values || [];
    if (rows.length === 0) {
      return [];
    }
    
    const headers = rows[0];
    return rows.slice(1).map(row => {
      const rowData = {};
      headers.forEach((header, i) => {
        rowData[`col_${i}`] = row[i] || '';
        rowData[`Column_${String.fromCharCode(65 + i)}`] = row[i] || '';
      });
      return rowData;
    });
  } catch (error) {
    console.error(`Error fetching ${sheetName}:`, error);
    throw error;
  }
}

// Generic error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Catch-all route for any other requests
app.use('*', (req, res) => {
  console.log(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Not Found' });
});

// Export the serverless handler
module.exports.handler = serverless(app);