'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Paciente = {
    nombre_completo: string | null
    telefono: string | null
    dni: string | null
    email: string | null
}

export default function EditarPacientePage() {
    const router = useRouter()
    const params = useParams()
    const id = Array.isArray(params?.id) ? params.id[0] : params?.id
    const supabase = createClient()

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

    useEffect(() => {
        if (!id) return

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
        <main className="min-h-screen bg-slate-100 px-4 py-10">
            <div className="mx-auto w-full max-w-2xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Editar paciente
            </h1>
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                ID de paciente no válido
            </div>
            </div>
        </main>
        )
    }

    if (loading) {
        return (
        <main className="min-h-screen bg-slate-100 px-4 py-10">
            <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Editar paciente
            </h1>
            <p className="mt-3 text-sm text-slate-600">Cargando datos...</p>
            </div>
        </main>
        )
    }

    return (
        <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto w-full max-w-2xl space-y-3  md:space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Editar paciente
            </h1>
            <p className="mt-2 text-sm text-slate-600">
                Modifica la información del paciente y guarda los cambios.
            </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-lg font-semibold text-slate-900">
                Datos actuales
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Nombre completo
                </p>
                <p className="mt-1 text-sm text-slate-900">
                    {paciente?.nombre_completo || 'No disponible'}
                </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Teléfono
                </p>
                <p className="mt-1 text-sm text-slate-900">
                    {paciente?.telefono || 'No disponible'}
                </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    DNI
                </p>
                <p className="mt-1 text-sm text-slate-900">
                    {paciente?.dni || 'No disponible'}
                </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Email
                </p>
                <p className="mt-1 text-sm text-slate-900">
                    {paciente?.email || 'No disponible'}
                </p>
                </div>
            </div>
            </section>

            <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
            >
            <h2 className="text-lg font-semibold text-slate-900">
                Actualizar datos
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                <label
                    htmlFor="nombre_completo"
                    className="mb-2 block text-sm font-medium text-slate-700"
                >
                    Nombre completo
                </label>
                <input
                    type="text"
                    id="nombre_completo"
                    name="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder="Introduce el nombre completo"
                />
                </div>

                <div>
                <label
                    htmlFor="telefono"
                    className="mb-2 block text-sm font-medium text-slate-700"
                >
                    Teléfono
                </label>
                <input
                    type="text"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder="Ej. 600123123"
                />
                </div>

                <div>
                <label
                    htmlFor="dni"
                    className="mb-2 block text-sm font-medium text-slate-700"
                >
                    DNI
                </label>
                <input
                    type="text"
                    id="dni"
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder="Ej. 12345678A"
                />
                </div>

                <div className="md:col-span-2">
                <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                >
                    Email <span className="text-slate-400">(opcional)</span>
                </label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder="correo@ejemplo.com"
                />
                </div>
            </div>

            {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
                </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                type="button"
                onClick={() => router.push('/pacientes')}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                Cancelar
                </button>

                <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                {saving ? 'Guardando...' : 'Actualizar paciente'}
                </button>
            </div>
            </form>
        </div>
        </main>
    )
}