import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FaServer, FaDesktop, FaNetworkWired, FaHdd, FaLinux, FaWindows, FaDatabase } from 'react-icons/fa';
import { SiMysql, SiPostgresql, SiMongodb, SiOracle, SiApachekafka, SiSpring, SiFlask, SiDjango, SiLaravel, SiReact, SiAngular, SiVuedotjs, SiDotnet } from 'react-icons/si';
import './NetworkDiagram.css';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import NodeForm from './components/NetworkDiagram/NodeForm';
import LinkForm from './components/NetworkDiagram/LinkForm';
import Toolbar from './components/NetworkDiagram/Toolbar';
import YamlPanel from './components/NetworkDiagram/YamlPanel';
import NodeIcons from './components/NetworkDiagram/NodeIcons';

const NODE_RADIUS = 24;

const LOCALSTORAGE_KEY = 'network-diagram-state-v1';

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

const nodeTypes = [
  { value: 'server', label: 'Server', icon: <FaServer /> },
  { value: 'workstation', label: 'Workstation', icon: <FaDesktop /> },
  { value: 'network', label: 'Red', icon: <FaNetworkWired /> },
  { value: 'disk', label: 'Disco', icon: <FaHdd /> },
];

const osTypes = [
  { value: 'linux', label: 'Linux', icon: <FaLinux /> },
  { value: 'windows', label: 'Windows', icon: <FaWindows /> },
];

const serverServices = [
  { value: 'mysql', label: 'MySQL', image: 'mysql:8.0' },
  { value: 'postgresql', label: 'PostgreSQL', image: 'postgres:15' },
  { value: 'oracle', label: 'Oracle', image: 'gvenzl/oracle-xe' },
  { value: 'sqlserver', label: 'SQL Server', image: 'mcr.microsoft.com/mssql/server:2022-latest' },
  { value: 'mongodb', label: 'MongoDB', image: 'mongo:7' },
  { value: 'kafka', label: 'Kafka', image: 'bitnami/kafka:latest' },
  { value: 'springboot', label: 'App Java Spring Boot', image: 'openjdk:17' },
  { value: 'flask', label: 'App Python Flask', image: 'python:3.11' },
  { value: 'django', label: 'App Python Django', image: 'python:3.11' },
  { value: 'laravel', label: 'App PHP Laravel', image: 'php:8.2-apache' },
  { value: 'reactjs', label: 'ReactJS', image: 'node:20' },
  { value: 'angular', label: 'Angular', image: 'node:20' },
  { value: 'vuejs', label: 'VueJS', image: 'node:20' },
  { value: 'dotnet', label: '.NET', image: 'mcr.microsoft.com/dotnet/aspnet:8.0' },
];

// Variables y puertos por servicio
const defaultServiceConfig = {
  mysql: { env: { MYSQL_ROOT_PASSWORD: 'root', MYSQL_DATABASE: 'test' }, ports: ['3306:3306'] },
  postgresql: { env: { POSTGRES_PASSWORD: 'postgres', POSTGRES_DB: 'test' }, ports: ['5432:5432'] },
  oracle: { env: { ORACLE_PASSWORD: 'oracle' }, ports: ['1521:1521'] },
  sqlserver: { env: { ACCEPT_EULA: 'Y', SA_PASSWORD: 'SqlServer2023!' }, ports: ['1433:1433'] },
  mongodb: { env: { MONGO_INITDB_ROOT_USERNAME: 'mongo', MONGO_INITDB_ROOT_PASSWORD: 'mongo' }, ports: ['27017:27017'] },
  kafka: { env: {}, ports: ['9092:9092'] },
  springboot: { env: {}, ports: ['8080:8080'] },
  flask: { env: {}, ports: ['5000:5000'] },
  django: { env: {}, ports: ['8000:8000'] },
  laravel: { env: {}, ports: ['80:80'] },
  reactjs: { env: {}, ports: ['3000:3000'] },
  angular: { env: {}, ports: ['4200:4200'] },
  vuejs: { env: {}, ports: ['5173:5173'] },
  dotnet: { env: {}, ports: ['80:80'] },
};

// Utilidades para distinguir apps y bases de datos
const appServices = ['springboot', 'flask', 'django', 'laravel', 'reactjs', 'angular', 'vuejs', 'dotnet'];
const dbServices = ['mysql', 'postgresql', 'oracle', 'sqlserver', 'mongodb', 'kafka'];

function getServiceKey(services) {
  if (Array.isArray(services)) return services[0] || '';
  return services || '';
}

