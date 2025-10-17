import React, { useState } from 'react';
import { FaQuestionCircle, FaInfoCircle } from 'react-icons/fa';

// Base de conocimiento de tooltips
const tooltips = {
  'version': {
    title: 'Versión de Docker Compose',
    description: 'Especifica la versión del formato del archivo. La versión 3.8 es estable y ampliamente soportada.',
    link: 'https://docs.docker.com/compose/compose-file/compose-versioning/'
  },
  'services': {
    title: 'Servicios (Contenedores)',
    description: 'Lista de todos los contenedores que componen tu aplicación. Cada servicio se ejecuta en un contenedor aislado.',
    link: 'https://docs.docker.com/compose/compose-file/#services'
  },
  'image': {
    title: 'Imagen Docker',
    description: 'Especifica qué imagen usar para este contenedor. Las imágenes se descargan desde Docker Hub si no existen localmente.',
    link: 'https://docs.docker.com/compose/compose-file/#image'
  },
  'build': {
    title: 'Construir Imagen',
    description: 'En lugar de usar una imagen pre-construida, Docker construirá una imagen custom usando el Dockerfile en la ruta especificada.',
    link: 'https://docs.docker.com/compose/compose-file/#build'
  },
  'container_name': {
    title: 'Nombre del Contenedor',
    description: 'Nombre único para identificar el contenedor. Útil para logs y comandos docker.',
    link: 'https://docs.docker.com/compose/compose-file/#container_name'
  },
  'ports': {
    title: 'Mapeo de Puertos',
    description: 'Formato: PUERTO_HOST:PUERTO_CONTENEDOR. Permite acceder al servicio desde tu máquina (localhost:PUERTO_HOST).',
    example: '3306:3306 = Acceso vía localhost:3306',
    link: 'https://docs.docker.com/compose/compose-file/#ports'
  },
  'environment': {
    title: 'Variables de Entorno',
    description: 'Configuran el comportamiento del contenedor. Cada servicio tiene variables específicas (contraseñas, nombres de BD, etc).',
    link: 'https://docs.docker.com/compose/compose-file/#environment'
  },
  'volumes': {
    title: 'Volúmenes',
    description: 'Almacenamiento persistente. Los datos se mantienen aunque el contenedor se elimine. Formato: VOLUMEN:RUTA_EN_CONTENEDOR',
    link: 'https://docs.docker.com/compose/compose-file/#volumes'
  },
  'networks': {
    title: 'Redes',
    description: 'Conecta el contenedor a redes específicas. Los contenedores en la misma red pueden comunicarse usando sus nombres de servicio.',
    example: 'backend puede conectarse a mysql:3306',
    link: 'https://docs.docker.com/compose/compose-file/#networks'
  },
  'depends_on': {
    title: 'Dependencias',
    description: 'Indica que este servicio depende de otro. Docker iniciará las dependencias primero.',
    link: 'https://docs.docker.com/compose/compose-file/#depends_on'
  },
  'driver': {
    title: 'Driver de Red',
    description: 'El driver "bridge" crea una red virtual aislada donde los contenedores pueden comunicarse entre sí pero están aislados del host.',
    link: 'https://docs.docker.com/network/bridge/'
  }
};

const YamlPanelWithTooltips = ({ yml, handleCopyYML, showCopyMsg }) => {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Detecta palabras clave y las envuelve con spans interactivos
  const renderYamlWithTooltips = (yamlText) => {
    const lines = yamlText.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Detecta comentarios
      if (line.trim().startsWith('#')) {
        return (
          <div key={lineIndex} style={{ color: '#6c757d', fontStyle: 'italic' }}>
            {line}
          </div>
        );
      }

      // Detecta keys (palabras seguidas de ':')
      const keyMatch = line.match(/^(\s*)([a-z_]+):/i);
      if (keyMatch) {
        const indent = keyMatch[1];
        const key = keyMatch[2];
        const rest = line.substring(keyMatch[0].length);
        
        const hasTooltip = tooltips[key];
        
        return (
          <div key={lineIndex} style={{ position: 'relative' }}>
            <span>{indent}</span>
            <span
              style={{
                color: hasTooltip ? '#C52331' : '#243F59',
                fontWeight: 600,
                cursor: hasTooltip ? 'help' : 'default',
                textDecoration: hasTooltip ? 'underline' : 'none',
                textDecorationStyle: hasTooltip ? 'dotted' : 'none',
              }}
              onMouseEnter={(e) => {
                if (hasTooltip) {
                  const rect = e.target.getBoundingClientRect();
                  setTooltipPosition({ x: rect.right + 10, y: rect.top });
                  setActiveTooltip(key);
                }
              }}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              {key}
            </span>
            <span>:{rest}</span>
          </div>
        );
      }

      // Líneas normales (valores, listas, etc)
      return (
        <div key={lineIndex} style={{ color: '#198754' }}>
          {line}
        </div>
      );
    });
  };

  return (
    <div className="yml-panel" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <b style={{ fontSize: '1.08em', color: '#243F59' }}>docker-compose.yml</b>
          <FaInfoCircle style={{ color: '#4f8cff', fontSize: 16 }} title="Pasa el mouse sobre las palabras subrayadas para más información" />
        </div>
        <button className="btn-blue" style={{ fontSize: '0.95em', padding: '0.35rem 1.2rem' }} onClick={handleCopyYML}>
          Copiar
        </button>
      </div>
      
      <div className="yml-pre" style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.9em', lineHeight: 1.6 }}>
        {renderYamlWithTooltips(yml)}
      </div>
      
      {showCopyMsg && (
        <div style={{ color: '#198754', marginTop: 8, fontWeight: 600, textAlign: 'center' }}>
          ✓ ¡Copiado al portapapeles!
        </div>
      )}

      {/* Tooltip flotante */}
      {activeTooltip && tooltips[activeTooltip] && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            background: 'linear-gradient(135deg, #243F59 0%, #34587a 100%)',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            maxWidth: 320,
            zIndex: 10000,
            fontSize: '0.9em',
            lineHeight: 1.5,
            animation: 'tooltipFadeIn 0.2s',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaQuestionCircle />
            {tooltips[activeTooltip].title}
          </div>
          <div style={{ marginBottom: 8 }}>
            {tooltips[activeTooltip].description}
          </div>
          {tooltips[activeTooltip].example && (
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 8px', borderRadius: 4, fontSize: '0.85em', marginBottom: 8 }}>
              <strong>Ejemplo:</strong> {tooltips[activeTooltip].example}
            </div>
          )}
          <a
            href={tooltips[activeTooltip].link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#61dafb', fontSize: '0.85em', textDecoration: 'underline' }}
          >
            📖 Ver documentación oficial
          </a>
        </div>
      )}

      <style>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default YamlPanelWithTooltips;

