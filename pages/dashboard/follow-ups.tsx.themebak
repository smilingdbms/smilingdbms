import { useEffect } from 'react'
import { useRouter } from 'next/router'
export default function FollowUpsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/communications' + (typeof window !== 'undefined' ? window.location.hash : '')) }, [router.isReady])
  return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#050810',color:'#9CA3AF'}}>Loading...</div>
}
