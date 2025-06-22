import React from 'react';

const YamlPanel = ({ yml, highlightYAML, handleCopyYML, showCopyMsg }) => (
  <div className="yml-panel">
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <b style={{ fontSize: '1.08em', color: '#243F59' }}>docker-compose.yml generado</b>
      <button className="btn-blue" style={{ fontSize: '0.97em', padding: '0.3rem 1.1rem' }} onClick={handleCopyYML}>Copiar</button>
    </div>
    <pre className="yml-pre" dangerouslySetInnerHTML={{ __html: highlightYAML(yml) }} />
    {showCopyMsg && <div style={{ color: '#198754', marginTop: 6, fontWeight: 500 }}>¡Copiado!</div>}
  </div>
);

export default YamlPanel; 