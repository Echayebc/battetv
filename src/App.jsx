import { useState, useRef } from 'react'
import Hls from 'hls.js'

const SERVERS = [
  { id: 'dz', name: '🇩🇿 الجزائر', url: 'https://iptv-org.github.io/iptv/countries/dz.m3u' },
  { id: 'sports', name: '⚽ رياضة', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u' },
  { id: 'ara', name: '📺 عربية', url: 'https://iptv-org.github.io/iptv/languages/ara.m3u' },
  { id: 'kids', name: '🧒 أطفال', url: 'https://iptv-org.github.io/iptv/categories/kids.m3u' },
  { id: 'news', name: '📰 أخبار', url: 'https://iptv-org.github.io/iptv/categories/news.m3u' },
  { id: 'bein', name: '🏆 BEIN TEST', url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist.m3u8' },
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
        if (url && url.startsWith('http')) list.push({ name, url, status: 'ok' })
      }
    }
    return list
  }

  const playChannel = (ch, index) => {
    setCurrent({ ...ch, index })
    setError('')
    const video = videoRef.current
    if (!video) return

    let streamUrl = ch.url
    // Proxy باش يفوت CORS
    if (useProxy && !streamUrl.includes('m3u8_proxy')) {
      streamUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(ch.url)}`
    }

    if (Hls.isSupported() && (ch.url.includes('.m3u8') || streamUrl.includes('.m3u8'))) {
      if (hlsRef.current) hlsRef.current.destroy()
      const hls = new Hls({ enableWorker: true })
      hlsRef.current = hls
      hls.loadSource(useProxy ? ch.url : ch.url) // HLS يخدم مباشر أحسن
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(()=>{}))
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          setError(`❌ القناة لا تعمل: ${ch.name}`)
          // جرب القناة الموالية تلقائيا
          const next = channels[index + 1]
          if (next) setTimeout(()=>playChannel(next, index+1), 1500)
        }
      })
    } else {
      video.src = streamUrl
      video.play().catch(()=> setError(`❌ هذه القناة محمية أو منتهية`))
    }
  }

  const loadFromUrl = async (server) => {
    setLoading(true)
    setActiveServer(server.id)
    setError('')
    try {
      const res = await fetch(server.url)
      const text = await res.text()
      const list = parseM3U(text)
      setChannels(list)
      if (list.length > 0) playChannel(list[0], 0)
      else setError('السيرفر فارغ')
    } catch(e){ setError('خطأ تحميل السيرفر') }
    setLoading(false)
  }

  const loadCustom = async () => {
    if(!customUrl) return
    loadFromUrl({ id: 'customUrl', url: customUrl })
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
    <div style={{background:'#080808', color:'#fff', minHeight:'100vh', fontFamily:'system-ui', fontSize:'18px'}}>
      <div style={{padding:'12px', background:'#111', position:'sticky', top:0, zIndex:10}}>
        <h2 style={{margin:'0 0 12px', textAlign:'center', fontSize:'22px', fontWeight:'900'}}>📺 BatteTV</h2>
        <video ref={videoRef} controls playsInline style={{width:'100%', aspectRatio:'16/9', background:'#000', borderRadius:'16px'}} 
          onError={()=>setError('❌ القناة لا تشتغل، سيتم تجريب التالية...')} />
        {current && <div style={{marginTop:'10px', textAlign:'center', fontSize:'18px', fontWeight:'bold', color:'#00ff88'}}>{current.name}</div>}
        {error && <div style={{marginTop:'8px', background:'#ff2222', padding:'10px', borderRadius:'10px', textAlign:'center', fontSize:'16px'}}>{error}</div>}
      </div>

      <div style={{padding:'12px'}}>
        <div style={{display:'flex', gap:'8px', marginBottom:'12px'}}>
          <button onClick={()=>setUseProxy(!useProxy)} style={{flex:1, padding:'12px', borderRadius:'12px', border:'none', background: useProxy ? '#00ff88' : '#222', color: useProxy ? '#000' : '#fff', fontSize:'16px', fontWeight:'bold'}}>
            {useProxy ? '✅ Proxy مفعل' : '🔓 تفعيل Proxy للقنوات المحجوبة'}
          </button>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px'}}>
          {SERVERS.map(s => (
            <button key={s.id} onClick={()=>loadFromUrl(s)} style={{padding:'16px', borderRadius:'14px', border:'none', background: activeServer===s.id ? '#00ff88' : '#1e1e1e', color: activeServer===s.id ? '#000' : '#fff', fontWeight:'bold', fontSize:'17px'}}>
              {s.name}
            </button>
          ))}
        </div>

        <div style={{display:'flex', gap:'8px', marginBottom:'12px'}}>
          <input value={customUrl} onChange={e=>setCustomUrl(e.target.value)} placeholder="الصق رابط M3U هنا..." style={{flex:1, padding:'14px', borderRadius:'12px', border:'none', background:'#222', color:'#fff', fontSize:'16px'}} />
          <button onClick={loadCustom} style={{padding:'14px 18px', borderRadius:'12px', border:'none', background:'#00ff88', fontWeight:'bold', fontSize:'16px'}}>شغل</button>
        </div>

        <label style={{display:'block', background:'#2a2a2a', padding:'16px', borderRadius:'14px', textAlign:'center', marginBottom:'14px', fontSize:'18px', fontWeight:'bold'}}>
          📂 رفع ملف من هاتفك
          <input type="file" accept=".m3u,.m3u8" onChange={handleFile} style={{display:'none'}} />
        </label>

        {loading && <div style={{textAlign:'center', color:'#00ff88', fontSize:'20px', padding:'20px'}}>⏳ يحمل...</div>}

        {channels.length > 0 && (
          <>
            <input placeholder="🔍 ابحث..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%', padding:'16px', borderRadius:'14px', border:'none', background:'#222', color:'#fff', marginBottom:'12px', fontSize:'18px', boxSizing:'border-box'}} />
            <div style={{color:'#999', fontSize:'14px', marginBottom:'10px'}}>{filtered.length} قناة - اضغط للتشغيل</div>
            <div style={{display:'grid', gap:'10px'}}>
              {filtered.slice(0,300).map((ch, i) => (
                <div key={i} onClick={()=>playChannel(ch, i)} style={{padding:'18px', background: current?.url===ch.url ? '#00ff88' : '#151515', color: current?.url===ch.url ? '#000' : '#fff', borderRadius:'14px', fontSize:'18px', fontWeight:'600', lineHeight:'1.4'}}>
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
