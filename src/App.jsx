import { useState, useRef } from 'react'
import Hls from 'hls.js'

export default function App() {
  const [channels, setChannels] = useState([])
  const [current, setCurrent] = useState(null)
  const [search, setSearch] = useState('')
  const videoRef = useRef(null)
  const hlsRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n')
      const list = []
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF')) {
          const name = lines[i].split(',').pop()?.trim() || `قناة ${list.length+1}`
          const url = lines[i+1]?.trim()
          if (url && url.startsWith('http')) list.push({ name, url })
        }
      }
      setChannels(list)
      if (list.length > 0) playChannel(list[0])
    }
    reader.readAsText(file)
  }

  const playChannel = (ch) => {
    setCurrent(ch)
    const video = videoRef.current
    if (Hls.isSupported() && ch.url.includes('.m3u8')) {
      if (hlsRef.current) hlsRef.current.destroy()
      const hls = new Hls()
      hlsRef.current = hls
      hls.loadSource(ch.url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play())
    } else {
      video.src = ch.url
      video.play()
    }
  }

  const filtered = channels.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{background:'#0a0a0a', color:'#fff', minHeight:'100vh', fontFamily:'system-ui'}}>
      <div style={{padding:'10px', background:'#111', position:'sticky', top:0, zIndex:10}}>
        <h2 style={{margin:'0 0 10px', textAlign:'center'}}>📺 BatteTV</h2>
        <video ref={videoRef} controls style={{width:'100%', aspectRatio:'16/9', background:'#000', borderRadius:'12px'}} />
        {current && <div style={{marginTop:'8px', textAlign:'center', color:'#00ff88'}}>{current.name} - يعمل الآن</div>}
      </div>

      <div style={{padding:'12px', display:'flex', gap:'8px'}}>
        <label style={{flex:1, background:'#00ff88', color:'#000', padding:'12px', borderRadius:'10px', textAlign:'center', fontWeight:'bold'}}>
          📂 اختر ملف M3U
          <input type="file" accept=".m3u,.m3u8,.txt" onChange={handleFile} style={{display:'none'}} />
        </label>
      </div>

      {channels.length > 0 && (
        <div style={{padding:'0 12px'}}>
          <input placeholder="ابحث عن قناة..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'none', background:'#222', color:'#fff', marginBottom:'10px'}} />
          <div style={{display:'grid', gap:'6px'}}>
            {filtered.map((ch, i) => (
              <div key={i} onClick={()=>playChannel(ch)} style={{padding:'14px', background: current?.url===ch.url ? '#00ff88' : '#1a1a1a', color: current?.url===ch.url ? '#000' : '#fff', borderRadius:'10px', cursor:'pointer'}}>
                ▶️ {ch.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {channels.length===0 && (
        <div style={{textAlign:'center', marginTop:'60px', color:'#888'}}>
          <div style={{fontSize:'50px'}}>📺</div>
          <p>ارفع ملف قنوات M3U ليبدأ البث</p>
        </div>
      )}
    </div>
  )
}
