'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Download, Plus, Search, Trash2, ArrowUpDown, FileText } from 'lucide-react'

const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'Archivador'

const sanitizeFilename = (filename: string) =>
    filename
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')

type Documento = {
    id: number
    owner_id: string
    paciente_id: string
    nombre_archivo: string
    storage_path: string
    mime_type: string
    tamano_bytes: number
    created_at: string
}

export default function ArchivadorPacientePage() {
    const params = useParams()
    const router = useRouter()
    const pacienteId = Array.isArray(params?.id) ? params.id[0] : params?.id

    const [documentos, setDocumentos] = useState<Documento[]>([])
    const [search, setSearch] = useState('')
    const [orden, setOrden] = useState<'desc' | 'asc'>('desc')
    const [pacienteNombre, setPacienteNombre] = useState<string>('')
    const [archivo, setArchivo] = useState<File | null>(null)
    const [error, setError] = useState('')
    const [info, setInfo] = useState('')
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    const supabase = createClient()

    const loadDocumentos = useCallback(async () => {
        if (!pacienteId) return

        setLoading(true)
        setError('')

        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (authError || !authData?.user) {
        router.push('/login')
        return
        }

        const { data: docs, error: docsError } = await supabase
        .from('documentos_paciente')
        .select('id, owner_id, paciente_id, nombre_archivo, storage_path, mime_type, tamano_bytes, created_at')
        .eq('paciente_id', pacienteId)
        .eq('owner_id', authData.user.id)

        if (docsError) {
        setError('Error cargando documentos: ' + docsError.message)
        setLoading(false)
        return
        }

        setDocumentos(docs ?? [])

        const { data: paciente, error: pacienteError } = await supabase
        .from('pacientes')
        .select('nombre_completo, owner_id')
        .eq('id', pacienteId)
        .single()

        if (pacienteError || !paciente) {
        setError('No se encontró el paciente o no tienes acceso')
        setLoading(false)
        return
        }

        if (paciente.owner_id !== authData.user.id) {
        setError('No autorizado para acceder a este paciente')
        setLoading(false)
        return
        }

        setPacienteNombre(paciente.nombre_completo)
        setLoading(false)
    }, [pacienteId, router, supabase])

    useEffect(() => {
        if (!pacienteId) return
        void loadDocumentos()
    }, [pacienteId, loadDocumentos])

    const documentosFiltrados = documentos
        .filter((doc) => doc.nombre_archivo.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
        const fechaA = new Date(a.created_at).getTime()
        const fechaB = new Date(b.created_at).getTime()
        return orden === 'desc' ? fechaB - fechaA : fechaA - fechaB
        })

    const toggleOrden = () => {
        setOrden((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInfo('')
        setError('')
        if (event.target.files && event.target.files.length > 0) {
        const file = event.target.files[0]
        if (file.type !== 'application/pdf') {
            setError('Solo se permite subir archivos PDF.')
            setArchivo(null)
            return
        }
        setArchivo(file)
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!pacienteId) return
        if (!archivo) {
        setError('Selecciona un archivo PDF antes de subir.')
        return
        }

        setUploading(true)
        setError('')
        setInfo('')

        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (authError || !authData?.user) {
        setError('Debes iniciar sesión para subir documentos.')
        setUploading(false)
        return
        }

        const prefijo = `paciente_${pacienteId}`
        const timestamp = Date.now()
        const safeName = sanitizeFilename(archivo.name)
        const path = `${prefijo}/${timestamp}_${safeName}`

        const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, archivo, { upsert: false })

        if (uploadError) {
        setError('Error subiendo archivo: ' + uploadError.message)
        setUploading(false)
        return
        }

        const { data: pacienteCheck } = await supabase
        .from('pacientes')
        .select('id, owner_id')
        .eq('id', pacienteId)
        .single()

        if (!pacienteCheck || pacienteCheck.owner_id !== authData.user.id) {
        setError('No autorizado para añadir documentos')
        setUploading(false)
        return
        }

        const { error: insertError } = await supabase.from('documentos_paciente').insert({
        owner_id: authData.user.id,
        paciente_id: pacienteId,
        nombre_archivo: archivo.name,
        storage_path: path,
        mime_type: archivo.type,
        tamano_bytes: archivo.size
        })

        if (insertError) {
        setError('Error guardando documento: ' + insertError.message)
        setUploading(false)
        return
        }

        setArchivo(null)
        setInfo('Documento subido correctamente.')
        await loadDocumentos()
        setUploading(false)
    }

    const handleDownload = async (doc: Documento) => {
        setError('')
        const { data, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .createSignedUrl(doc.storage_path, 60)

        if (error || !data?.signedUrl) {
        setError('Error generando enlace')
        return
        }

        window.open(data.signedUrl, '_blank')
    }

    const handleDelete = async (doc: Documento) => {
        if (!window.confirm('¿Eliminar documento ' + doc.nombre_archivo + '?')) return

        setError('')

        const { error: storageError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .remove([doc.storage_path])

        if (storageError) {
        setError(storageError.message)
        return
        }

        const { error: deleteError } = await supabase
        .from('documentos_paciente')
        .delete()
        .eq('id', doc.id)

        if (deleteError) {
        setError(deleteError.message)
        return
        }

        setInfo('Documento eliminado correctamente.')
        await loadDocumentos()
    }

    if (!pacienteId) {
        return (
        <main className="min-h-screen bg-slate-100 px-4 py-10">
            <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Archivador</h1>
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                ID de paciente no válido
            </p>

            <button
                onClick={() => router.push('/pacientes')}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver
            </button>
            </div>
        </main>
        )
    }

    if (loading) {
        return (
        <main className="min-h-screen bg-slate-100 px-4 py-10">
            <div className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Archivador del paciente
            </h1>
            <p className="mt-3 text-sm text-slate-600">Cargando documentos...</p>
            </div>
        </main>
        )
    }

    return (
        <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto w-full max-w-6xl space-y-3 md:space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    <FileText className="h-3.5 w-3.5" />
                    Archivador
                </div>

                <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                    Archivador del paciente
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    Gestiona documentos PDF asociados al historial del paciente.
                </p>
                </div>

                <button
                onClick={() => router.push('/pacientes')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                <ArrowLeft className="h-4 w-4" />
                Volver a pacientes
                </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Paciente
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                    {pacienteNombre || 'Sin nombre'}
                </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    ID
                </p>
                <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                    {pacienteId}
                </p>
                </div>
            </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-lg font-semibold text-slate-900">Subir PDF</h2>
            <p className="mt-1 text-sm text-slate-600">
                Solo se permiten archivos PDF.
            </p>

            <form onSubmit={handleUpload} className="mt-5 space-y-4">
                <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                    Seleccionar archivo
                </span>
                <input
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                />
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                <button
                    type="submit"
                    disabled={uploading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Plus className="h-4 w-4" />
                    {uploading ? 'Subiendo...' : 'Subir documento'}
                </button>

                <button
                    type="button"
                    onClick={() => setArchivo(null)}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                    Limpiar selección
                </button>
                </div>
            </form>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                <h2 className="text-lg font-semibold text-slate-900">
                    Documentos guardados
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                    Busca, ordena, descarga o elimina archivos.
                </p>
                </div>

                <button
                onClick={toggleOrden}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                <ArrowUpDown className="h-4 w-4" />
                {orden === 'desc' ? 'Más nuevos' : 'Más antiguos'}
                </button>
            </div>

            <div className="mt-5">
                <div className="relative w-full sm:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar documento..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                </div>
            </div>

            {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
                </div>
            )}

            {info && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {info}
                </div>
            )}

            <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0">
                <thead>
                    <tr>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Nombre archivo
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Tamaño
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Fecha
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Acciones
                    </th>
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {documentosFiltrados.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">
                        No hay documentos
                        </td>
                    </tr>
                    ) : (
                    documentosFiltrados.map((doc) => (
                        <tr key={doc.id} className="transition hover:bg-slate-50">
                        <td className="border-b border-slate-200 px-4 py-4 text-sm font-medium text-slate-900">
                            {doc.nombre_archivo}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                            {(doc.tamano_bytes / 1024).toFixed(2)} KB
                        </td>
                        <td className="border-b border-slate-200 px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                            {new Date(doc.created_at).toLocaleString()}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleDownload(doc)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                            >
                                <Download className="h-4 w-4" />
                                Descargar
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(doc)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-700"
                            >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                            </button>
                            </div>
                        </td>
                        </tr>
                    ))
                    )}
                </tbody>
                </table>
            </div>
            </section>
        </div>
        </main>
    )
}