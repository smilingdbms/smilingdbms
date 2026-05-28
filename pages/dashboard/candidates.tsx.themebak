import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function CandidatesRedirect() {
  const router = useRouter()
  useEffect(() => {
    const q = router.query
    const action = q.action ? `?action=${q.action}` : ''
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    router.replace(`/dashboard/master${action}${hash}`)
  }, [router.isReady])
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#050810',color:'#9CA3AF',fontFamily:'Outfit,sans-serif'}}>
      Loading...
    </div>
  )
}
