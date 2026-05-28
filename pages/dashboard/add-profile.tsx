import { useEffect } from 'react'
import { useRouter } from 'next/router'
export default function AddProfileRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/candidates?action=add') }, [])
  return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#050810',color:'#9CA3AF'}}>Redirecting...</div>
}
