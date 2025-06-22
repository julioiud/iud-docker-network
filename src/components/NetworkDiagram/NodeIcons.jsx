import React from 'react';
import { FaServer, FaDesktop, FaNetworkWired, FaHdd, FaLinux, FaWindows } from 'react-icons/fa';
import { serviceIcons } from './serviceIcons';

const NODE_RADIUS = 24;

const NodeIcons = ({ nodes, draggingNodeId, selectedNode }) => (
  <>
    {nodes.map(node => {
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
    })}
  </>
);

export default NodeIcons; 