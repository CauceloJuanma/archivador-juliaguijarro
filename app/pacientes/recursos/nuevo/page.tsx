'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NuevoRecursoPage() {
    const [formData, setFormData] = useState({
        nombre_categoria: '',
        descripcion: ''
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

        const { error: insertError } = await supabase
        .from('categorias_recursos')
        .insert([{
            nombre_categoria: formData.nombre_categoria,
            descripcion: formData.descripcion || null
        }])

        if (insertError) {
        setError('Error creando categoría: ' + insertError.message)
        setLoading(false)
        return
        }

        router.push('/pacientes')
    }

    return (
        <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto w-full max-w-2xl">
            <div className="mb-6">
            <Link
                href="/pacientes"
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver a pacientes
            </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Crear nueva categoría de recursos
            </h1>
            <p className="mt-2 text-sm text-slate-600">
                Añade una nueva categoría para organizar tus recursos.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div>
                <label
                    htmlFor="nombre_categoria"
                    className="block text-sm font-medium text-slate-700"
                >
                    Nombre de la categoría *
                </label>
                <input
                    type="text"
                    id="nombre_categoria"
                    name="nombre_categoria"
                    value={formData.nombre_categoria}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    placeholder="Ej: Materiales terapéuticos"
                />
                </div>

                <div>
                <label
                    htmlFor="descripcion"
                    className="block text-sm font-medium text-slate-700"
                >
                    Descripción
                </label>
                <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    placeholder="Describe brevemente el propósito de esta categoría"
                />
                </div>

                {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
                )}

                <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                    {loading ? 'Creando...' : 'Crear categoría'}
                </button>
                <Link
                    href="/pacientes"
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    Cancelar
                </Link>
                </div>
            </form>
            </div>
        </div>
        </main>
    )
}