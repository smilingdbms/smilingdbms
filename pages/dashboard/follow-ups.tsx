import { useEffect } from 'react'
import { useRouter } from 'next/router'
export default function FollowUpsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/communications' + (typeof window !== 'undefined' ? window.location.hash : '')) }, [router.isReady])
  return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--bg)',color:'var(--mu)'}}>Loading...</div>
}
