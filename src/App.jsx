import { useState, useRef, useEffect } from 'react'
import Hls from 'hls.js'

const SERVERS = [
  { id: 'dz', name: '🇩🇿 الجزائر', url: 'https://iptv-org.github.io/iptv/countries/dz.m3u' },
  { id: 'fr', name: '🇫🇷 فرنسا', url: 'https://iptv-org.github.io/iptv/countries/fr.m3u' },
  { id: 'sports', name: '⚽ رياضة', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u' },
  { id: 'news', name: '📰 أخبار عربية', url: 'https://iptv-org.github.io/iptv/languages/ara.m3u' },
  { id: 'kids', name: '🧒 أطفال', url: 'https://iptv-org.github.io/iptv/categories/kids.m3u' },
  { id: 'movies', name: '🎬 أفلام', url: 'https://iptv-org.github.io/iptv/categories/movies.m3u' },
]

export default function App() {
  const [channels, setChannels] = useState([])
  const [current, setCurrent] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeServer, setActiveServer] = useState(null)
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

  const playChannel = (ch) => {
    setCurrent(ch)
    const video = videoRef.current
    if (!video) return
    try {
      if (Hls.isSupported() && ch.url.includes('.m3u8')) {
        if (hlsRef.current) hlsRef.current.destroy()
        const hls = new Hls()
        hlsRef.current = hls
        hls.loadSource(ch.url)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(()=>{}))
      } else {
        video.src = ch.url
        video.play().catch(()=>{})
      }
    } catch(e){ console.log(e) }
  }

  const loadFromUrl = async (server) => {
    setLoading(true)
    setActiveServer(server.id)
    try {
      const res = await fetch(server.url)
      const text = await res.text()
      const list = parseM3U(text)
      setChannels(list)
      if (list.length > 0) playChannel(list[0])
    } catch(e){ alert('خطأ في تحميل السيرفر: ' + e.message) }
    setLoading(false)
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const list = parseM3U(ev.target.result)
      setChannels(list)
      setActiveServer('custom')
      if (list.length > 0) playChannel(list[0])
    }
    reader.readAsText(file)
  }

  const filtered = channels.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{background:'#0a0a0a', color:'#fff', minHeight:'100vh', fontFamily:'system-ui', paddingBottom:'20px'}}>
      <div style={{padding:'10px', background:'#111', position:'sticky', top:0, zIndex:10}}>
        <h2 style={{margin:'0 0 10px', textAlign:'center', fontSize:'18px'}}>📺 BatteTV - {current?.name || 'مباشر'}</h2>
        <video ref={videoRef} controls style={{width:'100%', aspectRatio:'16/9', background:'#000', borderRadius:'12px'}} />
        {loading && <div style={{textAlign:'center', color:'#00ff88', marginTop:'8px'}}>⏳ جاري تحميل القنوات...</div>}
      </div>

      <div style={{padding:'10px'}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'10px'}}>
          {SERVERS.map(s => (
            <button key={s.id} onClick={()=>loadFromUrl(s)} style={{padding:'12px 5px', borderRadius:'10px', border:'none', background: activeServer===s.id ? '#00ff88' : '#222', color: activeServer===s.id ? '#000' : '#fff', fontWeight:'bold', fontSize:'13px'}}>
              {s.name}
            </button>
          ))}
        </div>

        <label style={{display:'block', background:'#333', color:'#fff', padding:'12px', borderRadius:'10px', textAlign:'center', marginBottom:'10px', border: activeServer==='custom' ? '2px solid #00ff88' : 'none'}}>
          📂 اختر M3U من هاتفك
          <input type="file" accept=".m3u,.m3u8,.txt" onChange={handleFile} style={{display:'none'}} />
        </label>

        {channels.length > 0 && (
          <>
            <input placeholder="🔍 ابحث عن قناة..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'none', background:'#222', color:'#fff', marginBottom:'10px', boxSizing:'border-box'}} />
            <div style={{color:'#888', fontSize:'12px', marginBottom:'8px'}}>{filtered.length} قناة</div>
            <div style={{display:'grid', gap:'6px'}}>
              {filtered.slice(0,200).map((ch, i) => (
                <div key={i} onClick={()=>playChannel(ch)} style={{padding:'14px', background: current?.url===ch.url ? '#00ff88' : '#1a1a1a', color: current?.url===ch.url ? '#000' : '#fff', borderRadius:'10px', cursor:'pointer', fontSize:'14px'}}>
                  ▶️ {ch.name}
                </div>
              ))}
            </div>
          </>
        )}

        {channels.length===0 && !loading && (
          <div style={{textAlign:'center', marginTop:'40px', color:'#666'}}>
            <div style={{fontSize:'40px'}}>👆</div>
            <p>اختر سيرفر من الفوق ليبدأ البث</p>
          </div>
        )}
      </div>
    </div>
  )
}
