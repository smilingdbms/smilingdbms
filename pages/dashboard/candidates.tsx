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
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--bg)',color:'var(--mu)',fontFamily:'Outfit,sans-serif'}}>
      Loading...
    </div>
  )
}
