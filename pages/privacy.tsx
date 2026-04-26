import { useRouter } from 'next/router'
export default function Privacy() {
  const router = useRouter()
  return (
    <div style={{minHeight:'100vh',background:'#111318',color:'#e8eaf0',fontFamily:'Outfit,Inter,sans-serif',padding:'40px 24px'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');*{box-sizing:border-box}`}</style>
      <div style={{maxWidth:800,margin:'0 auto'}}>
        <button onClick={()=>router.back()} style={{marginBottom:24,padding:'8px 16px',borderRadius:8,background:'rgba(108,140,255,0.1)',color:'#6c8cff',border:'1px solid rgba(108,140,255,0.3)',cursor:'pointer',fontFamily:'inherit',fontSize:13}}>← Back</button>
        <h1 style={{fontSize:28,fontWeight:700,color:'#6c8cff',marginBottom:8}}>Privacy Policy</h1>
        <p style={{color:'#7a7f90',marginBottom:32,fontSize:13}}>Last updated: March 2026 | RecruitBase Pro by Smiling DBMS</p>
        {[
          ['1. Information We Collect', 'We collect information you provide directly to us, including: Full name and email address when you register via Google OAuth. Candidate profile data including name, mobile number, email, qualifications, skills, work experience, city, industry, and resume files. Feedback notes and activity logs within the platform. We do not collect passwords — authentication is handled entirely by Google.'],
          ['2. How We Use Your Information', 'We use the information we collect to: Provide, maintain, and improve our recruitment management services. Sync candidate profiles to your linked Google Sheets. Store resume files securely for easy access. Track activity and award performance points to recruiters. Send notifications when you are tagged in notes (when enabled). We do not sell, rent, or share your data with third parties for advertising or marketing purposes.'],
          ['3. Data Storage & Security', 'All data is stored on Supabase (PostgreSQL) hosted on AWS infrastructure in the Asia-Pacific (Singapore) region. Resume files are stored on Supabase Storage with AES-256 encryption. All data transmission is protected by SSL/TLS encryption. Row Level Security (RLS) ensures each recruiter can only access their own data. We implement Google OAuth 2.0 for secure authentication with no passwords stored on our servers.'],
          ['4. Candidate Data', 'RecruitBase Pro is a B2B recruitment tool. As a user, you are responsible for ensuring you have proper consent from candidates whose data you enter into the system. Candidate data should only be used for legitimate recruitment purposes. Candidates may request deletion of their data by contacting you directly as the account holder.'],
          ['5. Google Services', 'Our platform integrates with Google Sheets and Google Drive for data synchronization and file storage. By using these features, you agree to Google\'s Privacy Policy at https://policies.google.com/privacy. We access only the specific Google services you authorize and do not access your personal Google data beyond what is needed for the platform to function.'],
          ['6. Data Retention', 'Your account data is retained as long as your account is active. If you close your account, your data will be deleted within 30 days. Resume files stored in our storage system will be deleted upon account closure. Google Sheets data remains in your Google account and is subject to Google\'s retention policies.'],
          ['7. Your Rights', 'You have the right to: Access all data associated with your account. Export your data at any time from the Admin Panel. Delete your account and all associated data. Restrict processing of your personal data. Request correction of inaccurate data. To exercise any of these rights, contact us at smilingdbms@gmail.com.'],
          ['8. Cookies', 'We use essential cookies only for session management and authentication. We do not use advertising cookies, tracking pixels, or third-party analytics cookies. You can control cookie settings in your browser, but disabling cookies may affect platform functionality.'],
          ['9. Changes to This Policy', 'We may update this Privacy Policy from time to time. We will notify registered users of significant changes via email. Continued use of the platform after changes constitutes acceptance of the updated policy.'],
          ['10. Contact Us', 'For privacy-related questions or concerns, contact us at: Email: smilingdbms@gmail.com | Platform: https://smilingdbms.vercel.app'],
        ].map(([title, content]) => (
          <div key={title} style={{marginBottom:28}}>
            <h2 style={{fontSize:16,fontWeight:700,color:'#3dd68c',marginBottom:10}}>{title}</h2>
            <p style={{fontSize:14,lineHeight:1.7,color:'#c8c8d8'}}>{content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
