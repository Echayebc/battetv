import { useState, useRef } from 'react'
import Hls from 'hls.js'

function parseM3U(text){
  const lines = text.split('\n')
  const channels = []
  let title = ''
  lines.forEach(line => {
    if(line.startsWith('#EXTINF')){
      title = line.split(',')[1] || 'قناة'
    } else if(line.trim().startsWith('http')){
      channels.push({ name: title, url: line.trim() })
    }
  })
  return channels
}

export default function App(){
  const [channels, setChannels] = useState([])
  const videoRef = useRef(null)

  const loadM3U = async (e) => {
    const text = await e.target.files[0].text()
    setChannels(parseM3U(text))
  }

  const playChannel = (url) => {
    const video = videoRef.current
    if(Hls.isSupported()){
      const hls = new Hls()
      hls.loadSource(url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play())
    } else {
      video.src = url
      video.play()
    }
  }

  return (
    <div style={{background:'#0f0f0f', color:'#fff', minHeight:'100vh'}}>
      <div style={{position:'sticky', top:0, background:'#000'}}>
        <video ref={videoRef} controls style={{width:'100%', height:'250px'}} />
      </div>
      <input type="file" accept=".m3u" onChange={loadM3U} />
      <ul style={{listStyle:'none', padding:0}}>
        {channels.map((c,i) => (
          <li key={i} onClick={()=>playChannel(c.url)} style={{padding:'12px', background:'#1a1a1a', margin:'6px 0', borderRadius:'8px'}}>
            {c.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
