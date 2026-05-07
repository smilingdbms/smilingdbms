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
    if (err) return res.status(500).json({ error: 'File upload failed' });
    
    try {
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      const filePath = file.filepath;
      
      // 1. Google Drive Upload
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/drive.file'] });
      const drive = google.drive({ version: 'v3', auth });
      const driveRes = await drive.files.create({
        resource: { name: file.originalFilename, parents: ['1w16tKf7PwTtr84D3YVXwowWTkv8ahlQ2'] },
        media: { mimeType: file.mimetype, body: fs.createReadStream(filePath) },
        fields: 'id, webViewLink'
      });
      
      // 2. Read PDF
      const pdfData = await pdfParse(fs.readFileSync(filePath));
      
      // 3. AI Parsing (Supports both Key names)
      const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.NEXT_PUBLIC_GEMINI_KEY;
      if (!apiKey) throw new Error("Gemini Key is missing in Vercel settings.");

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Extract info from this resume. Return ONLY a JSON object. Keys required: name, mobile, email, location, experienceYears, experienceMonths, ctcLakhs, ctcThousands, noticePeriod, headline, summary, skills (comma separated string). Text: ${pdfData.text.substring(0, 15000)}`;
      
      const result = await model.generateContent(prompt);
      let responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Return parsed data + Drive URL
      res.status(200).json({ ...JSON.parse(responseText), cv_url: driveRes.data.webViewLink });
      
    } catch (error) { 
      console.error("System Error:", error);
      res.status(500).json({ error: error.message }); 
    }
  });
}