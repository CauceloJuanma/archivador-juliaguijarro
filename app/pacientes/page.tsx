// app/pacientes/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/logout-button'
import PacientesTable from './pacientes-table'
import { CirclePlus } from 'lucide-react'

export default async function PacientesPage() {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
        redirect('/login')
    }

    const { data: pacientes, error: pacientesError } = await supabase
        .from('pacientes')
        .select('id, nombre_completo, email, telefono, dni')
        .order('nombre_completo', { ascending: true })

    if (pacientesError) {
        return (
        <main className="min-h-screen bg-slate-100 px-4 py-10">
            <div className="mx-auto w-full max-w-6xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Zona privada
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                Has iniciado sesión como: {authData.user.email}
                </p>

                <div className="mt-6">
                <LogoutButton />
                </div>

                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Error cargando pacientes: {pacientesError.message}
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
                Has iniciado sesión como: {authData.user.email}
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
                {pacientes && pacientes.length > 0 ? (
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

            <section className="flex justify-end">
            <LogoutButton />
            </section>
        </div>
        </main>
    )
}