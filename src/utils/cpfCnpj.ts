export function onlyDigits(s:string){ return (s||'').replace(/\D/g,'') }
export function isValidCPF(cpf:string){
  cpf = onlyDigits(cpf)
  if(!cpf || cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false
  let sum=0; for(let i=0;i<9;i++) sum += parseInt(cpf[i])*(10-i)
  let d1 = 11 - (sum%11); if(d1>9) d1=0
  sum=0; for(let i=0;i<10;i++) sum += parseInt(cpf[i])*(11-i)
  let d2 = 11 - (sum%11); if(d2>9) d2=0
  return d1===parseInt(cpf[9]) && d2===parseInt(cpf[10])
}
export function isValidCNPJ(cnpj:string){
  cnpj = onlyDigits(cnpj)
  if(!cnpj || cnpj.length!==14) return false
  const w1=[5,4,3,2,9,8,7,6,5,4,3,2], w2=[6,5,4,3,2,9,8,7,6,5,4,3,2]
  let s=0; for(let i=0;i<12;i++) s+=parseInt(cnpj[i])*w1[i]
  let d1 = 11-(s%11); if(d1>9) d1=0
  s=0; for(let i=0;i<13;i++) s+=parseInt(cnpj[i])*w2[i]
  let d2 = 11-(s%11); if(d2>9) d2=0
  return d1===parseInt(cnpj[12]) && d2===parseInt(cnpj[13])
}
