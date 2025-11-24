import * as XLSX from 'xlsx'

export function exportToCSV(filename:string, rows:any[]){
  const csv = [
    Object.keys(rows[0]||{}).join(','),
    ...rows.map(r=>Object.values(r).map(v=>JSON.stringify(v??'')).join(','))
  ].join('\n')
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'})
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename.endsWith('.csv')?filename:(filename+'.csv')
  a.click()
}

export function exportToXLSX(filename:string, rows:any[], sheet='Dados'){
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, sheet)
  XLSX.writeFile(wb, filename.endsWith('.xlsx')?filename:(filename+'.xlsx'))
}
