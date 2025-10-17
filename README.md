# 🐳 Diagramador Docker con Tooltips Educativos

## Descripción

Herramienta web interactiva para **aprender Docker mientras diseñas arquitecturas**. La característica principal son los **tooltips interactivos** en la previsualización del YAML que explican cada concepto Docker al pasar el mouse, manteniendo el código limpio y profesional.

### ✨ Características Principales

- 🎯 **Tooltips Interactivos**: Pasa el mouse sobre palabras clave del YAML para ver explicaciones instantáneas con enlaces a documentación oficial
- 📝 **Código Limpio**: Genera docker-compose.yml y Dockerfiles profesionales sin comentarios que saturen el código
- 🎨 **Diseño Visual Interactivo**: Arrastra y conecta nodos (contenedores, redes, volúmenes) en un canvas
- 📚 **Aprende Haciendo**: Los tooltips aparecen justo cuando los necesitas, facilitando el aprendizaje autodidacta
- 🔄 **Historial de Cambios**: Deshacer/Rehacer con Ctrl+Z y Ctrl+Y
- 💾 **Persistencia Automática**: Los diagramas se guardan en LocalStorage
- 📦 **Exportación Completa**: Descarga docker-compose.yml + Dockerfiles en un solo ZIP

### 🛠️ Servicios Soportados

**Bases de Datos:**
- MySQL, PostgreSQL, Oracle, SQL Server, MongoDB

**Frameworks Backend:**
- Spring Boot (Java), Flask/Django (Python), Laravel (PHP), .NET Core

**Frameworks Frontend:**
- React, Angular, Vue.js

**Mensajería:**
- Apache Kafka (con Zookeeper automático)

## 🚀 Instalación y Uso

### Instrucciones para clonar y ejecutar la app en local

### 1. Clona el repositorio

```bash
git clone https://github.com/julioiud/iud-docker-network.git
cd front-docker
```

### 2. Instala las dependencias

Asegúrate de tener [Node.js](https://nodejs.org/) instalado (recomendado v16+).

```bash
npm install
```

### 3. Ejecuta la aplicación en modo desarrollo

```bash
npm run dev
```

Esto abrirá la app en tu navegador en [http://localhost:5173](http://localhost:5173) (o el puerto que indique la terminal).

---

## 🎓 ¿Cómo Funciona el Aprendizaje con Tooltips?

### 1. Diseña Visualmente
- Arrastra y conecta nodos en el canvas
- Cada nodo representa un contenedor Docker (servidor, base de datos, aplicación)
- Conecta nodos con redes (comunicación) y volúmenes (persistencia)

### 2. Explora con Tooltips Interactivos
En la previsualización del YAML, **pasa el mouse sobre las palabras subrayadas** para ver:

#### Código Generado (Limpio y Profesional):
```yaml
version: "3.8"

services:
  mysql-db:
    image: mysql:8.0           # ← Pasa el mouse aquí para info
    container_name: mysql-db
    environment:               # ← Pasa el mouse aquí
      - MYSQL_ROOT_PASSWORD=root
      - MYSQL_DATABASE=test
    ports:                     # ← Pasa el mouse aquí
      - "3306:3306"
    volumes:                   # ← Pasa el mouse aquí
      - db-data:/var/lib/mysql
    networks:                  # ← Pasa el mouse aquí
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  db-data:
```

#### ¿Qué ves en los Tooltips?
Al pasar el mouse sobre palabras clave como `image`, `ports`, `volumes`, etc., aparece un tooltip con:
- **📘 Título**: Nombre del concepto
- **📝 Descripción**: Explicación clara y concisa
- **💡 Ejemplo**: Caso de uso práctico
- **🔗 Link**: Enlace a documentación oficial de Docker

### 3. Exporta Código Profesional
- El código exportado está **limpio**, sin comentarios que lo saturen
- Listo para usar en proyectos reales
- Mantén la previsualización abierta como **guía de aprendizaje**

### 💡 Guía Rápida

1. **Agregar Nodo**: Haz clic en "Agregar Nodo" → clic en el canvas → configura el servicio
2. **Conectar Nodos**: "Agregar Enlace" → clic en dos nodos para conectarlos
3. **Personalizar**: Clic derecho en un nodo para editar puertos y variables
4. **Exportar**: "Exportar ecosistema" descarga todo el código comentado
5. **Ejecutar**: Descomprime el ZIP y ejecuta `docker-compose up -d`

### 🎯 Ventajas del Enfoque con Tooltips

✅ **Código Limpio**: Sin comentarios que saturen, código profesional  
✅ **Aprendizaje Contextual**: La información aparece justo cuando la necesitas  
✅ **No Invasivo**: Exploras a tu ritmo, sin distracciones  
✅ **Enlaces Directos**: Acceso instantáneo a documentación oficial  
✅ **Mejor que Comentarios**: Mantiene el código legible y mantenible  
✅ **Reutilizable**: El código exportado está listo para producción

---

## 🌐 Demo en Vivo

[https://ubiquitous-lebkuchen-d2cac7.netlify.app/](https://ubiquitous-lebkuchen-d2cac7.netlify.app/)

## 📚 Herramientas Similares

- **Orca**: Visualizador de arquitecturas Docker
- **Docker Compose UI**: Interfaz gráfica para Docker Compose
- **Portainer**: Administración de contenedores Docker

---

**Autor:** Julio Martinez - IU Digital  
**Propósito:** Herramienta educativa para la enseñanza de Docker en entornos académicos

