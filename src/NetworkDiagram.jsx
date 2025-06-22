import React, { useRef, useState, useEffect } from 'react';
import { FaServer, FaDesktop, FaNetworkWired, FaHdd, FaLinux, FaWindows, FaDatabase } from 'react-icons/fa';
import { SiMysql, SiPostgresql, SiMongodb, SiOracle, SiApachekafka, SiSpring, SiFlask, SiDjango, SiLaravel, SiReact, SiAngular, SiVuedotjs, SiDotnet } from 'react-icons/si';
import './NetworkDiagram.css';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

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

const serviceIcons = {
  mysql: SiMysql,
  postgresql: SiPostgresql,
  oracle: SiOracle,
  sqlserver: FaDatabase,
  mongodb: SiMongodb,
  kafka: SiApachekafka,
  springboot: SiSpring,
  flask: SiFlask,
  django: SiDjango,
  laravel: SiLaravel,
  reactjs: SiReact,
  angular: SiAngular,
  vuejs: SiVuedotjs,
  dotnet: SiDotnet,
};

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

  // Construir YAML
  let yml = 'version: "3.8"\nservices:\n';
  services.forEach((svc, i) => {
    const name = serviceNames[i];
    // Si es server y tiene servicios, crear un contenedor por servicio
    if (svc.type === 'server' && typeof svc.services === 'string' && svc.services) {
      const serviceKey = svc.services;
      const serviceDef = serverServices.find(s => s.value === serviceKey);
      if (serviceDef) {
        const svcName = `${name}-${serviceKey}`;
        yml += `  ${svcName}:\n`;
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
    } else {
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

function generateDockerfile(node) {
  if (node.os === 'windows') {
    return `FROM mcr.microsoft.com/windows/servercore:ltsc2019\nCMD [\"powershell.exe\"]\n`;
  }
  // Linux por defecto
  return `FROM ubuntu:latest\nCMD [\"/bin/bash\"]\n`;
}

async function downloadDockerfiles(nodes) {
  const zip = new JSZip();
  nodes.filter(n => n.type === 'server' || n.type === 'workstation').forEach((node, i) => {
    const name = node.name || `${node.type}${i+1}`;
    zip.file(`${name}/Dockerfile`, generateDockerfile(node));
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
  // Dockerfiles
  nodes.filter(n => n.type === 'server' || n.type === 'workstation').forEach((node, i) => {
    const name = node.name || `${node.type}${i+1}`;
    zip.file(`${name}/Dockerfile`, generateDockerfile(node));
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'ecosistema.zip');
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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'node') {
      setNewNode({ x, y });
      setFormData({ type: '', os: '', name: '', services: '' });
      setShowNodeForm(true);
    } else if (mode === 'link') {
      const node = nodes.find(n => distance(n.x, n.y, x, y) < NODE_RADIUS);
      if (node) {
        if (selectedNode && selectedNode.id !== node.id) {
          setLinks([...links, { from: selectedNode.id, to: node.id }]);
          setSelectedNode(null);
        } else {
          setSelectedNode(node);
        }
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
    if (formData.type === 'server' && formData.services && serviceConfigs[formData.services]) {
      const ports = serviceConfigs[formData.services].ports || [];
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
      if (editNode) {
        return nodes.map(n => n.id === id ? {
          ...n,
          type: formData.type,
          os: formData.type === 'server' || formData.type === 'workstation' ? formData.os : null,
          name: formData.name && formData.name.trim() !== '' ? formData.name.trim() : undefined,
          services: formData.type === 'server' ? formData.services : undefined,
          serviceConfigs: formData.type === 'server' ? { ...serviceConfigs } : undefined,
        } : n);
      } else {
        return [
          ...nodes,
          {
            ...newNode,
            id,
            type: formData.type,
            os: formData.type === 'server' || formData.type === 'workstation' ? formData.os : null,
            name: formData.name && formData.name.trim() !== '' ? formData.name.trim() : undefined,
            services: formData.type === 'server' ? formData.services : undefined,
            serviceConfigs: formData.type === 'server' ? { ...serviceConfigs } : undefined,
          },
        ];
      }
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
    setNodes(nodes => nodes.filter(n => n.id !== id));
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
    setLinks(links => links.filter(l => !(l.from === from && l.to === to) && !(l.from === to && l.to === from)));
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

  // Render icons on top of canvas
  const renderIcons = () => (
    nodes.map(node => {
      let IconComponent;
      if (node.type === 'server') IconComponent = FaServer;
      else if (node.type === 'workstation') IconComponent = FaDesktop;
      else if (node.type === 'network') IconComponent = FaNetworkWired;
      else if (node.type === 'disk') IconComponent = FaHdd;
      // Icono de servicio si es server
      let ServiceIcon = null;
      if (node.type === 'server' && node.services && serviceIcons[node.services]) {
        ServiceIcon = serviceIcons[node.services];
      }
      return (
        <span
          key={node.id}
          style={{
            position: 'absolute',
            left: node.x - NODE_RADIUS,
            top: node.y - NODE_RADIUS,
            width: NODE_RADIUS * 2,
            height: NODE_RADIUS * 2,
            pointerEvents: 'none',
            color: node.type === 'network' ? '#4f8cff' : '#333',
            display: 'block',
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: 36, position: 'absolute', left: 0, top: 0, zIndex: 1 }}><IconComponent /></span>
          {(node.type === 'server' || node.type === 'workstation') && node.os === 'linux' && (
            <span className="node-icon-overlay os" style={{width: 16, height: 16}}><FaLinux style={{ fontSize: 14, color: '#198754', width: 16, height: 16 }} /></span>
          )}
          {(node.type === 'server' || node.type === 'workstation') && node.os === 'windows' && (
            <span className="node-icon-overlay os" style={{width: 16, height: 16}}><FaWindows style={{ fontSize: 14, color: '#0078d4', width: 16, height: 16 }} /></span>
          )}
          {ServiceIcon && (
            <span className="node-icon-overlay service" style={{width: 16, height: 16}}><ServiceIcon style={{ fontSize: 14, color: '#f5b700', width: 16, height: 16 }} /></span>
          )}
        </span>
      );
    })
  );

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
    <div className="network-diagram-container" style={{ position: 'relative' }}>
      <div className="toolbar">
        <button onClick={() => setMode('node')} className={mode === 'node' ? 'active' : ''}>Agregar Nodo</button>
        <button onClick={() => setMode('link')} className={mode === 'link' ? 'active' : ''}>Agregar Enlace</button>
        <button onClick={() => { setNodes([]); setLinks([]); setSelectedNode(null); localStorage.removeItem(LOCALSTORAGE_KEY); }}>Limpiar</button>
        <button onClick={() => downloadAll(nodes, links)} style={{ background: '#198754', color: '#fff' }}>Exportar ecosistema (YML + Dockerfiles)</button>
        <button onClick={handleExportJSON} style={{ background: '#4f8cff', color: '#fff' }}>Exportar diagrama (JSON)</button>
        <label style={{ background: '#e0e7ef', color: '#222', borderRadius: 5, padding: '0.5rem 1.2rem', cursor: 'pointer', marginLeft: 8 }}>
          Importar diagrama (JSON)
          <input type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportJSON} />
        </label>
      </div>
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
      {renderIcons()}
      {contextMenu && (
        <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: '#fff', border: '1px solid #ccc', zIndex: 2000, borderRadius: 6, boxShadow: '0 2px 8px #0002', minWidth: 120 }}>
          {contextMenu.type === 'node' && (
            <>
              <button style={{ width: '100%', padding: 8, border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => handleEditNode(contextMenu.id)}>Editar nodo</button>
              <button style={{ width: '100%', padding: 8, border: 'none', background: 'none', cursor: 'pointer', color: 'red' }} onClick={() => handleDeleteNode(contextMenu.id)}>Eliminar nodo</button>
            </>
          )}
          {contextMenu.type === 'link' && (
            <>
              <button style={{ width: '100%', padding: 8, border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => handleEditLink(contextMenu.linkId)}>Editar enlace</button>
              <button style={{ width: '100%', padding: 8, border: 'none', background: 'none', cursor: 'pointer', color: 'red' }} onClick={() => handleDeleteLink(contextMenu.linkId)}>Eliminar enlace</button>
            </>
          )}
        </div>
      )}
      {editLink && (
        <div className="modal-overlay">
          <form className="node-form" onSubmit={handleSaveLink}>
            <h3>Editar Enlace</h3>
            <label>Origen:
              <select name="from" value={editLink.from} onChange={handleLinkFormChange}>
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.name || n.type}</option>
                ))}
              </select>
            </label>
            <label>Destino:
              <select name="to" value={editLink.to} onChange={handleLinkFormChange}>
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.name || n.type}</option>
                ))}
              </select>
            </label>
            <div style={{ marginTop: 12 }}>
              <button type="submit">Guardar</button>
              <button type="button" onClick={handleCloseLinkForm} style={{ marginLeft: 8 }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
      {showNodeForm && (
        <div className="modal-overlay">
          <form className="node-form" onSubmit={handleAddNode}>
            <h3>{editNode ? 'Editar Nodo' : 'Agregar Nodo'}</h3>
            <label>Nombre:
              <input name="name" value={formData.name || ''} onChange={handleFormChange} maxLength={32} required placeholder="Nombre del nodo" autoComplete="off" />
            </label>
            {formError && <div style={{ color: 'red', fontSize: 14 }}>{formError}</div>}
            {portError && <div style={{ color: 'red', fontSize: 14 }}>{portError}</div>}
            <label>Tipo:
              <select name="type" value={formData.type} onChange={handleFormChange} required>
                <option value="" disabled>Selecciona un tipo</option>
                {nodeTypes.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
            {(formData.type === 'server' || formData.type === 'workstation') && (
              <label>Sistema Operativo:
                <select name="os" value={formData.os} onChange={handleFormChange} required>
                  <option value="" disabled>Selecciona un sistema operativo</option>
                  {osTypes.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
            )}
            {formData.type === 'server' && (
              <label>Servicios:
                <select name="services" value={formData.services} onChange={handleFormChange} required>
                  <option value="" disabled>Selecciona un servicio</option>
                  {serverServices.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
            )}
            {formData.type === 'server' && formData.services && (
              <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12, margin: '10px 0', background: '#f8fafc' }}>
                <b>Configuración del servicio:</b>
                <div style={{ marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #eee' }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{serverServices.find(s => s.value === formData.services)?.label || formData.services}</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {Object.entries(serviceConfigs[formData.services]?.env || {}).map(([key, val]) => (
                      <label key={key} style={{ fontSize: 13 }}>
                        {key}:
                        <input style={{ marginLeft: 4, width: 120 }} value={val} onChange={e => handleServiceEnvChange(formData.services, key, e.target.value)} />
                      </label>
                    ))}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <b>Puertos:</b>
                    {(serviceConfigs[formData.services]?.ports || []).map((port, idx) => (
                      <span key={idx} style={{ marginLeft: 6 }}>
                        <input style={{ width: 80 }} value={port} onChange={e => handleServicePortChange(formData.services, idx, e.target.value)} />
                        <button type="button" style={{ marginLeft: 2 }} onClick={() => handleRemovePort(formData.services, idx)}>-</button>
                      </span>
                    ))}
                    <button type="button" style={{ marginLeft: 8 }} onClick={() => handleAddPort(formData.services)}>+ Añadir puerto</button>
                  </div>
                </div>
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <button type="submit" disabled={!!formError || !!portError}>{editNode ? 'Guardar' : 'Agregar'}</button>
              <button type="button" onClick={handleCloseForm} style={{ marginLeft: 8 }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default NetworkDiagram; 