function generateDockerfile(node) {
  const serviceKey = getServiceKey(node.services);
  if (!serviceKey || !appServices.includes(serviceKey)) {
    if (node.os === 'windows') {
      return `FROM mcr.microsoft.com/windows/servercore:ltsc2019\nCMD [\"powershell.exe\"]\n`;
    }
    return `FROM ubuntu:latest\nCMD [\"/bin/bash\"]\n`;
  }
  switch (serviceKey) {
    case 'springboot':
      return `# Dockerfile para Spring Boot\nFROM openjdk:17-jdk-slim\nWORKDIR /app\nCOPY ./*.jar app.jar\nEXPOSE 8080\nENTRYPOINT [\"java\", \"-jar\", \"app.jar\"]\n`;
    case 'flask':
      return `# Dockerfile para Flask\nFROM python:3.11-slim\nWORKDIR /app\nCOPY . .\nRUN pip install --no-cache-dir -r requirements.txt\nEXPOSE 5000\nCMD [\"python\", \"app.py\"]\n`;
    case 'django':
      return `# Dockerfile para Django\nFROM python:3.11-slim\nWORKDIR /app\nCOPY . .\nRUN pip install --no-cache-dir -r requirements.txt\nEXPOSE 8000\nCMD [\"python\", \"manage.py\", \"runserver\", \"0.0.0.0:8000\"]\n`;
    case 'laravel':
      return `# Dockerfile para Laravel\nFROM php:8.2-apache\nWORKDIR /var/www/html\nCOPY . .\nRUN docker-php-ext-install pdo pdo_mysql\nEXPOSE 80\n`;
    case 'reactjs':
      return `# Dockerfile para ReactJS\nFROM node:20\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD [\"npm\", \"start\"]\n`;
    case 'angular':
      return `# Dockerfile para Angular\nFROM node:20\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 4200\nCMD [\"npm\", \"start\"]\n`;
    case 'vuejs':
      return `# Dockerfile para VueJS\nFROM node:20\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 5173\nCMD [\"npm\", \"run\", \"dev\"]\n`;
    case 'dotnet':
      return `# Dockerfile para .NET\nFROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base\nWORKDIR /app\nEXPOSE 80\nFROM mcr.microsoft.com/dotnet/sdk:8.0 AS build\nWORKDIR /src\nCOPY . .\nRUN dotnet publish -c Release -o /app\nFROM base AS final\nWORKDIR /app\nCOPY --from=build /app .\nENTRYPOINT [\"dotnet\", \"app.dll\"]\n`;
    default:
      return `FROM ubuntu:latest\nCMD [\"/bin/bash\"]\n`;
  }
}

