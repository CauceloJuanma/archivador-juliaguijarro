'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Upload, Download, Trash2 } from 'lucide-react'

const sanitizeFilename = (filename: string) =>
    filename
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')

type Archivo = {
    name: string
    id: string | null
    updated_at: string | null
    created_at: string | null
    last_accessed_at: string | null
    metadata: any
}

export default function ArchivosCategoriaPage() {
    const router = useRouter()
    const params = useParams()
    const id = Array.isArray(params?.id) ? params.id[0] : params?.id
    const supabase = createClient()

    const [categoria, setCategoria] = useState<{ nombre_categoria: string } | null>(null)
    const [archivos, setArchivos] = useState<Archivo[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
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

        // Obtener nombre de la categoría
        const { data: cat, error: catError } = await supabase
            .from('categorias_recursos')
            .select('nombre_categoria')
            .eq('id', id)
            .single()

        if (catError || !cat) {
            setError('Categoría no encontrada')
            setLoading(false)
            return
        }

        setCategoria(cat)

        // Listar archivos en el bucket para esta categoría
        const { data: files, error: filesError } = await supabase.storage
            .from('recursos')
            .list(`${id}/`)

        if (filesError) {
            setError('Error cargando archivos: ' + filesError.message)
        } else {
            setArchivos(files || [])
        }

        setLoading(false)
        }

        load()
    }, [id, router, supabase])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !id) return

        setUploading(true)
        setError('')

        // Sanitizar y agregar timestamp al nombre del archivo
        const timestamp = Date.now()
        const safeName = sanitizeFilename(file.name)
        const filePath = `${id}/${timestamp}_${safeName}`

        const { error: uploadError } = await supabase.storage
            .from('recursos')
            .upload(filePath, file, { upsert: false })

        if (uploadError) {
            setError('Error subiendo archivo: ' + uploadError.message)
        } else {
            // Recargar archivos
            const { data: files } = await supabase.storage
                .from('recursos')
                .list(`${id}/`)
            setArchivos(files || [])
        }

        setUploading(false)
    }

    const handleDownload = async (fileName: string) => {
        const { data, error } = await supabase.storage
            .from('recursos')
            .createSignedUrl(`${id}/${fileName}`, 60)

        if (error || !data?.signedUrl) {
            setError('Error generando enlace de vista previa: ' + error?.message)
        } else {
            // Abrir en nueva pestaña para vista previa
            window.open(data.signedUrl, '_blank')
        }
    }

    const handleDelete = async (fileName: string) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
            return
        }

        const { error } = await supabase.storage
            .from('recursos')
            .remove([`${id}/${fileName}`])

        if (error) {
            setError('Error eliminando archivo: ' + error.message)
        } else {
            setArchivos(archivos.filter(f => f.name !== fileName))
        }
    }

    if (loading) {
        return (
        <main className="min-h-screen bg-slate-100 px-4 py-10">
            <div className="mx-auto w-full max-w-4xl">
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
            <div className="mx-auto w-full max-w-4xl">
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
        <div className="mx-auto w-full max-w-4xl">
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
                Archivos de {categoria?.nombre_categoria}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
                Gestiona los archivos de esta categoría.
            </p>

            <div className="mt-6">
                <label className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 cursor-pointer">
                <Upload className="h-5 w-5" />
                <span>{uploading ? 'Subiendo...' : 'Subir archivo'}</span>
                <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                />
                </label>
            </div>

            {error && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="mt-8">
                <h2 className="text-lg font-semibold text-slate-900">Archivos</h2>
                {archivos.length > 0 ? (
                <div className="mt-4 space-y-2">
                    {archivos.map((archivo) => {
                        // Extraer el nombre original (remover timestamp del inicio)
                        const displayName = archivo.name.replace(/^\d+_/, '')
                        return (
                        <div key={archivo.name} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                            <div>
                            <p className="text-sm font-medium text-slate-900">{displayName}</p>
                            <p className="text-xs text-slate-500">
                                {archivo.metadata?.size ? (archivo.metadata.size / 1024).toFixed(1) + ' KB' : 'Tamaño desconocido'}
                            </p>
                            </div>
                            <div className="flex gap-2">
                            <button
                                onClick={() => handleDownload(archivo.name)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                                title="Vista previa"
                            >
                                <Download className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(archivo.name)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                                title="Eliminar"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                            </div>
                        </div>
                        )
                    })}
                </div>
                ) : (
                <p className="mt-4 text-sm text-slate-500">No hay archivos en esta categoría.</p>
                )}
            </div>
            </div>
        </div>
        </main>
    )
}