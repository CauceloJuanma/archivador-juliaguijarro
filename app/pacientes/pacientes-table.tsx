'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Archive, Pencil, Trash2, Search } from 'lucide-react'

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
    const [search, setSearch] = useState('')

    const pacientesFiltrados = pacientes.filter((paciente) => {
        const texto = search.toLowerCase()

        return (
        paciente.nombre_completo.toLowerCase().includes(texto) ||
        paciente.email?.toLowerCase().includes(texto) ||
        paciente.telefono?.toLowerCase().includes(texto) ||
        paciente.dni?.toLowerCase().includes(texto)
        )
    })

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
        <div className="p-4 md:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
            <h3 className="text-base font-semibold text-slate-900">
                Directorio de pacientes
            </h3>
            <p className="mt-1 text-sm text-slate-500">
                Busca por nombre, email, teléfono o DNI.
            </p>
            </div>

            <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
                type="text"
                placeholder="Buscar paciente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
            <thead>
                <tr>
                <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Nombre
                </th>
                <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                </th>
                <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Teléfono
                </th>
                <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    DNI
                </th>
                <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Acciones
                </th>
                </tr>
            </thead>

            <tbody className="bg-white">
                {pacientesFiltrados.length > 0 ? (
                pacientesFiltrados.map((paciente) => {
                    const email =
                    paciente.email && paciente.email.trim() !== ''
                        ? paciente.email
                        : 'Sin email'

                    return (
                    <tr key={paciente.id} className="transition hover:bg-slate-50">
                        <td className="border-b border-slate-200 px-4 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">
                        {paciente.nombre_completo}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {email}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {paciente.telefono ?? 'Sin teléfono'}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {paciente.dni ?? 'Sin DNI'}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-4">
                        <div className="flex items-center gap-2">
                            <button
                            type="button"
                            onClick={() => handleEdit(paciente.id)}
                            aria-label={`Editar paciente ${paciente.nombre_completo}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                            >
                            <Pencil className="h-4 w-4" />
                            </button>

                            <button
                            type="button"
                            onClick={() => handleArchivador(paciente.id)}
                            aria-label={`Abrir archivador de ${paciente.nombre_completo}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-600"
                            >
                            <Archive className="h-4 w-4" />
                            </button>

                            <button
                            type="button"
                            onClick={() => handleDelete(paciente.id)}
                            aria-label={`Eliminar paciente ${paciente.nombre_completo}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                            >
                            <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                        </td>
                    </tr>
                    )
                })
                ) : (
                <tr>
                    <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                    No se encontraron pacientes
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
        </div>
    )
}