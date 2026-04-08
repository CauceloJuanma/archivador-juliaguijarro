// components/logout-button.tsx
'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
    const router = useRouter()

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <button 
        className="inline-block bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
        onClick={handleLogout}
        >
        Cerrar sesión
        </button>
    )
}