import React from 'react';

const LinkForm = ({
  editLink,
  nodes,
  handleLinkFormChange,
  handleSaveLink,
  handleCloseLinkForm
}) => (
  <div className="modal-overlay animated-modal">
    <form className="node-form modern-form" onSubmit={handleSaveLink} autoComplete="off">
      <h3 style={{marginBottom: 8, fontWeight: 700, fontSize: '1.2em'}}>Editar Enlace</h3>
      <div className="form-grid">
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
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary">Guardar</button>
        <button type="button" className="btn-secondary" onClick={handleCloseLinkForm}>Cancelar</button>
      </div>
    </form>
  </div>
);

export default LinkForm; 