export function normalizePlate(p: string){
  return p.toUpperCase().replace(/[^A-Z0-9]/g,'')
}
export function isValidPlate(p: string){
  const x = normalizePlate(p)
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(x) || /^[A-Z]{3}[0-9]{4}$/.test(x)
}
