'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Archive, Pencil, Trash2, Search } from 'lucide-react'

type Categoria = {
    id: string
    nombre_categoria: string
    descripcion: string | null
}

type Props = {
    categorias: Categoria[]
}

export default function RecursosTable({ categorias }: Props) {
    const router = useRouter()
    const [search, setSearch] = useState('')

    const categoriasFiltradas = categorias.filter((categoria) => {
        const texto = search.toLowerCase()

        return (
        categoria.nombre_categoria.toLowerCase().includes(texto) ||
        categoria.descripcion?.toLowerCase().includes(texto)
        )
    })

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
        return
        }

        const supabase = createClient()
        const { error } = await supabase.from('categorias_recursos').delete().eq('id', id)

        if (error) {
        window.alert('Error eliminando categoría: ' + error.message)
        } else {
        window.alert('Categoría eliminada correctamente')
        router.refresh()
        }
    }

    const handleEdit = (id: string) => {
        router.push(`/pacientes/recursos/editar/${id}`)
    }

    const handleArchivos = (id: string) => {
        router.push(`/pacientes/recursos/archivos/${id}`)
    }

    return (
        <div className="p-4 md:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
            <h3 className="text-base font-semibold text-slate-900">
                Directorio de categorías
            </h3>
            <p className="mt-1 text-sm text-slate-500">
                Busca por nombre o descripción.
            </p>
            </div>

            <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
                type="text"
                placeholder="Buscar categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
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
                    Descripción
                </th>
                <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Acciones
                </th>
                </tr>
            </thead>

            <tbody className="bg-white">
                {categoriasFiltradas.length > 0 ? (
                categoriasFiltradas.map((categoria) => {
                    const descripcion =
                    categoria.descripcion && categoria.descripcion.trim() !== ''
                        ? categoria.descripcion
                        : 'Sin descripción'

                    return (
                    <tr key={categoria.id} className="transition hover:bg-slate-50">
                        <td className="border-b border-slate-200 px-4 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">
                        {categoria.nombre_categoria}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {descripcion}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-4">
                        <div className="flex items-center gap-2">
                            <button
                            type="button"
                            onClick={() => handleEdit(categoria.id)}
                            aria-label={`Editar categoría ${categoria.nombre_categoria}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                            >
                            <Pencil className="h-4 w-4" />
                            </button>

                            <button
                            type="button"
                            onClick={() => handleArchivos(categoria.id)}
                            aria-label={`Ver archivos de ${categoria.nombre_categoria}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-600"
                            >
                            <Archive className="h-4 w-4" />
                            </button>

                            <button
                            type="button"
                            onClick={() => handleDelete(categoria.id)}
                            aria-label={`Eliminar categoría ${categoria.nombre_categoria}`}
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
                    colSpan={3}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                    No se encontraron categorías
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
        </div>
    )
}