function generateDockerCompose(nodes, links) {
  // Filtrar nodos relevantes
  const services = nodes.filter(n => n.type === 'server' || n.type === 'workstation');
  const networks = nodes.filter(n => n.type === 'network');
  const disks = nodes.filter(n => n.type === 'disk');
  // Mapear redes a nombres
  const networkNames = networks.map((n, i) => n.name || `net${i+1}`);
  // Mapear servicios a nombres
  const serviceNames = services.map((n, i) => n.name || `${n.type}${i+1}`);

  // Relacionar servicios con redes según enlaces
  const serviceNetworks = {};
  services.forEach((svc, i) => {
    const svcLinks = links.filter(l => l.from === svc.id || l.to === svc.id);
    const nets = svcLinks.map(l => {
      const otherId = l.from === svc.id ? l.to : l.from;
      const netNode = nodes.find(n => n.id === otherId && n.type === 'network');
      if (netNode) return networkNames[networks.findIndex(n => n.id === netNode.id)];
      return null;
    }).filter(Boolean);
    serviceNetworks[serviceNames[i]] = [...new Set(nets)];
  });

  // Relacionar servicios con discos según enlaces
  const serviceDisks = {};
  services.forEach((svc, i) => {
    const svcLinks = links.filter(l => l.from === svc.id || l.to === svc.id);
    const diskMounts = svcLinks.map(l => {
      const otherId = l.from === svc.id ? l.to : l.from;
      const diskNode = nodes.find(n => n.id === otherId && n.type === 'disk');
      if (diskNode) {
        // Nombre único por servicio-disco
        return `vol_${serviceNames[i]}_${diskNode.id}`;
      }
      return null;
    }).filter(Boolean);
    serviceDisks[serviceNames[i]] = [...new Set(diskMounts)];
  });

  // --- Lógica especial para Kafka + Zookeeper ---
  // Buscar todos los nodos kafka
  const kafkaNodes = services
    .map((svc, i) => ({ svc, i, serviceKey: getServiceKey(svc.services) }))
    .filter(({ serviceKey }) => serviceKey === 'kafka');
  let zookeeperAdded = false;
  let zookeeperNetworks = [];
  if (kafkaNodes.length > 0) {
    // Unir todas las redes de los kafka
    zookeeperNetworks = [
      ...new Set(kafkaNodes.flatMap(({ i }) => serviceNetworks[serviceNames[i]] || []))
    ];
  }

  // Construir YAML
  let yml = 'version: "3.8"\nservices:\n';
  services.forEach((svc, i) => {
    const name = serviceNames[i];
    if (svc.type === 'server') {
      const serviceKey = getServiceKey(svc.services);
      if (serviceKey) {
        const serviceDef = serverServices.find(s => s.value === serviceKey);
        if (serviceDef) {
          const svcName = `${name}-${serviceKey}`;
          yml += `  ${svcName}:\n`;
          if (serviceKey === 'kafka') {
            // Kafka depende de zookeeper
            yml += `    image: ${serviceDef.image}\n`;
            yml += `    container_name: ${svcName}\n`;
            yml += `    depends_on:\n      - zookeeper\n`;
            yml += `    environment:\n`;
            yml += `      - KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181\n`;
            // Agregar otras variables de entorno personalizadas
            const envs = (svc.serviceConfigs && svc.serviceConfigs[serviceKey]?.env) || {};
            Object.entries(envs).forEach(([k, v]) => {
              if (k !== 'KAFKA_ZOOKEEPER_CONNECT') yml += `      - ${k}=${v}\n`;
            });
            // Puertos
            const ports = (svc.serviceConfigs && svc.serviceConfigs[serviceKey]?.ports) || [];
            if (ports.length > 0) {
              yml += `    ports:\n`;
              ports.forEach(p => {
                if (p && p.trim()) yml += `      - \"${p}\"\n`;
              });
            }
            if (serviceDisks[name] && serviceDisks[name].length > 0) {
              yml += `    volumes:\n`;
              serviceDisks[name].forEach(vol => {
                yml += `      - ${vol}:/data/${vol}\n`;
              });
            }
            // Redes
            const nets = serviceNetworks[name] || [];
            if (nets.length > 0) {
              yml += `    networks:\n`;
              nets.forEach(net => {
                yml += `      - ${net}\n`;
              });
            }
            yml += '\n';
            zookeeperAdded = true;
          } else if (appServices.includes(serviceKey)) {
            yml += `    build: ./${svcName}\n`;
            yml += `    container_name: ${svcName}\n`;
            // Variables de entorno
            const envs = (svc.serviceConfigs && svc.serviceConfigs[serviceKey]?.env) || {};
            if (Object.keys(envs).length > 0) {
              yml += `    environment:\n`;
              Object.entries(envs).forEach(([k, v]) => {
                yml += `      - ${k}=${v}\n`;
              });
            }
            // Puertos
            const ports = (svc.serviceConfigs && svc.serviceConfigs[serviceKey]?.ports) || [];
            if (ports.length > 0) {
              yml += `    ports:\n`;
              ports.forEach(p => {
                if (p && p.trim()) yml += `      - \"${p}\"\n`;
              });
            }
            if (serviceDisks[name] && serviceDisks[name].length > 0) {
              yml += `    volumes:\n`;
              serviceDisks[name].forEach(vol => {
                yml += `      - ${vol}:/data/${vol}\n`;
              });
            }
            if (serviceNetworks[name] && serviceNetworks[name].length > 0) {
              yml += `    networks:\n`;
              serviceNetworks[name].forEach(net => {
                yml += `      - ${net}\n`;
              });
            }
            yml += '\n';
          } else {
            yml += `    image: ${serviceDef.image}\n`;
            yml += `    container_name: ${svcName}\n`;
            // Variables de entorno
            const envs = (svc.serviceConfigs && svc.serviceConfigs[serviceKey]?.env) || {};
            if (Object.keys(envs).length > 0) {
              yml += `    environment:\n`;
              Object.entries(envs).forEach(([k, v]) => {
                yml += `      - ${k}=${v}\n`;
              });
            }
            // Puertos
            const ports = (svc.serviceConfigs && svc.serviceConfigs[serviceKey]?.ports) || [];
            if (ports.length > 0) {
              yml += `    ports:\n`;
              ports.forEach(p => {
                if (p && p.trim()) yml += `      - \"${p}\"\n`;
              });
            }
            if (serviceDisks[name] && serviceDisks[name].length > 0) {
              yml += `    volumes:\n`;
              serviceDisks[name].forEach(vol => {
                yml += `      - ${vol}:/data/${vol}\n`;
              });
            }
            if (serviceNetworks[name] && serviceNetworks[name].length > 0) {
              yml += `    networks:\n`;
              serviceNetworks[name].forEach(net => {
                yml += `      - ${net}\n`;
              });
            }
            yml += '\n';
          }
        }
      } else {
        // Server sin servicio: imagen base
        yml += `  ${name}:\n`;
        yml += `    image: ${svc.os === 'windows' ? 'mcr.microsoft.com/windows/servercore:ltsc2019' : 'ubuntu:latest'}\n`;
        yml += `    container_name: ${name}\n`;
        if (serviceDisks[name] && serviceDisks[name].length > 0) {
          yml += `    volumes:\n`;
          serviceDisks[name].forEach(vol => {
            yml += `      - ${vol}:/data/${vol}\n`;
          });
        }
        if (serviceNetworks[name] && serviceNetworks[name].length > 0) {
          yml += `    networks:\n`;
          serviceNetworks[name].forEach(net => {
            yml += `      - ${net}\n`;
          });
        }
        yml += '\n';
      }
    } else if (svc.type === 'workstation') {
      yml += `  ${name}:\n`;
      yml += `    image: ${svc.os === 'windows' ? 'mcr.microsoft.com/windows/servercore:ltsc2019' : 'ubuntu:latest'}\n`;
      yml += `    container_name: ${name}\n`;
      if (serviceDisks[name] && serviceDisks[name].length > 0) {
        yml += `    volumes:\n`;
        serviceDisks[name].forEach(vol => {
          yml += `      - ${vol}:/data/${vol}\n`;
        });
      }
      if (serviceNetworks[name] && serviceNetworks[name].length > 0) {
        yml += `    networks:\n`;
        serviceNetworks[name].forEach(net => {
          yml += `      - ${net}\n`;
        });
      }
      yml += '\n';
    }
  });

  // Agregar Zookeeper si es necesario
  if (zookeeperAdded) {
    yml += `  zookeeper:\n`;
    yml += `    image: bitnami/zookeeper:latest\n`;
    yml += `    container_name: zookeeper\n`;
    yml += `    environment:\n`;
    yml += `      - ALLOW_ANONYMOUS_LOGIN=yes\n`;
    yml += `    ports:\n      - "2181:2181"\n`;
    if (zookeeperNetworks.length > 0) {
      yml += `    networks:\n`;
      zookeeperNetworks.forEach(net => {
        yml += `      - ${net}\n`;
      });
    }
    yml += '\n';
  }

  if (networkNames.length > 0) {
    yml += 'networks:\n';
    networkNames.forEach(net => {
      yml += `  ${net}:\n    driver: bridge\n`;
    });
  }
  // Volúmenes
  // Solo los volúmenes que se usan
  const allVolumes = Object.values(serviceDisks).flat();
  if (allVolumes.length > 0) {
    yml += 'volumes:\n';
    [...new Set(allVolumes)].forEach(vol => {
      yml += `  ${vol}:\n`;
    });
  }
  return yml;
}

