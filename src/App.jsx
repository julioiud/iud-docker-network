import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import NetworkDiagram from './NetworkDiagram'
import { FaDocker, FaNetworkWired, FaServer, FaCode, FaCloud, FaDatabase, FaReact, FaNodeJs } from 'react-icons/fa'
import { SiMongodb, SiMysql, SiAngular, SiVuedotjs } from 'react-icons/si'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1 style={{
        textAlign: 'center',
        marginTop: '1.2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontSize: '1.25em',
        fontWeight: 700,
        flexWrap: 'wrap',
        lineHeight: 1.2
      }}>
        <FaDocker style={{ color: '#2496ed', fontSize: 26, verticalAlign: 'middle' }} />
        <FaNetworkWired style={{ color: '#4f8cff', fontSize: 22, verticalAlign: 'middle' }} />
        <FaServer style={{ color: '#888', fontSize: 22, verticalAlign: 'middle' }} />
        <FaCloud style={{ color: '#00bfff', fontSize: 22, verticalAlign: 'middle' }} />
        <FaDatabase style={{ color: '#b8860b', fontSize: 22, verticalAlign: 'middle' }} />
        <FaReact style={{ color: '#61dafb', fontSize: 22, verticalAlign: 'middle' }} />
        <SiAngular style={{ color: '#dd0031', fontSize: 20, verticalAlign: 'middle' }} />
        <SiVuedotjs style={{ color: '#42b883', fontSize: 20, verticalAlign: 'middle' }} />
        <FaNodeJs style={{ color: '#3c873a', fontSize: 22, verticalAlign: 'middle' }} />
        <SiMongodb style={{ color: '#47a248', fontSize: 20, verticalAlign: 'middle' }} />
        <SiMysql style={{ color: '#00758f', fontSize: 20, verticalAlign: 'middle' }} />
        <FaCode style={{ color: '#198754', fontSize: 22, verticalAlign: 'middle' }} />
        <span style={{ marginLeft: 6 }}>Diagramador de ecosistema de desarrollo web con Docker</span>
      </h1>
      <NetworkDiagram />
      <footer style={{textAlign: 'center', marginTop: '2.5rem', color: '#243F59', fontWeight: 500, fontSize: '1.05em', letterSpacing: 0.2}}>
        Autor: Julio Martinez de la IUDIgital
      </footer>
    </div>
  )
}

export default App
