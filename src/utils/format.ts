export const currency = (v:number) => v.toLocaleString('pt-BR',{ style:'currency', currency:'BRL'})
export const percent = (v:number) => v.toLocaleString('pt-BR',{ style:'percent', minimumFractionDigits:2 })
export const dateBR = (s?:string) => s ? new Date(s).toLocaleDateString('pt-BR') : ''
