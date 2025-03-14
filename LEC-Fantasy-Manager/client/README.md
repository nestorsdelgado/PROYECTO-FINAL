# LEC Fantasy Manager

LEC Fantasy Manager es una aplicación web que permite a los usuarios crear y participar en ligas de fantasy basadas en la Liga Europea de League of Legends (LEC). Los usuarios pueden formar equipos con jugadores profesionales de la LEC, ganar puntos basados en el rendimiento real de los jugadores, y competir contra amigos en ligas personalizadas.

## Características Principales

- Creación y gestión de ligas personalizadas
- Sistema de compra/venta de jugadores
- Mercado de traspasos entre usuarios
- Seguimiento de puntuaciones y clasificación
- Gestión de alineaciones
- Histórico de transacciones

## Estructura del Proyecto

El proyecto está dividido en dos partes principales:

- `client`: Frontend desarrollado con React
- `server`: Backend desarrollado con Node.js, Express y MongoDB

---

## Cliente (Frontend)

### Tecnologías Utilizadas

- React 
- React Router para navegación
- Material UI para componentes de interfaz
- Axios para peticiones HTTP
- Context API para gestión de estado global

### Estructura de Directorios

```
client/
├── public/             # Archivos estáticos
├── src/
│   ├── components/     # Componentes React
│   ├── context/        # Proveedores de Context API
│   ├── data/           # Datos mock para desarrollo
│   ├── hooks/          # Custom hooks
│   ├── pages/          # Componentes de página
│   ├── services/       # Servicios para comunicación con API
│   ├── App.jsx         # Componente principal
│   ├── App.css         # Estilos generales
│   └── index.jsx       # Punto de entrada
```

### Componentes Principales

#### Páginas

- **MainContent**: Página principal que muestra las ligas del usuario
- **TeamPage**: Gestión del equipo y alineación
- **MarketPage**: Compra de jugadores
- **LeaderboardPage**: Clasificación y puntuaciones
- **InfoPage**: Estadísticas de jugadores
- **ActivityPage**: Historial de actividad y transacciones

#### Componentes Reutilizables

- **Navbar**: Barra de navegación superior
- **Sidebar**: Barra lateral de navegación
- **AuthModal**: Modal para login/registro
- **PlayerCard**: Tarjeta de jugador con información y acciones
- **PlayerStatsCard**: Tarjeta con estadísticas detalladas de jugador
- **ScoringExplainer**: Explicación del sistema de puntuación

### Contextos

- **AuthContext**: Maneja la autenticación de usuarios
- **LeagueContext**: Gestiona la liga seleccionada actualmente

### Servicios

- **auth.service.js**: Manejo de autenticación con JWT
- **leagues.service.js**: Gestión de ligas
- **players.service.js**: Operaciones con jugadores
- **teams.service.js**: Información de equipos
- **transactions.service.js**: Registro de transacciones
- **playerScoring.service.js**: Cálculo de puntuaciones

