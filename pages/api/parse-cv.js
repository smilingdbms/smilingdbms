import { IncomingForm } from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'File upload parsing failed' });
    
    try {
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      
      // 1. Google Drive Auth & Upload with strict error handling
      let credentials;
      try {
        credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      } catch (e) {
        throw new Error("Invalid GOOGLE_CREDENTIALS format in Vercel. Must be strict JSON.");
      }

      const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/drive.file'] });
      const drive = google.drive({ version: 'v3', auth });
      
      const driveRes = await drive.files.create({
        resource: { name: file.originalFilename, parents: ['1w16tKf7PwTtr84D3YVXwowWTkv8ahlQ2'] },
        media: { mimeType: file.mimetype, body: fs.createReadStream(file.filepath) },
        fields: 'id, webViewLink'
      });
      
      // 2. Read PDF
      const pdfData = await pdfParse(fs.readFileSync(file.filepath));
      
      // 3. Gemini Parsing
      const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.NEXT_PUBLIC_GEMINI_KEY;
      if (!apiKey) throw new Error("Gemini API Key missing in Vercel Environment Variables.");

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Extract details from this resume text. Return ONLY a valid JSON object. Do not use markdown blocks. Keys must be exactly: name, mobile, email, location, experienceYears, experienceMonths, ctcLakhs, ctcThousands, noticePeriod, headline, summary, skills. Skills should be a comma separated string. Text: ${pdfData.text.substring(0, 15000)}`;
      
      const result = await model.generateContent(prompt);
      let responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      
      let parsedJson;
      try {
        parsedJson = JSON.parse(responseText);
      } catch (e) {
        throw new Error("AI returned invalid JSON format.");
      }
      
      res.status(200).json({ ...parsedJson, cv_url: driveRes.data.webViewLink });
    } catch (error) { 
      res.status(500).json({ error: error.message }); 
    }
  });
}