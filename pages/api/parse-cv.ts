import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' },
  },
}

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxf4-EkMy2OK3a-2EdSAdxQ6kwM-awwCLKOqnvbDHKX0U4c6WL--NetQF0ozGuKXJ-f/exec'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const body = req.body
    const action = (body.action || '').toUpperCase()

    // Handle CV upload to Supabase Storage
    if (action === 'UPLOAD_CV_STORAGE') {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { b64data, filename, profileId, mimeType } = body
      if (!b64data || !filename || !profileId) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(b64data, 'base64')
      const filePath = `cvs/${profileId}/${filename}`
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, buffer, {
          contentType: mimeType || 'application/pdf',
          upsert: true
        })

      if (uploadError) throw new Error('Storage upload failed: ' + uploadError.message)

      // Get public URL
      const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(filePath)
      const publicUrl = urlData.publicUrl

      // Update profile with resume URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ resume_url: publicUrl, resume_name: filename })
        .eq('id', profileId)

      if (updateError) throw new Error('Profile update failed: ' + updateError.message)

      // Sync updated URL to Google Sheets
      try {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'UPDATE_DRIVE_LINK',
            profileId,
            driveLink: publicUrl,
            filename
          })
        })
      } catch(e) { console.warn('Sheets drive link update failed:', e) }

      return res.status(200).json({ success: true, url: publicUrl })
    }

    // All other actions go to Apps Script
    const scriptResp = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!scriptResp.ok) throw new Error('Apps Script error: ' + scriptResp.status)
    const result = await scriptResp.json()
    if (result.status === 'error') throw new Error(result.message || 'Failed')

    return res.status(200).json({ success: true, ...result })

  } catch (error: any) {
    console.error('API error:', error.message)
    const fn = (req.body?.filename || '')
    const fname = fn.replace(/\.(pdf|doc|docx|txt)$/i,'').replace(/^Naukri_/i,'').replace(/\[\d+y[\d_]+m\]/i,'').replace(/[_\[\]]/g,' ').trim()
    const expM = fn.match(/\[(\d+)y/)
    return res.status(200).json({
      success: true,
      parsed: { name: fname||'Unknown', mobile:'', email:'', exp: expM?.[1]||'', role:'', skills:'', city:'', industry:'', gender:'', linkedIn:'', qualification:'', summary:'Please fill details.', _fallback: true },
      error: error.message
    })
  }
}
