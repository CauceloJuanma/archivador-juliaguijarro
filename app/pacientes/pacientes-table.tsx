'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Archive, Pencil, Trash2 } from 'lucide-react'

type Paciente = {
    id: string
    nombre_completo: string
    email: string | null
    telefono: string | null
    dni: string | null
}

type Props = {
    pacientes: Paciente[]
}

export default function PacientesTable({ pacientes }: Props) {
    const router = useRouter()

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este paciente?')) {
            return
        }

        const supabase = createClient()
        const { error } = await supabase.from('pacientes').delete().eq('id', id)
        if (error) {
            window.alert('Error eliminando paciente: ' + error.message)
        } else {
            window.alert('Paciente eliminado correctamente')
            router.refresh()
        }
    }

    const handleEdit = (id: string) => {
        router.push(`/pacientes/editar/${id}`)
    }

    const handleArchivador = (id: string) => {
        router.push(`/pacientes/archivador/${id}`)
    }

    return (
        <div>
            <table className="min-w-full border-collapse" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead className="bg-gray-200">
                <tr>
                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Nombre</th>
                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Email</th>
                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Teléfono</th>
                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>DNI</th>
                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Acciones</th>
                </tr>
            </thead>
            <tbody className="bg-white">
                {pacientes.map((paciente) => {
                const email = paciente.email && paciente.email.toString().trim() !== '' ? paciente.email : 'Sin email'
                return (
                    <tr key={paciente.id}>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{paciente.nombre_completo}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{email}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{paciente.telefono ?? 'Sin teléfono'}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{paciente.dni ?? 'Sin DNI'}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => handleEdit(paciente.id)}><Pencil size={16} /></button>
                        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" onClick={() => handleArchivador(paciente.id)} style={{ marginLeft: '32px', marginRight: '32px' }}>
                            <Archive size={16} />
                        </button>
                        
                        <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onClick={() => handleDelete(paciente.id)}><Trash2 size={16} /></button>
                    </td>
                    </tr>
                )
                })}
            </tbody>
            </table>
        </div>
    )
}
