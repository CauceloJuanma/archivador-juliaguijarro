'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
}

export default function ArchivadorPacientePage() {
    const params = useParams()
    const router = useRouter()
    const pacienteId = Array.isArray(params?.id) ? params.id[0] : params?.id

    const [documentos, setDocumentos] = useState<Documento[]>([])
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
            .select('id, owner_id, paciente_id, nombre_archivo, storage_path, mime_type, tamano_bytes')
            .eq('paciente_id', pacienteId)
            .eq('owner_id', authData.user.id)
            .order('id', { ascending: true })

        if (docsError) {
            setError('Error cargando documentos: ' + docsError.message)
            setLoading(false)
            return
        }

        setDocumentos(docs ?? [])

        // validar paciente (owner) + obtener datos del paciente para mostrar cabecera
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

        const timer = window.setTimeout(() => {
            void loadDocumentos()
        }, 0)

        return () => window.clearTimeout(timer)
    }, [pacienteId, loadDocumentos])

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

        // Verificar que el paciente pertenece al usuario antes del INSERT
        const { data: pacienteCheck, error: pacienteCheckError } = await supabase
            .from('pacientes')
            .select('id, owner_id')
            .eq('id', pacienteId)
            .single()

        if (pacienteCheckError || !pacienteCheck) {
            setError('No se pudo verificar el paciente antes de guardar el documento: ' + (pacienteCheckError?.message ?? 'Paciente no encontrado'))
            setUploading(false)
            return
        }

        if (pacienteCheck.owner_id !== authData.user.id) {
            setError('No autorizado para añadir documentos a este paciente')
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
            setError('Error guardando registro de documento: ' + insertError.message)
            console.error('RLS insert error', {
                owner_id: authData.user.id,
                paciente_id: pacienteId,
                error: insertError
            })
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
        const { data: signedUrlData, error: signedUrlError } = await supabase
            .storage
            .from(BUCKET_NAME)
            .createSignedUrl(doc.storage_path, 60)

            console.log({
  bucket: BUCKET_NAME,
  path: doc.storage_path
})

        if (signedUrlError || !signedUrlData?.signedUrl) {
            setError('Error generando enlace de descarga: ' + (signedUrlError?.message ?? 'Sin URL'))
            return
        }

        window.open(signedUrlData.signedUrl, '_blank')
    }

    const handleDelete = async (doc: Documento) => {
        if (!window.confirm('¿Eliminar documento ' + doc.nombre_archivo + '?')) return

        setError('')

        const { error: storageError } = await supabase
            .storage
            .from(BUCKET_NAME)
            .remove([doc.storage_path])

        if (storageError) {
            setError('Error eliminando archivo del storage: ' + storageError.message)
            return
        }

        const { error: deleteError } = await supabase
            .from('documentos_paciente')
            .delete()
            .eq('id', doc.id)

        if (deleteError) {
            setError('Error eliminando registro de documento: ' + deleteError.message)
            return
        }

        setInfo('Documento eliminado correctamente.')
        await loadDocumentos()
    }

    if (!pacienteId) {
        return (
            <main style={{ padding: '2rem' }}>
                <h1>Archivador</h1>
                <p style={{ color: 'red' }}>ID de paciente no válido</p>
                <button onClick={() => router.push('/pacientes')}>Volver a pacientes</button>
            </main>
        )
    }

    return (
        <main style={{ padding: '2rem' }}>
            <h1>Archivador del paciente</h1>
            <p><strong>Paciente ID:</strong> {pacienteId}</p>
            {pacienteNombre && <p><strong>Nombre:</strong> {pacienteNombre}</p>}

            <form onSubmit={handleUpload} style={{ margin: '1rem 0', maxWidth: '420px' }}>
                <h2>Subir PDF</h2>
                <input type="file" accept="application/pdf" onChange={handleFileChange} />
                <button type="submit" disabled={uploading} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#0b5fff', color: '#fff', border: 'none', borderRadius: '4px' }}>
                    {uploading ? 'Subiendo...' : 'Subir documento'}
                </button>
            </form>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            {info && <p style={{ color: 'green' }}>{info}</p>}

            {loading ? (
                <p>Cargando documentos...</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Nombre archivo</th>
                            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Tamaño</th>
                            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documentos.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>No hay documentos</td>
                            </tr>
                        ) : (
                            documentos.map((doc) => (
                                <tr key={doc.id}>
                                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{doc.nombre_archivo}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{(doc.tamano_bytes / 1024).toFixed(2)} KB</td>
                                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                                        <button onClick={() => handleDownload(doc)} style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px' }}>Descargar</button>
                                        <button onClick={() => handleDelete(doc)} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#f44336', color: '#fff', border: 'none', borderRadius: '4px' }}>Eliminar</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}

            <button onClick={() => router.push('/pacientes')} style={{ marginTop: '1rem', padding: '0.4rem 0.8rem', backgroundColor: '#777', color: '#fff', border: 'none', borderRadius: '4px' }}>
                Volver a lista de pacientes
            </button>
        </main>
    )
}
