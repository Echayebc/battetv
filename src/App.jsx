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
  const [customUrl, setCustomUrl] = useState('')
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
    let playUrl = ch.url
    if (useProxy) playUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(ch.url)}`

    if (Hls.isSupported() && ch.url.includes('.m3u8') && !useProxy) {
      if (hlsRef.current) hlsRef.current.destroy()
      const hls = new Hls()
      hlsRef.current = hls
      hls.loadSource(ch.url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(()=>{}))
      hls.on(Hls.Events.ERROR, (e,d)=> { if(d.fatal){ setError(`❌ ${ch.name} لا تعمل`); const n=channels[index+1]; if(n) setTimeout(()=>playChannel(n,index+1),1000) }})
    } else {
      video.src = useProxy ? playUrl : ch.url
      video.play().catch(()=> setError('❌ جرب تفعيل Proxy'))
    }
  }

  const loadFromUrl = async (server) => {
    setLoading(true)
    setActiveServer(server.id)
    setError('')
    try {
      const res = await fetch(server.url)
      const list = parseM3U(await res.text())
      setChannels(list)
      if (list.length > 0) playChannel(list[0], 0)
    } catch(e){ setError('خطأ تحميل السيرفر') }
    setLoading(false)
  }

  const loadCustom = () => { if(customUrl.trim()) loadFromUrl({ id: 'custom', url: customUrl.trim() }) }

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
    <div style={{background:'#000', color:'#fff', minHeight:'100vh', fontFamily:'system-ui', margin:0}}>
      <div style={{background:'#000', position:'sticky', top:0, zIndex:10, padding:0}}>
        <video ref={videoRef} controls playsInline style={{width:'100%', height:'auto', maxHeight:'62vh', aspectRatio:'16/9', background:'#000', display:'block', objectFit:'fill'}} />
        {current && <div style={{padding:'16px', textAlign:'center', fontSize:'30px', fontWeight:'900', color:'#00ff88', background:'#0a0a0a'}}>{current.name}</div>}
        {error && <div style={{padding:'14px', background:'#cc0000', textAlign:'center', fontSize:'26px', fontWeight:'800'}}>{error}</div>}
      </div>

      <div style={{padding:'16px', background:'#0a0a0a'}}>
        <button onClick={()=>setUseProxy(!useProxy)} style={{width:'100%', padding:'22px', borderRadius:'16px', border:'none', background: useProxy ? '#00ff88' : '#222', color: useProxy ? '#000' : '#fff', fontSize:'26px', fontWeight:'900', marginBottom:'14px'}}>
          {useProxy ? '✅ Proxy مفعل' : '🔓 تفعيل Proxy للقنوات التي لا تعمل'}
        </button>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px'}}>
          {SERVERS.map(s => (
            <button key={s.id} onClick={()=>loadFromUrl(s)} style={{padding:'24px', borderRadius:'16px', border:'none', background: activeServer===s.id ? '#00ff88' : '#1e1e1e', color: activeServer===s.id ? '#000' : '#fff', fontWeight:'900', fontSize:'26px'}}>
              {s.name}
            </button>
          ))}
        </div>

        <div style={{display:'flex', gap:'10px', marginBottom:'14px'}}>
          <input value={customUrl} onChange={e=>setCustomUrl(e.target.value)} placeholder="الصق رابط M3U هنا..." style={{flex:1, padding:'20px', borderRadius:'16px', border:'none', background:'#1a1a1a', color:'#fff', fontSize:'24px'}} />
          <button onClick={loadCustom} style={{padding:'20px 28px', borderRadius:'16px', border:'none', background:'#00ff88', color:'#000', fontWeight:'900', fontSize:'24px'}}>شغل</button>
        </div>

        <label style={{display:'block', background:'#222', padding:'22px', borderRadius:'16px', textAlign:'center', marginBottom:'16px', fontSize:'26px', fontWeight:'800'}}>
          📂 رفع ملف M3U من الهاتف
          <input type="file" accept=".m3u,.m3u8,.txt" onChange={handleFile} style={{display:'none'}} />
        </label>

        {loading && <div style={{textAlign:'center', color:'#00ff88', fontSize:'32px', padding:'20px', fontWeight:'900'}}>⏳ يحمل...</div>}

        {channels.length > 0 && (
          <>
            <input placeholder="🔍 ابحث عن قناة..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%', padding:'20px', borderRadius:'16px', border:'none', background:'#1a1a1a', color:'#fff', marginBottom:'14px', fontSize:'26px', boxSizing:'border-box'}} />
            <div style={{display:'grid', gap:'12px'}}>
              {filtered.slice(0,400).map((ch, i) => (
                <div key={i} onClick={()=>playChannel(ch, i)} style={{padding:'22px', background: current?.url===ch.url ? '#00ff88' : '#141414', color: current?.url===ch.url ? '#000' : '#fff', borderRadius:'16px', fontSize:'28px', fontWeight:'800'}}>
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
