// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
    const router = useRouter()
    const supabase = createClient()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        })

        if (error) {
        setError(error.message)
        setLoading(false)
        return
        }

        router.push('/pacientes')
        router.refresh()
    }

    return (
        <main style={{ padding: '2rem', maxWidth: '420px', margin: '0 auto' }}>
        <h1>Iniciar sesión</h1>

        <form onSubmit={handleLogin} style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            />

            <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            />

            <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
            </button>

            {error && <p style={{ color: 'crimson' }}>{error}</p>}
        </form>
        </main>
    )
}