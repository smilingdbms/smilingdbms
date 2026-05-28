import { useRouter } from 'next/router'
export default function Terms() {
  const router = useRouter()
  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',color:'var(--tx)',fontFamily:'Outfit,Inter,sans-serif',padding:'40px 24px'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');*{box-sizing:border-box}`}</style>
      <div style={{maxWidth:800,margin:'0 auto'}}>
        <button onClick={()=>router.back()} style={{marginBottom:24,padding:'8px 16px',borderRadius:8,background:'rgba(108,140,255,0.1)',color:'#6c8cff',border:'1px solid rgba(108,140,255,0.3)',cursor:'pointer',fontFamily:'inherit',fontSize:13}}>← Back</button>
        <h1 style={{fontSize:28,fontWeight:700,color:'#6c8cff',marginBottom:8}}>Terms of Service</h1>
        <p style={{color:'var(--mu)',marginBottom:32,fontSize:13}}>Last updated: March 2026 | RecruitBase Pro by Smiling DBMS</p>
        {[
          ['1. Acceptance of Terms', 'By accessing or using RecruitBase Pro ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform. These terms apply to all users including administrators, senior recruiters, and recruiters.'],
          ['2. Description of Service', 'RecruitBase Pro is a cloud-based recruitment management system that enables organizations to manage candidate profiles, track recruitment pipelines, collaborate with team members, and sync data with Google Sheets. The Platform is provided as a Software-as-a-Service (SaaS) product.'],
          ['3. User Accounts', 'You must authenticate using a valid Google account. You are responsible for maintaining the security of your account. You must notify us immediately of any unauthorized use of your account. Each account is for a single user and may not be shared. Administrators are responsible for managing team member access and permissions.'],
          ['4. Acceptable Use', 'You agree to use the Platform only for lawful recruitment and talent management purposes. You must not use the Platform to: Store candidate data without appropriate consent. Engage in discriminatory hiring practices. Send unsolicited communications (spam). Attempt to gain unauthorized access to the system. Upload malicious files or content. Violate any applicable laws or regulations including data protection laws.'],
          ['5. Data Responsibility', 'You are responsible for all data you enter into the Platform including candidate information. You must have a lawful basis for processing candidate personal data. You must comply with applicable data protection laws including the Information Technology Act 2000 and any applicable GDPR obligations. You are responsible for informing candidates about how their data is used.'],
          ['6. Intellectual Property', 'The Platform, including its design, features, and code, is the intellectual property of Smiling DBMS. You may not copy, modify, distribute, or reverse engineer any part of the Platform. Your data remains your property at all times.'],
          ['7. Service Availability', 'We strive to provide 99.9% uptime but do not guarantee uninterrupted access. Scheduled maintenance will be communicated in advance where possible. We are not liable for any losses arising from service interruptions beyond our reasonable control.'],
          ['8. Limitation of Liability', 'The Platform is provided "as is" without warranty of any kind. We are not liable for any indirect, incidental, or consequential damages. Our total liability to you shall not exceed the amount you paid for the service in the 12 months preceding the claim.'],
          ['9. Termination', 'Either party may terminate the agreement at any time. Upon termination, your access will be revoked and your data will be deleted within 30 days. You may export your data at any time before termination.'],
          ['10. Governing Law', 'These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of India. For any questions about these terms, contact us at smilingdbms@gmail.com.'],
        ].map(([title, content]) => (
          <div key={title} style={{marginBottom:28}}>
            <h2 style={{fontSize:16,fontWeight:700,color:'#3dd68c',marginBottom:10}}>{title}</h2>
            <p style={{fontSize:14,lineHeight:1.7,color:'var(--tx)'}}>{content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
