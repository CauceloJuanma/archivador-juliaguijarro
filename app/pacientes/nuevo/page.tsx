'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NuevoPacientePage() {
    const [formData, setFormData] = useState({
        nombre_completo: '',
        telefono: '',
        dni: '',
        email: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
        }
        }
        checkUser()
    }, [router, supabase])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
        setError('Usuario no autenticado')
        setLoading(false)
        return
        }

        const { error: insertError } = await supabase
        .from('pacientes')
        .insert({
            owner_id: user.id,
            nombre_completo: formData.nombre_completo,
            telefono: formData.telefono,
            dni: formData.dni,
            email: formData.email || null
        })

        if (insertError) {
        setError(insertError.message)
        } else {
        router.push('/pacientes')
        }
        setLoading(false)
    }

    return (
        <main style={{ padding: '2rem' }}>
        <h1>Registrar nuevo paciente</h1>
        <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
            <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="nombre_completo">Nombre completo:</label>
            <input
                type="text"
                id="nombre_completo"
                name="nombre_completo"
                value={formData.nombre_completo}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.5rem' }}
            />
            </div>
            <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="telefono">Teléfono:</label>
            <input
                type="text"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.5rem' }}
            />
            </div>
            <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="dni">DNI:</label>
            <input
                type="text"
                id="dni"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.5rem' }}
            />
            </div>
            <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email">Email (opcional):</label>
            <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.5rem' }}
            />
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button
            type="submit"
            disabled={loading}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#0b5fff', color: '#fff', border: 'none', borderRadius: '4px' }}
            >
            {loading ? 'Registrando...' : 'Registrar paciente'}
            </button>
        </form>
        </main>
    )
}