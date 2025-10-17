import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import NetworkDiagram from './NetworkDiagram'
import { FaDocker, FaNetworkWired, FaServer, FaCode, FaCloud, FaDatabase, FaReact, FaNodeJs } from 'react-icons/fa'
import { SiMongodb, SiMysql, SiAngular, SiVuedotjs } from 'react-icons/si'
import Footer from './components/Footer'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <div style={{
        textAlign: 'center',
        marginTop: '1.5rem',
        marginBottom: '1rem',
      }}>
        <h1 style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: '1.35em',
          fontWeight: 700,
          flexWrap: 'wrap',
          lineHeight: 1.3,
          marginBottom: '0.5rem',
          color: '#243F59'
        }}>
          <FaDocker style={{ color: '#2496ed', fontSize: 32 }} />
          <span>Diagramador Docker con Código Educativo</span>
        </h1>
        <p style={{
          fontSize: '0.95em',
          color: '#666',
          maxWidth: 750,
          margin: '0 auto',
          lineHeight: 1.5,
          padding: '0 1rem'
        }}>
          🎓 Aprende Docker diseñando arquitecturas visualmente. Genera código limpio y usa <strong>tooltips interactivos</strong> en la previsualización para entender cada concepto al instante.
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          marginTop: '0.8rem',
          flexWrap: 'wrap',
          fontSize: 24
        }}>
          <FaNetworkWired style={{ color: '#4f8cff' }} title="Redes Docker" />
          <FaServer style={{ color: '#888' }} title="Contenedores" />
          <FaDatabase style={{ color: '#b8860b' }} title="Bases de Datos" />
          <FaReact style={{ color: '#61dafb' }} title="React" />
          <SiAngular style={{ color: '#dd0031' }} title="Angular" />
          <SiVuedotjs style={{ color: '#42b883' }} title="Vue.js" />
          <FaNodeJs style={{ color: '#3c873a' }} title="Node.js" />
          <SiMongodb style={{ color: '#47a248' }} title="MongoDB" />
          <SiMysql style={{ color: '#00758f' }} title="MySQL" />
          <FaCode style={{ color: '#198754' }} title="Desarrollo" />
        </div>
      </div>
      <NetworkDiagram />
      <Footer />
    </div>
  )
}

export default App