function downloadYML(nodes, links) {
  const yml = generateDockerCompose(nodes, links);
  const blob = new Blob([yml], { type: 'text/yaml;charset=utf-8' });
  saveAs(blob, 'docker-compose.yml');
}

async function downloadDockerfiles(nodes) {
  const zip = new JSZip();
  nodes.filter(n => n.type === 'server' && n.services && appServices.includes(n.services)).forEach((node, i) => {
    const name = node.name || `${node.type}${i+1}`;
    const serviceKey = node.services;
    const folder = `${name}-${serviceKey}`;
    zip.file(`${folder}/Dockerfile`, generateDockerfile(node));
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'dockerfiles.zip');
}

// Nueva función para exportar todo en un zip
async function downloadAll(nodes, links) {
  const zip = new JSZip();
  // docker-compose.yml
  const yml = generateDockerCompose(nodes, links);
  zip.file('docker-compose.yml', yml);
  // Dockerfiles solo para apps
  nodes.filter(n => n.type === 'server' && n.services && appServices.includes(n.services)).forEach((node, i) => {
    const name = node.name || `${node.type}${i+1}`;
    const serviceKey = node.services;
    const folder = `${name}-${serviceKey}`;
    zip.file(`${folder}/Dockerfile`, generateDockerfile(node));
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'ecosistema.zip');
}

// Función simple para resaltar YAML
function highlightYAML(yml) {
  if (!yml) return '';
  // Palabras clave (version, services, networks, volumes, image, container_name, environment, ports, volumes, networks)
  let html = yml.replace(/^(\s*)([a-zA-Z0-9_\-]+):/gm, (m, p1, p2) => `${p1}<span class='yaml-key'>${p2}</span>:`);
  // Strings entre comillas
  html = html.replace(/"([^"]*)"/g, '<span class="yaml-string">"$1"</span>');
  // Números
  html = html.replace(/(\b\d+\b)/g, '<span class="yaml-number">$1</span>');
  return html;
}

const NetworkDiagram = () => {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [mode, setMode] = useState('node'); // 'node' or 'link'
  const [showNodeForm, setShowNodeForm] = useState(false);
  const [newNode, setNewNode] = useState({ x: 0, y: 0 });
  const [formData, setFormData] = useState({ type: '', os: '', name: '', services: '' });
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState(null); // {x, y, type, id, linkId}
  const [editNode, setEditNode] = useState(null); // nodo a editar
  const [editLink, setEditLink] = useState(null); // {from, to}
  const [formError, setFormError] = useState('');
  const [serviceConfigs, setServiceConfigs] = useState({});
  const [portError, setPortError] = useState('');
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [showCopyMsg, setShowCopyMsg] = useState(false);

  const dockerNamePattern = /^[a-z][a-z0-9-]{0,31}$/;

  // Actualizar configs al cambiar servicios
  useEffect(() => {
    if (formData.type === 'server') {
      const newConfigs = { ...serviceConfigs };
      (formData.services || []).forEach(svc => {
        if (!newConfigs[svc]) newConfigs[svc] = { ...defaultServiceConfig[svc] };
      });
      // Eliminar configs de servicios no seleccionados
      Object.keys(newConfigs).forEach(svc => {
        if (!(formData.services || []).includes(svc)) delete newConfigs[svc];
      });
      setServiceConfigs(newConfigs);
    }
    // eslint-disable-next-line
  }, [formData.services, formData.type]);

  // Cargar estado desde localStorage al montar
  useEffect(() => {
    const saved = localStorage.getItem(LOCALSTORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.nodes && parsed.links) {
          setNodes(parsed.nodes);
          setLinks(parsed.links);
          // Forzar render para asegurar que el diagrama se dibuje
          setTimeout(() => {
            setSelectedNode(null);
          }, 0);
        }
      } catch {}
    }
  }, []);

  // Guardar estado en localStorage al cambiar nodos o enlaces
  useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify({ nodes, links }));
  }, [nodes, links]);

  // Inicializar historial con el estado inicial
  useEffect(() => {
    setUndoStack([{ nodes, links }]);
    setRedoStack([]);
    // eslint-disable-next-line
  }, []);

  // Función para guardar en el historial solo en cambios reales
  const pushHistory = React.useCallback((newNodes, newLinks) => {
    setUndoStack(stack => [...stack, { nodes: newNodes, links: newLinks }]);
    setRedoStack([]);
  }, []);

  // Atajos de teclado para deshacer/rehacer
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z (deshacer)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (undoStack.length > 1) {
          const newUndo = [...undoStack];
          const last = newUndo.pop();
          setRedoStack(r => [last, ...r]);
          const prev = newUndo[newUndo.length - 1];
          setUndoStack(newUndo);
          setNodes(prev.nodes);
          setLinks(prev.links);
        }
      }
      // Ctrl+Y o Ctrl+Shift+Z (rehacer)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (redoStack.length > 0) {
          const [next, ...rest] = redoStack;
          setUndoStack(stack => [...stack, next]);
          setRedoStack(rest);
          setNodes(next.nodes);
          setLinks(next.links);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack]);

  const handleServiceEnvChange = (svc, key, value) => {
    setServiceConfigs(cfgs => ({
      ...cfgs,
      [svc]: {
        ...cfgs[svc],
        env: { ...cfgs[svc].env, [key]: value },
      },
    }));
  };
  const handleServicePortChange = (svc, idx, value) => {
    setServiceConfigs(cfgs => {
      const ports = [...(cfgs[svc].ports || [])];
      ports[idx] = value;
      return { ...cfgs, [svc]: { ...cfgs[svc], ports } };
    });
  };
  const handleAddPort = (svc) => {
    setServiceConfigs(cfgs => ({
      ...cfgs,
      [svc]: { ...cfgs[svc], ports: [...(cfgs[svc].ports || []), ''] },
    }));
  };
  const handleRemovePort = (svc, idx) => {
    setServiceConfigs(cfgs => {
      const ports = [...(cfgs[svc].ports || [])];
      ports.splice(idx, 1);
      return { ...cfgs, [svc]: { ...cfgs[svc], ports } };
    });
  };

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (mode === 'node') {
      const node = nodes.find(n => distance(n.x, n.y, x, y) < NODE_RADIUS);
      if (!node) {
        setNewNode({ x, y });
        setFormData({ type: '', os: '', name: '', services: '' });
        setShowNodeForm(true);
      }
    } else if (mode === 'link') {
      const node = nodes.find(n => distance(n.x, n.y, x, y) < NODE_RADIUS);
      if (node) {
        if (selectedNode && selectedNode.id !== node.id) {
          // Prevenir autoenlaces y duplicados
          const exists = links.some(l => (l.from === selectedNode.id && l.to === node.id) || (l.from === node.id && l.to === selectedNode.id));
          if (!exists) {
            setLinks(links => {
              const next = [...links, { from: selectedNode.id, to: node.id }];
              pushHistory(nodes, next);
              return next;
            });
          }
          setSelectedNode(null);
        } else if (!selectedNode || selectedNode.id !== node.id) {
          setSelectedNode(node);
        }
      } else {
        // Si se hace clic fuera de un nodo, limpiar selección
        setSelectedNode(null);
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, options } = e.target;
    let val = value;
    if (name === 'name') {
      val = val.replace(/[^a-z0-9-]/g, '');
      val = val.toLowerCase();
    }
    if (name === 'services') {
      val = Array.from(options).filter(o => o.selected).map(o => o.value);
    }
    setFormData(prev => ({ ...prev, [name]: val }));
    if (name === 'name') {
      if (!dockerNamePattern.test(val)) {
        setFormError('El nombre debe empezar con una letra, solo minúsculas, números o guiones, máximo 32 caracteres.');
      } else {
        setFormError('');
      }
    }
  };

  function isValidPortMapping(port) {
    // Formato: host:container, ambos números
    if (!port) return true;
    const parts = port.split(':');
    if (parts.length !== 2) return false;
    return parts.every(p => /^\d+$/.test(p));
  }

  const handleAddNode = (e) => {
    e.preventDefault();
    if (!dockerNamePattern.test(formData.name)) {
      setFormError('El nombre debe empezar con una letra, solo minúsculas, números o guiones, máximo 32 caracteres.');
      return;
    }
    // Validar nombre único
    const nameExists = nodes.some(n => n.name === formData.name && (!editNode || n.id !== editNode.id));
    if (!formData.name || formData.name.trim() === '') {
      setFormError('El nombre del nodo es obligatorio.');
      return;
    }
    if (nameExists) {
      setFormError('Ya existe un nodo con ese nombre. Usa un nombre único.');
      return;
    }
    // Validar puertos
    let serviceKey = formData.services;
    if (Array.isArray(serviceKey)) serviceKey = serviceKey[0] || '';
    if (formData.type === 'server' && serviceKey && serviceConfigs[serviceKey]) {
      const ports = serviceConfigs[serviceKey].ports || [];
      for (const port of ports) {
        if (!isValidPortMapping(port)) {
          setPortError('Formato de puerto inválido. Usa host:container, solo números. Ejemplo: 3307:3306');
          return;
        }
      }
    }
    setPortError('');
    const id = editNode ? editNode.id : Date.now();
    setNodes(nodes => {
      let next;
      if (editNode) {
        next = nodes.map(n => n.id === id ? {
          ...n,
          type: formData.type,
          os: formData.type === 'server' || formData.type === 'workstation' ? formData.os : null,
          name: formData.name && formData.name.trim() !== '' ? formData.name.trim() : undefined,
          services: formData.type === 'server' ? (Array.isArray(formData.services) ? formData.services[0] : formData.services) : undefined,
          serviceConfigs: formData.type === 'server' ? { ...serviceConfigs } : undefined,
        } : n);
      } else {
        next = [
          ...nodes,
          {
            ...newNode,
            id,
            type: formData.type,
            os: formData.type === 'server' || formData.type === 'workstation' ? formData.os : null,
            name: formData.name && formData.name.trim() !== '' ? formData.name.trim() : undefined,
            services: formData.type === 'server' ? (Array.isArray(formData.services) ? formData.services[0] : formData.services) : undefined,
            serviceConfigs: formData.type === 'server' ? { ...serviceConfigs } : undefined,
          },
        ];
      }
      pushHistory(next, links);
      return next;
    });
    setShowNodeForm(false);
    setEditNode(null);
    setFormError('');
  };

  // Permitir arrastrar nodos en cualquier modo (node o link)
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    // Ajuste: calcular coordenadas relativas al tamaño real del canvas
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const node = nodes.find(n => distance(n.x, n.y, x, y) < NODE_RADIUS);
    if (node) {
      setDraggingNodeId(node.id);
      setDragOffset({ x: x - node.x, y: y - node.y });
    }
  };

  const handleMouseMove = (e) => {
    if (draggingNodeId !== null) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      setNodes(nodes => nodes.map(n => n.id === draggingNodeId ? { ...n, x: x - dragOffset.x, y: y - dragOffset.y } : n));
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  // Touch events para móviles
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.touches[0].clientX - rect.left) * scaleX;
    const y = (e.touches[0].clientY - rect.top) * scaleY;
    const node = nodes.find(n => distance(n.x, n.y, x, y) < NODE_RADIUS);
    if (node) {
      setDraggingNodeId(node.id);
      setDragOffset({ x: x - node.x, y: y - node.y });
    }
  };

  const handleTouchMove = (e) => {
    if (draggingNodeId !== null && e.touches.length === 1) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;
      const x = (e.touches[0].clientX - rect.left) * scaleX;
      const y = (e.touches[0].clientY - rect.top) * scaleY;
      setNodes(nodes => nodes.map(n => n.id === draggingNodeId ? { ...n, x: x - dragOffset.x, y: y - dragOffset.y } : n));
    }
  };

  const handleTouchEnd = () => {
    setDraggingNodeId(null);
  };

  const handleCanvasContextMenu = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Buscar nodo
    const node = nodes.find(n => distance(n.x, n.y, x, y) < NODE_RADIUS);
    if (node) {
      setContextMenu({ x: e.clientX, y: e.clientY, type: 'node', id: node.id });
      return;
    }
    // Buscar enlace
    let foundLink = null;
    links.forEach(link => {
      const from = nodes.find(n => n.id === link.from);
      const to = nodes.find(n => n.id === link.to);
      if (!from || !to) return;
      // distancia punto a segmento
      const A = { x: from.x, y: from.y };
      const B = { x: to.x, y: to.y };
      const P = { x, y };
      const AB = { x: B.x - A.x, y: B.y - A.y };
      const AP = { x: P.x - A.x, y: P.y - A.y };
      const ab2 = AB.x * AB.x + AB.y * AB.y;
      const ap_ab = AP.x * AB.x + AP.y * AB.y;
      let t = ab2 ? ap_ab / ab2 : 0;
      t = Math.max(0, Math.min(1, t));
      const closest = { x: A.x + AB.x * t, y: A.y + AB.y * t };
      if (distance(P.x, P.y, closest.x, closest.y) < 10) {
        foundLink = link;
      }
    });
    if (foundLink) {
      setContextMenu({ x: e.clientX, y: e.clientY, type: 'link', linkId: foundLink.from + '-' + foundLink.to });
      return;
    }
    setContextMenu(null);
  };

  const handleDeleteNode = (id) => {
    setNodes(nodes => {
      const next = nodes.filter(n => n.id !== id);
      pushHistory(next, links.filter(l => l.from !== id && l.to !== id));
      return next;
    });
    setLinks(links => links.filter(l => l.from !== id && l.to !== id));
    setContextMenu(null);
  };

  const handleEditNode = (id) => {
    const node = nodes.find(n => n.id === id);
    if (node) {
      setEditNode(node);
      setFormData({
        type: node.type || '',
        os: node.os || '',
        name: node.name || '',
        services: node.services || '',
      });
      setShowNodeForm(true);
    }
    setContextMenu(null);
  };

  const handleDeleteLink = (linkId) => {
    const [from, to] = linkId.split('-').map(Number);
    setLinks(links => {
      const next = links.filter(l => !(l.from === from && l.to === to) && !(l.from === to && l.to === from));
      pushHistory(nodes, next);
      return next;
    });
    setContextMenu(null);
  };

  const handleEditLink = (linkId) => {
    const [from, to] = linkId.split('-').map(Number);
    setEditLink({ from, to });
    setContextMenu(null);
  };

  const handleLinkFormChange = (e) => {
    const { name, value } = e.target;
    setEditLink(link => ({ ...link, [name]: Number(value) }));
  };

  const handleSaveLink = (e) => {
    e.preventDefault();
    setLinks(links => links.map(l => (l.from === editLink.from && l.to === editLink.to) ? { from: editLink.from, to: editLink.to } : l));
    setEditLink(null);
  };

  const handleCloseForm = () => {
    setShowNodeForm(false);
    setEditNode(null);
  };

  const handleCloseLinkForm = () => {
    setEditLink(null);
  };

  React.useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Draw links
    links.forEach(link => {
      const from = nodes.find(n => n.id === link.from);
      const to = nodes.find(n => n.id === link.to);
      if (from && to) {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    // Draw nodes
    nodes.forEach(node => {
      ctx.save();
      // Feedback visual: nodo arrastrado
      let fillStyle, strokeStyle, lineWidth;
      if (draggingNodeId === node.id) {
        fillStyle = '#ffe066'; // amarillo claro
        strokeStyle = '#4f8cff'; // azul
        lineWidth = 4;
      } else if (selectedNode && selectedNode.id === node.id) {
        fillStyle = '#4f8cff';
        strokeStyle = '#333';
        lineWidth = 2;
      } else {
        fillStyle = '#fff';
        strokeStyle = '#333';
        lineWidth = 2;
      }
      ctx.fillStyle = fillStyle;
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      if (node.type === 'network') {
        // Rectángulo para red (más ancho)
        ctx.beginPath();
        ctx.rect(node.x - NODE_RADIUS*1.4, node.y - NODE_RADIUS/1.5, NODE_RADIUS*2.8, NODE_RADIUS*1.3);
        ctx.fill();
        ctx.stroke();
      } else if (node.type === 'disk') {
        // Cuadrado para disco
        ctx.beginPath();
        ctx.rect(node.x - NODE_RADIUS, node.y - NODE_RADIUS, NODE_RADIUS*2, NODE_RADIUS*2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Círculo para server/workstation
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    });
  }, [nodes, links, selectedNode, draggingNodeId]);

  const yml = generateDockerCompose(nodes, links);

  const handleCopyYML = useCallback(() => {
    navigator.clipboard.writeText(yml);
    setShowCopyMsg(true);
    setTimeout(() => setShowCopyMsg(false), 1200);
  }, [yml]);

  const handleExportJSON = () => {
    const data = JSON.stringify({ nodes, links }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    saveAs(blob, 'diagrama.json');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed.nodes && parsed.links) {
          setNodes(parsed.nodes);
          setLinks(parsed.links);
          localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify({ nodes: parsed.nodes, links: parsed.links }));
        } else {
          alert('Archivo inválido.');
        }
      } catch {
        alert('Archivo inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="network-diagram-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%' }}>
      <Toolbar
        mode={mode}
        setMode={setMode}
        nodes={nodes}
        downloadAll={downloadAll}
        handleExportJSON={handleExportJSON}
        handleImportJSON={handleImportJSON}
        setNodes={setNodes}
        setLinks={setLinks}
        setSelectedNode={setSelectedNode}
        LOCALSTORAGE_KEY={LOCALSTORAGE_KEY}
      />
      <canvas
        ref={canvasRef}
        width={1200}
        height={500}
        className="network-canvas"
        onClick={handleCanvasClick}
        style={{ display: 'block', maxWidth: '100%' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleCanvasContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      <NodeIcons nodes={nodes} draggingNodeId={draggingNodeId} selectedNode={selectedNode} />
      <YamlPanel yml={yml} highlightYAML={highlightYAML} handleCopyYML={handleCopyYML} showCopyMsg={showCopyMsg} />
      {showNodeForm && (
        <NodeForm
          editNode={editNode}
          formData={formData}
          formError={formError}
          portError={portError}
          nodeTypes={nodeTypes}
          osTypes={osTypes}
          serverServices={serverServices}
          serviceConfigs={serviceConfigs}
          handleFormChange={handleFormChange}
          handleServiceEnvChange={handleServiceEnvChange}
          handleServicePortChange={handleServicePortChange}
          handleAddPort={handleAddPort}
          handleRemovePort={handleRemovePort}
          handleAddNode={handleAddNode}
          handleCloseForm={handleCloseForm}
        />
      )}
      {editLink && (
        <LinkForm
          editLink={editLink}
          nodes={nodes}
          handleLinkFormChange={handleLinkFormChange}
          handleSaveLink={handleSaveLink}
          handleCloseLinkForm={handleCloseLinkForm}
        />
      )}
    </div>
  );
};

export default NetworkDiagram; 