import { useState, useRef } from 'react'
import Hls from 'hls.js'

const SERVERS = [
  { id: 'dz', name: '🇩🇿 الجزائر', url: 'https://iptv-org.github.io/iptv/countries/dz.m3u' },
  { id: 'sports', name: '⚽ رياضة', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u' },
  { id: 'ara', name: '📺 عربية', url: 'https://iptv-org.github.io/iptv/languages/ara.m3u' },
  { id: 'kids', name: '🧒 أطفال', url: 'https://iptv-org.github.io/iptv/categories/kids.m3u' },
]

export default function App() {
  const [channels, setChannels] = useState([])
  const [current, setCurrent] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeServer, setActiveServer] = useState(null)
  const [error, setError] = useState('')
  const [useProxy, setUseProxy] = useState(false)
  const videoRef = useRef(null)
  const hlsRef = useRef(null)

  const parseM3U = (text) => {
    const lines = text.split('\n')
    const list = []
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF')) {
        const name = lines[i].split(',').pop()?.trim() || `قناة ${list.length+1}`
        let url = lines[i+1]?.trim()
        if (url && url.startsWith('http')) list.push({ name, url })
      }
    }
    return list
  }

  const playChannel = (ch, index) => {
    setCurrent({ ...ch, index })
    setError('')
    const video = videoRef.current
    if (!video) return
    if (Hls.isSupported() && ch.url.includes('.m3u8')) {
      if (hlsRef.current) hlsRef.current.destroy()
      const hls = new Hls()
      hlsRef.current = hls
      hls.loadSource(ch.url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(()=>{}))
      hls.on(Hls.Events.ERROR, (e,d)=> { if(d.fatal){ setError(`❌ ${ch.name} لا تعمل`); const next=channels[index+1]; if(next) setTimeout(()=>playChannel(next,index+1),1200) }})
    } else {
      video.src = ch.url
      video.play().catch(()=> setError(`❌ القناة محمية`))
    }
  }

  const loadFromUrl = async (server) => {
    setLoading(true)
    setActiveServer(server.id)
    try {
      const res = await fetch(server.url)
      const text = await res.text()
      const list = parseM3U(text)
      setChannels(list)
      if (list.length > 0) playChannel(list[0], 0)
    } catch(e){ setError('خطأ تحميل') }
    setLoading(false)
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const list = parseM3U(ev.target.result)
      setChannels(list)
      setActiveServer('file')
      if (list.length > 0) playChannel(list[0], 0)
    }
    reader.readAsText(file)
  }

  const filtered = channels.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{background:'#080808', color:'#fff', minHeight:'100vh', fontFamily:'system-ui'}}>
      <div style={{padding:'20px', background:'#111', position:'sticky', top:0, zIndex:10}}>
        <h2 style={{margin:'0 0 20px', textAlign:'center', fontSize:'72px', fontWeight:'900'}}>📺 BatteTV</h2>
        <video ref={videoRef} controls playsInline style={{width:'100%', aspectRatio:'16/9', background:'#000', borderRadius:'20px'}} />
        {current && <div style={{marginTop:'20px', textAlign:'center', fontSize:'54px', fontWeight:'900', color:'#00ff88', lineHeight:'1.2'}}>{current.name}</div>}
        {error && <div style={{marginTop:'20px', background:'#ff2222', padding:'20px', borderRadius:'20px', textAlign:'center', fontSize:'48px', fontWeight:'900'}}>{error}</div>}
      </div>

      <div style={{padding:'20px'}}>
        <button onClick={()=>setUseProxy(!useProxy)} style={{width:'100%', padding:'30px', borderRadius:'24px', border:'none', background: useProxy ? '#00ff88' : '#222', color: useProxy ? '#000' : '#fff', fontSize:'48px', fontWeight:'900', marginBottom:'24px'}}>
          {useProxy ? '✅ Proxy مفعل' : '🔓 Proxy'}
        </button>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'24px'}}>
          {SERVERS.map(s => (
            <button key={s.id} onClick={()=>loadFromUrl(s)} style={{padding:'40px 10px', borderRadius:'24px', border:'none', background: activeServer===s.id ? '#00ff88' : '#1e1e1e', color: activeServer===s.id ? '#000' : '#fff', fontWeight:'900', fontSize:'48px', lineHeight:'1.1'}}>
              {s.name}
            </button>
          ))}
        </div>

        <label style={{display:'block', background:'#2a2a2a', padding:'40px', borderRadius:'24px', textAlign:'center', marginBottom:'24px', fontSize:'54px', fontWeight:'900'}}>
          📂 رفع ملف M3U
          <input type="file" accept=".m3u,.m3u8" onChange={handleFile} style={{display:'none'}} />
        </label>

        {loading && <div style={{textAlign:'center', color:'#00ff88', fontSize:'60px', padding:'40px', fontWeight:'900'}}>⏳ يحمل...</div>}

        {channels.length > 0 && (
          <>
            <input placeholder="🔍 ابحث..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%', padding:'36px', borderRadius:'24px', border:'none', background:'#222', color:'#fff', marginBottom:'24px', fontSize:'48px', fontWeight:'700', boxSizing:'border-box'}} />
            <div style={{display:'grid', gap:'20px'}}>
              {filtered.slice(0,300).map((ch, i) => (
                <div key={i} onClick={()=>playChannel(ch, i)} style={{padding:'36px', background: current?.url===ch.url ? '#00ff88' : '#151515', color: current?.url===ch.url ? '#000' : '#fff', borderRadius:'24px', fontSize:'52px', fontWeight:'900', lineHeight:'1.3'}}>
                  ▶️ {ch.name}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
