'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Categoria = {
    nombre_categoria: string
    descripcion: string | null
}

export default function EditarCategoriaPage() {
    const router = useRouter()
    const params = useParams()
    const id = Array.isArray(params?.id) ? params.id[0] : params?.id
    const supabase = createClient()

    const [formData, setFormData] = useState({
        nombre_categoria: '',
        descripcion: ''
    })
    const [categoria, setCategoria] = useState<Categoria | null>(null)
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

        const { data: categoria, error: fetchError } = await supabase
            .from('categorias_recursos')
            .select('nombre_categoria, descripcion')
            .eq('id', id)
            .single()

        if (fetchError || !categoria) {
            setError('Categoría no encontrada')
            setLoading(false)
            return
        }

        setCategoria(categoria)
        setFormData({
            nombre_categoria: categoria.nombre_categoria,
            descripcion: categoria.descripcion || ''
        })
        setLoading(false)
        }

        load()
    }, [id, router, supabase])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')

        const { error: updateError } = await supabase
        .from('categorias_recursos')
        .update({
            nombre_categoria: formData.nombre_categoria,
            descripcion: formData.descripcion || null
        })
        .eq('id', id)

        if (updateError) {
        setError('Error actualizando categoría: ' + updateError.message)
        setSaving(false)
        return
        }

        router.push('/pacientes')
    }

    if (loading) {
        return (
        <main className="min-h-screen bg-slate-100 px-4 py-10">
            <div className="mx-auto w-full max-w-2xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <p className="text-sm text-slate-600">Cargando...</p>
            </div>
            </div>
        </main>
        )
    }

    if (error && !categoria) {
        return (
        <main className="min-h-screen bg-slate-100 px-4 py-10">
            <div className="mx-auto w-full max-w-2xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <p className="text-sm text-red-700">{error}</p>
                <Link
                href="/pacientes"
                className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                >
                <ArrowLeft className="h-4 w-4" />
                Volver
                </Link>
            </div>
            </div>
        </main>
        )
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
                Editar categoría de recursos
            </h1>
            <p className="mt-2 text-sm text-slate-600">
                Modifica los datos de la categoría.
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
                    disabled={saving}
                    className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                    {saving ? 'Guardando...' : 'Guardar cambios'}
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