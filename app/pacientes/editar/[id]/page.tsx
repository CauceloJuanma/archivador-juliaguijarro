'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function EditarPacientePage() {
    const router = useRouter()
    const params = useParams()
    const id = Array.isArray(params?.id) ? params.id[0] : params?.id
    type Paciente = {
        nombre_completo: string | null
        telefono: string | null
        dni: string | null
        email: string | null
    }

    const [formData, setFormData] = useState({
        nombre_completo: '',
        telefono: '',
        dni: '',
        email: ''
    })
    const [paciente, setPaciente] = useState<Paciente | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const supabase = createClient()

    useEffect(() => {
        if (!id) {
            return
        }

        const load = async () => {
            setLoading(true)
            setError('')

            const { data: authData } = await supabase.auth.getUser()
            if (!authData?.user) {
                router.push('/login')
                return
            }

            const { data: paciente, error: fetchError } = await supabase
                .from('pacientes')
                .select('nombre_completo, telefono, dni, email')
                .eq('id', id)
                .single()

            if (fetchError || !paciente) {
                setError(fetchError?.message ?? 'No se encontró el paciente')
            } else {
                setPaciente({
                    nombre_completo: paciente.nombre_completo,
                    telefono: paciente.telefono,
                    dni: paciente.dni,
                    email: paciente.email
                })
                setFormData({
                    nombre_completo: paciente.nombre_completo ?? '',
                    telefono: paciente.telefono ?? '',
                    dni: paciente.dni ?? '',
                    email: paciente.email ?? ''
                })
            }

            setLoading(false)
        }

        load()
    }, [id, router, supabase])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')

        if (!id) {
            setError('ID de paciente no válido')
            setSaving(false)
            return
        }

        const { data: authData } = await supabase.auth.getUser()
        if (!authData?.user) {
            setError('Usuario no autenticado')
            setSaving(false)
            router.push('/login')
            return
        }

        const { error: updateError } = await supabase
            .from('pacientes')
            .update({
                nombre_completo: formData.nombre_completo,
                telefono: formData.telefono,
                dni: formData.dni,
                email: formData.email || null
            })
            .eq('id', id)

        if (updateError) {
            setError(updateError.message)
        } else {
            router.push('/pacientes')
        }

        setSaving(false)
    }

    if (!id) {
        return (
            <main style={{ padding: '2rem' }}>
                <h1>Editar paciente</h1>
                <p style={{ color: 'red' }}>ID de paciente no válido</p>
            </main>
        )
    }

    if (loading) {
        return (
            <main style={{ padding: '2rem' }}>
                <h1>Editar paciente</h1>
                <p>Cargando datos...</p>
            </main>
        )
    }

    return (
        <main style={{ padding: '2rem' }}>
            <h1>Editar paciente</h1>

            <section style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #ddd', borderRadius: '6px' }}>
                <h2 style={{ margin: '0 0 0.5rem 0' }}>Datos del paciente</h2>
                <p><strong>Nombre completo:</strong> {paciente?.nombre_completo || 'No disponible'}</p>
                <p><strong>Teléfono:</strong> {paciente?.telefono || 'No disponible'}</p>
                <p><strong>DNI:</strong> {paciente?.dni || 'No disponible'}</p>
                <p><strong>Email:</strong> {paciente?.email || 'No disponible'}</p>
            </section>

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
                    disabled={saving}
                    style={{ padding: '0.5rem 1rem', backgroundColor: '#0b5fff', color: '#fff', border: 'none', borderRadius: '4px' }}
                >
                    {saving ? 'Guardando...' : 'Actualizar paciente'}
                </button>

                <button
                    type="button"
                    style={{ marginLeft: '8px', padding: '0.5rem 1rem', backgroundColor: '#777', color: '#fff', border: 'none', borderRadius: '4px' }}
                    onClick={() => router.push('/pacientes')}
                >
                    Cancelar
                </button>
            </form>
        </main>
    )
}
