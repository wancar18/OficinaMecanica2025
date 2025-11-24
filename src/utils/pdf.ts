import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { currency, dateBR } from './format'

export function orderToPDF(data:any){
  const { order, items, customer, vehicle, payments } = data
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text('Ordem de Serviço', 14, 18)
  doc.setFontSize(10)
  doc.text(`Código: ${order.code}`, 14, 26)
  doc.text(`Cliente: ${customer.name}`, 14, 32)
  doc.text(`Veículo: ${vehicle.brand||''} ${vehicle.model||''} / Placa ${vehicle.plate}`, 14, 38)
  doc.text(`Abertura: ${dateBR(order.opened_at)} | Status: ${order.status} | Pagamento: ${order.payment_status}`, 14, 44)

  autoTable(doc, {
    startY: 50,
    head: [['Descrição', 'Qtd', 'Vlr Unit', 'Desc', 'Total']],
    body: items.map((i:any)=>[i.description, i.qty, currency(i.unit_price), currency(i.discount), currency(i.total)]),
    styles: { fontSize: 9 }
  })

  const total = currency(order.total)
  doc.text(`Subtotal Serviços: ${currency(order.total_services)} | Peças: ${currency(order.total_parts)} | Desconto: ${currency(order.discount)} | Acréscimo: ${currency(order.surcharge)}`, 14, (doc as any).lastAutoTable.finalY + 10)
  doc.setFontSize(14); doc.text(`TOTAL: ${total}`, 14, (doc as any).lastAutoTable.finalY + 20)
  if(payments?.length){
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 26,
      head: [['Data','Forma','Valor','Status']],
      body: payments.map((p:any)=>[dateBR(p.date), p.method, currency(p.amount), p.status]),
      styles: { fontSize: 9 }
    })
  }
  doc.text('Assinatura do cliente: ______________________________', 14, 280)
  return doc
}
