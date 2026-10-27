import { useState, useRef, useEffect } from 'react'
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
  const [showList, setShowList] = useState(true)
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const hlsRef = useRef(null)
  const lastTap = useRef(0)

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
      hls.on(Hls.Events.ERROR, (e,d)=> { if(d.fatal){ setError(`❌ ${ch.name}`); const n=channels[index+1]; if(n) setTimeout(()=>playChannel(n,index+1),1000) }})
    } else {
      video.src = useProxy ? playUrl : ch.url
      video.play().catch(()=> setError('❌ جرب Proxy'))
    }
  }

  const handleDoubleClick = () => {
    setShowList(!showList)
  }

  // دوبل تاب للهاتف
  const handleTouch = () => {
    const now = Date.now()
    if (now - lastTap.current < 400) {
      setShowList(!showList)
    }
    lastTap.current = now
  }

  const loadFromUrl = async (server) => {
    setLoading(true)
    setActiveServer(server.id)
    try {
      const res = await fetch(server.url)
      const list = parseM3U(await res.text())
      setChannels(list)
      if (list.length > 0) playChannel(list[0], 0)
    } catch(e){ setError('خطأ') }
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
    <div style={{background:'#000', color:'#fff', minHeight:'100vh', fontFamily:'system-ui'}}>
      
      {/* حاوية الفيديو - مليان الشاشة */}
      <div ref={containerRef} style={{position:'relative', width:'100%', height:'100vh', background:'#000', overflow:'hidden'}} 
           onDoubleClick={handleDoubleClick} 
           onTouchEnd={handleTouch}>
        
        <video ref={videoRef} controls playsInline 
          style={{width:'100%', height:'100%', objectFit:'contain', background:'#000'}} />

        {/* اسم القناة */}
        {current && !showList && (
          <div style={{position:'absolute', top:'12px', left:'12px', background:'rgba(0,0,0,0.7)', padding:'10px 18px', borderRadius:'12px', fontSize:'22px', fontWeight:'800', color:'#00ff88'}}>
            {current.name}
          </div>
        )}

        {/* تلميح دوبل كليك */}
        <div style={{position:'absolute', bottom:'60px', left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.6)', padding:'8px 16px', borderRadius:'20px', fontSize:'16px', opacity: showList ? 0 : 0.8, transition:'0.3s', pointerEvents:'none'}}>
          👆 دوبل كليك لإظهار القائمة
        </div>

        {/* القائمة فوق الفيديو - تختفي بدوبل كليك */}
        {showList && (
          <div style={{
            position:'absolute', top:0, right:0, width:'38%', maxWidth:'380px', height:'100%', 
            background:'rgba(10,10,10,0.92)', backdropFilter:'blur(10px)', 
            display:'flex', flexDirection:'column', borderLeft:'2px solid #00ff88',
            transition:'transform 0.3s', transform: showList ? 'translateX(0)' : 'translateX(100%)'
          }}>
            <div style={{padding:'12px', background:'#111', borderBottom:'1px solid #222'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                <span style={{fontSize:'20px', fontWeight:'900'}}>📺 القنوات</span>
                <button onClick={()=>setShowList(false)} style={{background:'#222', border:'none', color:'#fff', fontSize:'22px', width:'36px', height:'36px', borderRadius:'50%'}}>✕</button>
              </div>
              <input placeholder="🔍 بحث..." value={search} onChange={e=>setSearch(e.target.value)} 
                style={{width:'100%', padding:'12px', borderRadius:'10px', border:'none', background:'#1a1a1a', color:'#fff', fontSize:'18px', boxSizing:'border-box'}} />
            </div>

            <div style={{padding:'8px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
              {SERVERS.map(s => (
                <button key={s.id} onClick={()=>loadFromUrl(s)} style={{padding:'12px', borderRadius:'10px', border:'none', background: activeServer===s.id ? '#00ff88' : '#222', color: activeServer===s.id ? '#000' : '#fff', fontWeight:'800', fontSize:'16px'}}>
                  {s.name}
                </button>
              ))}
            </div>

            <div style={{flex:1, overflowY:'auto', padding:'8px', display:'grid', gap:'8px'}}>
              {filtered.slice(0,400).map((ch, i) => (
                <div key={i} onClick={()=>playChannel(ch, i)} style={{padding:'14px', background: current?.url===ch.url ? '#00ff88' : '#1a1a1a', color: current?.url===ch.url ? '#000' : '#fff', borderRadius:'10px', fontSize:'18px', fontWeight:'700', cursor:'pointer'}}>
                  ▶️ {ch.name}
                </div>
              ))}
              {filtered.length===0 && <div style={{textAlign:'center', color:'#666', padding:'20px', fontSize:'18px'}}>لا توجد قنوات</div>}
            </div>

            <div style={{padding:'8px', background:'#111', borderTop:'1px solid #222'}}>
              <div style={{display:'flex', gap:'6px', marginBottom:'8px'}}>
                <input value={customUrl} onChange={e=>setCustomUrl(e.target.value)} placeholder="رابط M3U..." style={{flex:1, padding:'10px', borderRadius:'8px', border:'none', background:'#222', color:'#fff', fontSize:'14px'}} />
                <button onClick={loadCustom} style={{padding:'10px 14px', borderRadius:'8px', border:'none', background:'#00ff88', fontWeight:'900', fontSize:'14px'}}>شغل</button>
              </div>
              <div style={{display:'flex', gap:'6px'}}>
                <button onClick={()=>setUseProxy(!useProxy)} style={{flex:1, padding:'10px', borderRadius:'8px', border:'none', background: useProxy ? '#00ff88' : '#222', color: useProxy ? '#000' : '#fff', fontSize:'13px', fontWeight:'700'}}>
                  {useProxy ? '✅ Proxy' : '🔓 Proxy'}
                </button>
                <label style={{flex:1, background:'#222', padding:'10px', borderRadius:'8px', textAlign:'center', fontSize:'13px', fontWeight:'700'}}>
                  📂 ملف
                  <input type="file" accept=".m3u,.m3u8" onChange={handleFile} style={{display:'none'}} />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* للهاتف عمودي - نفس القائمة تحت */}
      <div style={{display:'none'}} className="mobile-only">
        {loading && <div style={{textAlign:'center', color:'#00ff88', fontSize:'22px', padding:'10px'}}>⏳ يحمل...</div>}
      </div>
    </div>
  )
}
