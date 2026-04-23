'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LogoutButton } from '@/components/logout-button'
import PacientesTable from './pacientes-table'
import RecursosTable from './recursos-table'
import FacturaForm from './factura-form'
import { CirclePlus } from 'lucide-react'

type Paciente = {
    id: string
    nombre_completo: string
    email: string | null
    telefono: string | null
    dni: string | null
}

type Categoria = {
    id: string
    nombre_categoria: string
    descripcion: string | null
}

export default function PacientesPage() {
    const router = useRouter()
    const [pacientes, setPacientes] = useState<Paciente[]>([])
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [userEmail, setUserEmail] = useState('')

    const supabase = createClient()

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            setError('')

            const { data: authData, error: authError } = await supabase.auth.getUser()
            if (authError || !authData?.user) {
                router.push('/login')
                return
            }

            setUserEmail(authData.user.email || '')

            const [pacientesResult, categoriasResult] = await Promise.all([
                supabase
                    .from('pacientes')
                    .select('id, nombre_completo, email, telefono, dni')
                    .order('nombre_completo', { ascending: true }),
                supabase
                    .from('categorias_recursos')
                    .select('id, nombre_categoria, descripcion')
                    .order('nombre_categoria', { ascending: true })
            ])

            if (pacientesResult.error) {
                setError('Error cargando pacientes: ' + pacientesResult.error.message)
            } else {
                setPacientes(pacientesResult.data || [])
            }

            if (categoriasResult.error) {
                setError('Error cargando categorías: ' + categoriasResult.error.message)
            } else {
                setCategorias(categoriasResult.data || [])
            }

            setLoading(false)
        }

        loadData()
    }, [router, supabase])

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-100 px-4 py-10">
                <div className="mx-auto w-full max-w-6xl">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                        <p className="text-sm text-slate-600">Cargando...</p>
                    </div>
                </div>
            </main>
        )
    }

    if (error) {
        return (
            <main className="min-h-screen bg-slate-100 px-4 py-10">
                <div className="mx-auto w-full max-w-6xl">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Zona privada
                        </h1>
                        <p className="mt-2 text-sm text-slate-600">
                            Has iniciado sesión como: {userEmail}
                        </p>

                        <div className="mt-6">
                            <LogoutButton />
                        </div>

                        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-slate-100 px-4 py-10">
            <div className="mx-auto w-full max-w-6xl space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 space-y-3 md:space-y-4">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Zona privada
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Has iniciado sesión como: {userEmail}
                    </p>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">
                                Lista de pacientes
                            </h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Gestiona los pacientes registrados en el sistema.
                            </p>
                        </div>

                        <Link
                            href="/pacientes/nuevo"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            <CirclePlus className="h-5 w-5" />
                            <span>Registrar nuevo paciente</span>
                        </Link>
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <h3 className="text-sm font-medium uppercase tracking-wide text-slate-500">
                            Pacientes registrados
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        {pacientes.length > 0 ? (
                            <PacientesTable pacientes={pacientes} />
                        ) : (
                            <div className="px-6 py-12 text-center">
                                <p className="text-sm text-slate-500">
                                    No hay pacientes registrados.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 space-y-3 md:space-y-4">
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">
                                Categorías de Recursos
                            </h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Gestiona las categorías de recursos para almacenar archivos.
                            </p>
                        </div>

                        <Link
                            href="/pacientes/recursos/nuevo"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                            <CirclePlus className="h-5 w-5" />
                            <span>Crear nueva categoría</span>
                        </Link>
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <h3 className="text-sm font-medium uppercase tracking-wide text-slate-500">
                            Categorías registradas
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        {categorias.length > 0 ? (
                            <RecursosTable categorias={categorias} />
                        ) : (
                            <div className="px-6 py-12 text-center">
                                <p className="text-sm text-slate-500">
                                    No hay categorías registradas.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">
                                Facturación
                            </h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Genera facturas para las sesiones de terapia.
                            </p>
                        </div>

                        <FacturaForm pacientes={pacientes} />
                    </div>
                </section>

                <section className="flex justify-end">
                    <LogoutButton />
                </section>
            </div>
        </main>
    )
}