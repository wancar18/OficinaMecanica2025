import React, { useEffect, useState } from 'react'
import { dal, db } from '../../db/dal'
import { useAuthStore } from '../../store/auth'
import { ensureOpfs as ensureOPFS, exportBytes, importBytes } from '../../db/sqljs'

export default function Settings(){
  const [s,setS]=useState<any>({})
  const user = useAuthStore(s=>s.user)!
  const changePassword = useAuthStore(s=>s.changePassword)
  const [storageKind, setStorageKind] = useState<string>('detectando…')

  useEffect(()=>{
    (async()=>{
      await db.ensureReady()
      setS(await dal.settings.getAll())
      try {
        const ok = await ensureOPFS()
        setStorageKind(ok ? 'OPFS' : 'IndexedDB (fallback)')
      } catch {
        setStorageKind('IndexedDB (fallback)')
      }
    })()
  },[])

  return (
    <div className="grid gap-6 max-w-3xl">
      <div className="card">
        <div className="font-semibold mb-2">Dados da Oficina</div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">Nome</label><input className="input" defaultValue={s.oficina_nome||''} onBlur={e=>dal.settings.set('oficina_nome', e.target.value)}/></div>
          <div><label className="label">CNPJ</label><input className="input" defaultValue={s.oficina_cnpj||''} onBlur={e=>dal.settings.set('oficina_cnpj', e.target.value)}/></div>
          <div className="col-span-2"><label className="label">Endereço</label><input className="input" defaultValue={s.oficina_endereco||''} onBlur={e=>dal.settings.set('oficina_endereco', e.target.value)}/></div>
          <div><label className="label">Telefone</label><input className="input" defaultValue={s.oficina_fone||''} onBlur={e=>dal.settings.set('oficina_fone', e.target.value)}/></div>
          <div><label className="label">Email</label><input className="input" defaultValue={s.oficina_email||''} onBlur={e=>dal.settings.set('oficina_email', e.target.value)}/></div>
        </div>
      </div>

      <div className="card">
        <div className="font-semibold mb-2">Segurança</div>
        <div className="grid grid-cols-3 gap-2 items-end">
          <div className="col-span-2">
            <label className="label">Alterar senha (usuário atual)</label>
            <input id="newpass" type="password" className="input" placeholder="Nova senha"/>
          </div>
          <button className="btn" onClick={async()=>{
            const inp = document.getElementById('newpass') as HTMLInputElement
            if(!inp.value){ alert('Informe a nova senha'); return }
            await changePassword(user.id, inp.value)
            inp.value=''
            alert('Senha alterada.')
          }}>Salvar</button>
        </div>
        <p className="text-xs text-gray-400 mt-2">A senha padrão do primeiro acesso é "123". No primeiro login, é obrigatória sua alteração.</p>
      </div>

      <div className="card">
        <div className="font-semibold mb-2">Backup & Restauração</div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={async()=>{
            const bytes = await exportBytes()
            // converte para ArrayBuffer real (TS 5.6 exige BlobPart com ArrayBuffer)
            const ab = new ArrayBuffer(bytes.byteLength)
            new Uint8Array(ab).set(bytes)
            const blob = new Blob([ab], { type:'application/x-sqlite3' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = 'oficina.sqlite'
            a.click()
          }}>Baixar backup (.sqlite)</button>
          <label className="btn">
            Importar
            <input type="file" accept=".sqlite,.db,application/x-sqlite3" className="hidden" onChange={async (e)=>{
              const f = e.target.files?.[0]; if(!f) return
              const buf = new Uint8Array(await f.arrayBuffer())
              await importBytes(buf)
              alert('Banco importado. Recarregando…')
              location.reload()
            }}/>
          </label>
          <span className="text-xs text-gray-400 ml-2">Armazenamento: {storageKind}</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">Os dados ficam <strong>no seu navegador/dispositivo</strong>. Faça backups periódicos.</p>
      </div>
    </div>
  )
}
