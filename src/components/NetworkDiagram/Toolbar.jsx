import React from 'react';

const Toolbar = ({
  mode,
  setMode,
  nodes,
  links,
  downloadAll,
  handleExportJSON,
  handleImportJSON,
  setNodes,
  setLinks,
  setSelectedNode,
  LOCALSTORAGE_KEY
}) => (
  <div className="toolbar">
    <button onClick={() => setMode('node')} className={`btn-primary${mode === 'node' ? ' active' : ''}`}>Agregar Nodo</button>
    <button onClick={() => setMode('link')} className={`btn-blue${mode === 'link' ? ' active' : ''}`} disabled={nodes.length < 2}>Agregar Enlace</button>
    <button onClick={() => { setNodes([]); setLinks([]); setSelectedNode(null); localStorage.removeItem(LOCALSTORAGE_KEY); }} className="btn-blue">Limpiar</button>
    <button onClick={() => downloadAll(nodes, links)} className="btn-blue" disabled={nodes.length === 0}>Exportar ecosistema (YML + Dockerfiles)</button>
    <button onClick={handleExportJSON} className="btn-blue" disabled={nodes.length === 0}>Exportar diagrama (JSON)</button>
    <label style={{ background: '#e0e7ef', color: '#222', borderRadius: 5, padding: '0.5rem 1.2rem', cursor: 'pointer', marginLeft: 8 }}>
      Importar diagrama (JSON)
      <input type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportJSON} />
    </label>
  </div>
);

export default Toolbar; 