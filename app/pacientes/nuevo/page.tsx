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
        const {
            data: { user }
        } = await supabase.auth.getUser()

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

        const {
        data: { user }
        } = await supabase.auth.getUser()

        if (!user) {
        setError('Usuario no autenticado')
        setLoading(false)
        return
        }

        const { error: insertError } = await supabase.from('pacientes').insert({
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
        <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto w-full max-w-2xl space-y-3 md:space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Registrar nuevo paciente
            </h1>
            <p className="mt-2 text-sm text-slate-600">
                Completa los datos básicos para dar de alta al paciente.
            </p>
            </section>

            <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
            >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
                disabled={loading}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                {loading ? 'Registrando...' : 'Registrar paciente'}
                </button>
            </div>
            </form>
        </div>
        </main>
    )
}