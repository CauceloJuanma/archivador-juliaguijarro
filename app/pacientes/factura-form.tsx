'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CirclePlus, X } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

type Sesion = {
    fecha: string
}

export default function FacturaForm({ pacientes }: Props) {
    const [showForm, setShowForm] = useState(false)
    const [pacienteId, setPacienteId] = useState('')
    const [numeroSesiones, setNumeroSesiones] = useState(1)
    const [sesiones, setSesiones] = useState<Sesion[]>([{ fecha: '' }])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const supabase = createClient()

    const handleNumeroSesionesChange = (num: number) => {
        setNumeroSesiones(num)
        // Ajustar el array de sesiones
        if (num > sesiones.length) {
            const nuevasSesiones = Array.from({ length: num - sesiones.length }, () => ({ fecha: '' }))
            setSesiones([...sesiones, ...nuevasSesiones])
        } else if (num < sesiones.length) {
            setSesiones(sesiones.slice(0, num))
        }
    }

    const handleSesionFechaChange = (index: number, fecha: string) => {
        const nuevasSesiones = [...sesiones]
        nuevasSesiones[index].fecha = fecha
        setSesiones(nuevasSesiones)
    }

    const calcularTotal = () => {
        return numeroSesiones * 50 // 50€ por sesión
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (!pacienteId) {
            setError('Selecciona un paciente')
            setLoading(false)
            return
        }

        // Verificar que todas las fechas estén completas
        if (sesiones.some(s => !s.fecha)) {
            setError('Completa todas las fechas de las sesiones')
            setLoading(false)
            return
        }

        const { data: authData } = await supabase.auth.getUser()
        if (!authData?.user) {
            setError('Usuario no autenticado')
            setLoading(false)
            return
        }

        // Obtener datos del paciente
        const paciente = pacientes.find(p => p.id === pacienteId)
        if (!paciente) {
            setError('Paciente no encontrado')
            setLoading(false)
            return
        }

        const total = calcularTotal()
        const fechaEmision = new Date().toISOString()

        // Crear la factura
        const { data: factura, error: facturaError } = await supabase
            .from('facturas')
            .insert([{
                paciente_id: pacienteId,
                owner_id: authData.user.id,
                numero_sesiones: numeroSesiones,
                sesiones: sesiones,
                total: total,
                fecha_emision: fechaEmision
            }])
            .select()
            .single()

        if (facturaError) {
            setError('Error creando factura: ' + facturaError.message)
            setLoading(false)
            return
        }

        // Generar PDF de la factura
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const marginX = 12

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('es-ES')

    const formatMoney = (value: number) =>
        value.toFixed(2).replace('.', ',')

    const base = total
    const iva = total * 0.21
    const totalConIva = total + iva

    // Cargar el logo
    let logoLoaded = false
    try {
        const logoResponse = await fetch('/logo-julia-guijarro.png')
        if (logoResponse.ok) {
            const logoBlob = await logoResponse.blob()
            const logoUrl = URL.createObjectURL(logoBlob)
            const img = new Image()
            img.src = logoUrl
            await new Promise((resolve) => {
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    canvas.width = img.width
                    canvas.height = img.height
                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0)
                    const imgData = canvas.toDataURL('image/png')
                    doc.addImage(imgData, 'PNG', pageWidth - 52, 10, 40, 24)
                    logoLoaded = true
                    resolve(null)
                }
            })
        }
    } catch (err) {
        console.error('Error loading logo:', err)
    }

    // CABECERA
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('FACTURA COMPLETA', marginX, 22)

    // Si el logo no se cargó, mostrar placeholder
    if (!logoLoaded) {
        doc.setDrawColor(180)
        doc.setFillColor(245, 245, 245)
        doc.rect(pageWidth - 52, 10, 40, 24, 'FD')
        doc.setFontSize(10)
        doc.setTextColor(120)
        doc.text('LOGO', pageWidth - 32, 24, { align: 'center' })
        doc.setTextColor(0)
    }

    // Datos emisor placeholder
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Tu clínica / Nombre fiscal', marginX, 30)
    doc.text('CIF/NIF: XXXXXXXXX', marginX, 35)
    doc.text('Dirección de la empresa', marginX, 40)
    doc.text('Teléfono: XXX XXX XXX', marginX, 45)

    // Número y fecha
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`Número: ${factura.id}`, marginX, 58)
    doc.text(`Fecha: ${formatDate(fechaEmision)}`, marginX, 64)

    // Datos del paciente
    doc.setFontSize(10)
    doc.text('Datos del paciente', marginX, 70)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nombre: ${paciente.nombre_completo}`, marginX, 76)
    if (paciente.dni) doc.text(`DNI: ${paciente.dni}`, marginX, 82)
    if (paciente.email) doc.text(`Email: ${paciente.email}`, marginX, 88)
    if (paciente.telefono) doc.text(`Teléfono: ${paciente.telefono}`, marginX, 94)

    // Tabla de sesiones
    const tableBody = sesiones.map((sesion, index) => {
        const fechaSesion = formatDate(sesion.fecha)
        return [
            `${factura.id.slice(0, 8)}-${index + 1}`,
            `Sesión ${index + 1} (${fechaSesion})`,
            '1',
            '50,00',
            '50,00',
            '21%',
            '60,50'
        ]
    })

    autoTable(doc, {
        startY: 102,
        head: [['Referencia', 'Concepto', 'Cant.', 'Precio U.', 'Importe neto', 'IVA', 'Importe']],
        body: tableBody,
        margin: { left: marginX, right: marginX },
        styles: {
            fontSize: 8,
            cellPadding: 1.5,
            valign: 'middle'
        },
        headStyles: {
            fillColor: [210, 210, 210],
            textColor: 0,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [250, 250, 250]
        },
        columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 55 },
            2: { cellWidth: 12, halign: 'right' },
            3: { cellWidth: 20, halign: 'right' },
            4: { cellWidth: 22, halign: 'right' },
            5: { cellWidth: 16, halign: 'right' },
            6: { cellWidth: 20, halign: 'right' }
        }
    })

    const finalY = (doc as any).lastAutoTable.finalY + 12

    // Resumen izquierdo
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('Base', marginX, finalY)
    doc.text('%', 40, finalY)
    doc.text('IVA', 55, finalY)
    doc.text('Total', 75, finalY)

    doc.setFont('helvetica', 'normal')
    doc.text(formatMoney(base), marginX, finalY + 6)
    doc.text('21%', 40, finalY + 6)
    doc.text(formatMoney(iva), 55, finalY + 6)
    doc.text(formatMoney(totalConIva), 75, finalY + 6)

    // Caja de totales derecha
    const boxX = pageWidth - 62
    const boxY = finalY - 3
    doc.setFillColor(235, 235, 235)
    doc.rect(boxX, boxY, 50, 22, 'F')

    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL EUR', boxX + 4, boxY + 7)
    doc.text('IVA', boxX + 4, boxY + 14)
    doc.text('TOTAL EUR + IVA', boxX + 4, boxY + 21)

    doc.setFont('helvetica', 'normal')
    doc.text(formatMoney(base), boxX + 47, boxY + 7, { align: 'right' })
    doc.text(formatMoney(iva), boxX + 47, boxY + 14, { align: 'right' })
    doc.text(formatMoney(totalConIva), boxX + 47, boxY + 21, { align: 'right' })

    // Sello placeholder
    doc.setTextColor(190, 90, 90)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('PAGADO', pageWidth - 48, pageHeight - 30, { angle: -12 })
    doc.setTextColor(0)

    // SEGUNDA PÁGINA
    doc.addPage()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('INFORMACIÓN BÁSICA', marginX, 22)
    doc.text('PROTECCIÓN DE DATOS', marginX, 28)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    const infoLines = [
        'RESPONSABLE: Tu empresa.',
        'FINALIDAD: Emisión de facturas y gestión contable y fiscal.',
        'LEGITIMACIÓN: Relación contractual y cumplimiento legal.',
        'DESTINATARIOS: Entidades financieras y Administraciones Públicas.',
        'DERECHOS: Acceso, rectificación, supresión, oposición, limitación y portabilidad.',
        'INFORMACIÓN ADICIONAL: Puede consultar la política de privacidad en su web.'
    ]

    let y = 42
    infoLines.forEach((line) => {
        const split = doc.splitTextToSize(line, pageWidth - marginX * 2)
        doc.text(split, marginX, y)
        y += split.length * 6 + 2
    })

    doc.save(`factura-${factura.id}.pdf`)

        // Resetear formulario
        setShowForm(false)
        setPacienteId('')
        setNumeroSesiones(1)
        setSesiones([{ fecha: '' }])
        setLoading(false)
    }

    if (!showForm) {
        return (
            <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
                <CirclePlus className="h-5 w-5" />
                <span>Generar factura</span>
            </button>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Generar Factura</h2>
                        <button
                            onClick={() => setShowForm(false)}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Seleccionar Paciente *
                            </label>
                            <select
                                value={pacienteId}
                                onChange={(e) => setPacienteId(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                                required
                            >
                                <option value="">Seleccionar paciente...</option>
                                {pacientes.map((paciente) => (
                                    <option key={paciente.id} value={paciente.id}>
                                        {paciente.nombre_completo}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Número de Sesiones *
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={numeroSesiones}
                                onChange={(e) => handleNumeroSesionesChange(parseInt(e.target.value) || 1)}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                                required
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Cada sesión dura 1 hora y cuesta 50€
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Fechas de las Sesiones
                            </label>
                            <div className="space-y-3">
                                {sesiones.map((sesion, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <span className="text-sm text-slate-600 min-w-[100px]">
                                            Sesión {index + 1}:
                                        </span>
                                        <input
                                            type="date"
                                            value={sesion.fecha}
                                            onChange={(e) => handleSesionFechaChange(index, e.target.value)}
                                            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                                            required
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-700">Total a pagar:</span>
                                <span className="text-lg font-bold text-slate-900">{calcularTotal()}€</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Precio sin IVA</p>
                        </div>

                        {error && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                            >
                                {loading ? 'Generando...' : 'Generar Factura'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}