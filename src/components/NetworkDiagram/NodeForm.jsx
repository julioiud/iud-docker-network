import React from 'react';

const NodeForm = ({
  editNode,
  formData,
  formError,
  portError,
  nodeTypes,
  osTypes,
  serverServices,
  serviceConfigs,
  handleFormChange,
  handleServiceEnvChange,
  handleServicePortChange,
  handleAddPort,
  handleRemovePort,
  handleAddNode,
  handleCloseForm
}) => (
  <div className="modal-overlay animated-modal">
    <form className="node-form modern-form" onSubmit={handleAddNode} autoComplete="off">
      <h3 style={{marginBottom: 8, fontWeight: 700, fontSize: '1.2em'}}> {editNode ? 'Editar Nodo' : 'Agregar Nodo'} </h3>
      <div className="form-grid">
        <label>
          <span className="form-label-icon">🏷️</span> Nombre:
          <input name="name" value={formData.name || ''} onChange={handleFormChange} maxLength={32} required placeholder="Nombre del nodo" className={formError ? 'input-error' : ''} />
          {formError && <div className="form-error">{formError}</div>}
        </label>
        <label>
          <span className="form-label-icon">🔗</span> Tipo:
          <select name="type" value={formData.type} onChange={handleFormChange} required>
            <option value="" disabled>Selecciona un tipo</option>
            {nodeTypes.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        {formData.type === 'workstation' && (
          <label>
            <span className="form-label-icon">💻</span> SO:
            <select name="os" value={formData.os} onChange={handleFormChange} required>
              <option value="" disabled>Selecciona un sistema operativo</option>
              {osTypes.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        )}
        {formData.type === 'server' && (
          <label>
            <span className="form-label-icon">⚙️</span> Servicio:
            <select name="services" value={formData.services} onChange={handleFormChange} required>
              <option value="" disabled>Selecciona un servicio</option>
              {serverServices.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      {portError && <div className="form-error">{portError}</div>}
      {formData.type === 'server' && formData.services && (
        <div className="service-config-box">
          <b>Configuración del servicio:</b>
          <div className="service-config-fields">
            {Object.entries(serviceConfigs[formData.services]?.env || {}).map(([key, val]) => (
              <label key={key} className="service-config-label">
                {key}:
                <input value={val} onChange={e => handleServiceEnvChange(formData.services, key, e.target.value)} />
              </label>
            ))}
            <div className="service-ports">
              <b>Puertos:</b>
              {(serviceConfigs[formData.services]?.ports || []).map((port, idx) => (
                <span key={idx} className="service-port-input">
                  <input value={port} onChange={e => handleServicePortChange(formData.services, idx, e.target.value)} />
                  <button type="button" onClick={() => handleRemovePort(formData.services, idx)}>-</button>
                </span>
              ))}
              <button type="button" className="add-port-btn" onClick={() => handleAddPort(formData.services)}>+ Añadir puerto</button>
            </div>
          </div>
        </div>
      )}
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={!!formError || !!portError}>{editNode ? 'Guardar' : 'Agregar'}</button>
        <button type="button" className="btn-secondary" onClick={handleCloseForm}>Cancelar</button>
      </div>
    </form>
  </div>
);

export default NodeForm; 