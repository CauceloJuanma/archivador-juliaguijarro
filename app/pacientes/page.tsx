// app/pacientes/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/logout-button'
import PacientesTable from './pacientes-table'

export default async function PacientesPage() {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
        redirect('/login')
    }

    // Consulta a la tabla 'pacientes'
    const { data: pacientes, error: pacientesError } = await supabase
        .from('pacientes')
        .select('id, nombre_completo, email, telefono, dni')
        .order('nombre_completo', { ascending: true })

    if (pacientesError) {
        return (
            <main style={{ padding: '2rem' }}>
                <h1>Zona privada</h1>
                <p>Has iniciado sesión como: {authData.user.email}</p>
                <LogoutButton />
                <p style={{ color: 'red' }}>Error cargando pacientes: {pacientesError.message}</p>
            </main>
        )
    }

    return (
        <main style={{ padding: '2rem' }}>
            <h1>Zona privada</h1>
            <p>Has iniciado sesión como: {authData.user.email}</p>
            <LogoutButton />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>Lista de pacientes</h2>
                <Link href="/pacientes/nuevo" style={{ padding: '0.5rem 1rem', backgroundColor: '#0b5fff', color: '#fff', borderRadius: '4px', textDecoration: 'none' }}>
                    Registrar nuevo paciente
                </Link>
            </div>
            {pacientes && pacientes.length > 0 ? (
                <PacientesTable pacientes={pacientes} />
            ) : (
                <p>No hay pacientes registrados.</p>
            )}
        </main>
    )
}
