import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: { sizeLimit: '15mb' },
  },
}

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxf4-EkMy2OK3a-2EdSAdxQ6kwM-awwCLKOqnvbDHKX0U4c6WL--NetQF0ozGuKXJ-f/exec'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { b64data, filename, profileId, mimeType, uploadedBy } = req.body

    if (!b64data || !filename || !profileId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Call Apps Script from server-side — no CORS restriction
    const scriptResp = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPLOAD_CV',
        b64data,
        filename,
        id: profileId,
        name: uploadedBy || 'Candidate',
        mimeType: mimeType || 'application/pdf',
        uploadedBy: uploadedBy || 'Recruiter'
      })
    })

    if (!scriptResp.ok) {
      throw new Error('Apps Script error: ' + scriptResp.status)
    }

    const result = await scriptResp.json()
    
    if (result.status === 'error') {
      throw new Error(result.message || 'Upload failed')
    }

    const driveLink = result.driveLink || ''
    
    if (!driveLink) {
      throw new Error('No drive link returned')
    }

    return res.status(200).json({ success: true, driveLink })

  } catch (error: any) {
    console.error('upload-cv error:', error.message)
    return res.status(500).json({ error: error.message })
  }
}
