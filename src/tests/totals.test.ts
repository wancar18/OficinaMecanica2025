import { describe, it, expect } from 'vitest'
describe('cálculo de total de item', ()=>{
  it('aplica desconto', ()=>{
    const total = (qty:number, unit:number, discount:number) => (qty*unit) - discount
    expect(total(2, 100, 10)).toBe(190)
  })
})
