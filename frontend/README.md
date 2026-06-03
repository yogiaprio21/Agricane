# AgriCane Intelligence Platform - Frontend

Modern enterprise dashboard for sugarcane plantation management, featuring real-time IoT monitoring, interactive maps, weather analytics, satellite vegetation analysis, and AI-powered recommendations.

## 🚀 Features

### Implemented Pages

1. **Authentication**
   - Secure JWT-based login
   - Token refresh mechanism
   - Role-based route protection

2. **Dashboard**
   - Real-time KPI cards (Total Fields, Area, Health Status, Alerts)
   - Field health pie chart
   - Recent fields list with status badges
   - Weather summary integration

3. **Field Management**
   - Full CRUD operations for plantation fields
   - Interactive Leaflet map visualization
   - Field statistics and growth status tracking
   - Auto-calculated crop age
   - Responsive table with inline actions

4. **IoT Sensor Monitoring**
   - **Real-time WebSocket** live data streaming
   - Soil moisture, pH, and temperature monitoring
   - Threshold-based status indicators (Normal/Warning/Critical)
   - 24-hour trend charts
   - Live connection status

5. **Additional Pages** (Implementation structure provided below)
   - Environmental Monitoring (Weather charts & forecasts)
   - Satellite Monitoring (NDVI analysis & drone logs)
   - AI Recommendations (Irrigation, Harvest, Risk assessments)

### Technical Features

- **Modern UI**: Tailwind CSS for responsive, professional design
- **Real-time Updates**: Socket.IO WebSocket integration
- **Interactive Maps**: Leaflet for geospatial visualization
- **Charts & Analytics**: Recharts for data visualization
- **Type Safety**: Full TypeScript implementation
- **API Integration**: Axios with automatic token refresh
- **State Management**: React Context API for auth
- **Modular Architecture**: Component-based structure

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on http://localhost:3000

## 🛠️ Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WS_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
npm run dev
```

Application will be available at: **http://localhost:3001**

## 🔐 Login Credentials

Use these credentials from the backend seed data:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@agricane.com | admin123 |
| **Agronomist** | agronomist@agricane.com | admin123 |
| **Drone Operator** | drone@agricane.com | admin123 |
| **Manager** | manager@agricane.com | admin123 |

## 📁 Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   │   ├── index.tsx   # Button, Card, Input, Select, Badge, etc.
│   │   └── Layout.tsx  # Main layout with navigation
│   ├── dashboard/      # Dashboard-specific components
│   ├── fields/         # Field management components
│   ├── iot/            # IoT sensor components
│   └── ai/             # AI recommendation components
├── contexts/
│   └── AuthContext.tsx # Authentication state management
├── hooks/
│   └── useAuth.ts      # Custom auth hook
├── pages/
│   ├── Login.tsx       # Login page
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Fields.tsx      # Field management
│   └── IoTMonitoring.tsx # Real-time sensor monitoring
├── services/
│   ├── api.service.ts         # Axios configuration & interceptors
│   ├── auth.service.ts        # Authentication API calls
│   ├── field.service.ts       # Field CRUD operations
│   ├── environmental.service.ts # Weather data
│   ├── iot.service.ts         # Sensor data
│   ├── monitoring.service.ts  # NDVI & drone operations
│   ├── ai.service.ts          # AI recommendations
│   └── websocket.service.ts   # WebSocket connection
├── types/
│   └── index.ts        # TypeScript interfaces
├── App.tsx             # Main app component & routing
├── main.tsx            # App entry point
└── index.css           # Global styles & Tailwind
```

## 🌐 API Integration

### Authentication Flow

```typescript
// services/api.service.ts implements:
1. Request interceptor → Adds JWT token to headers
2. Response interceptor → Auto-refreshes expired tokens
3. Error handling → Redirects to login on auth failure
```

### WebSocket Real-time Updates

```typescript
// Example usage in IoT Monitoring:
const socket = websocketService.connect();
websocketService.subscribeToField(fieldId);

websocketService.onSensorUpdate((data) => {
  // Real-time sensor data updates
  setSensorData(prev => [data.reading, ...prev]);
});
```

## 📊 Key Components

### Common UI Components

**Available in `src/components/common/index.tsx`:**
- `<Button>` - Primary, Secondary, Danger variants
- `<Card>` - Content container with optional title
- `<Input>` - Form input with label
- `<Select>` - Dropdown selector
- `<Badge>` - Status indicators (Success, Warning, Danger, Info)
- `<Spinner>` - Loading indicator (sm, md, lg)
- `<Alert>` - Notification messages
- `<Modal>` - Overlay dialogs

### Layout Component

**`<Layout>`** - Main application layout with:
- Top navigation bar
- User profile display
- Role-based menu items
- Responsive mobile menu
- Logout functionality

### Protected Routes

```typescript
<Route path="/dashboard" element={
  <PrivateRoute>
    <Dashboard />
  </PrivateRoute>
} />
```

## 🎨 Styling

Built with **Tailwind CSS** for:
- Responsive design (mobile-first)
- Utility-first approach
- Custom primary color palette (green theme)
- Dark mode ready (easily extendable)

### Custom Colors

```css
primary-50 to primary-900 (Green palette)
```

## 📱 Responsive Design

- **Mobile**: Single column layouts, hamburger menu
- **Tablet**: 2-column grids, condensed navigation
- **Desktop**: Full features, multi-column layouts

## 🔄 State Management

### Auth Context

```typescript
const { user, isAuthenticated, login, logout } = useAuth();

// Usage:
await login(email, password);
await logout();
```

### Local State

- React `useState` for component-level state
- Service layer for API data fetching
- WebSocket for real-time updates

## 📈 Charts & Visualizations

### Recharts Components Used

- `<LineChart>` - Sensor trends, weather history
- `<BarChart>` - Field comparisons
- `<PieChart>` - Health status distribution

### Leaflet Maps

- Interactive field locations
- Marker popups with field info
- OpenStreetMap tiles
- Click-to-view field details

## 🧪 Testing (Optional Extension)

```bash
# Run tests
npm run test

# Coverage
npm run test:coverage
```

## 🏗️ Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

Build output: `dist/` directory

## 🚀 Deployment

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name agricane.example.com;
    root /var/www/agricane-frontend/dist;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
    }
}
```

### Environment Variables for Production

```env
VITE_API_BASE_URL=https://api.agricane.example.com/api/v1
VITE_WS_URL=https://api.agricane.example.com
```

## 🔧 Additional Pages Implementation

### Environmental Monitoring

Create `src/pages/Environmental.tsx`:
```typescript
// Features:
- Date range filter
- Temperature, rainfall, humidity charts
- Weather forecast display
- FAO agronomic reference integration
```

### Satellite Monitoring

Create `src/pages/SatelliteMonitoring.tsx`:
```typescript
// Features:
- NDVI history charts per field
- Field health heatmap
- Drone flight log CRUD table
- Copernicus satellite data display
```

### AI Recommendations

Create `src/pages/AIRecommendations.tsx`:
```typescript
// Features:
- Irrigation recommendation cards
- Harvest readiness assessment
- Climate & soil risk analysis
- Decision history timeline
- Confidence scores display
```

## 🐛 Troubleshooting

### CORS Errors
```bash
# Ensure backend CORS is configured for:
CORS_ORIGIN=http://localhost:3001
```

### Map Not Displaying
```bash
# Verify Leaflet CSS is imported in index.css
# Check that marker icons path is correct
```

### WebSocket Connection Failed
```bash
# Backend must be running on port 3000
# Check VITE_WS_URL in .env
# Verify /iot namespace exists on backend
```

### Token Refresh Loop
```bash
# Clear localStorage and re-login
localStorage.clear();
```

## 📦 Dependencies

### Core
- **react** ^18.2.0
- **react-router-dom** ^6.21.1
- **axios** ^1.6.5
- **socket.io-client** ^4.6.1

### UI & Visualization
- **recharts** ^2.10.3
- **leaflet** ^1.9.4
- **react-leaflet** ^4.2.1
- **lucide-react** ^0.303.0
- **tailwindcss** ^3.4.1

### Utilities
- **date-fns** ^3.2.0
- **typescript** ^5.3.3

## 🎯 Future Enhancements

- [ ] Add user profile management page
- [ ] Implement notification center
- [ ] Add data export functionality (CSV, PDF)
- [ ] Implement advanced filtering & search
- [ ] Add multi-language support (i18n)
- [ ] Implement dark mode toggle
- [ ] Add unit & integration tests
- [ ] PWA support for offline access
- [ ] Real-time collaboration features

## 📞 Support

For issues:
- Check browser console for errors
- Verify backend API is running
- Ensure all environment variables are set
- Review network tab for failed requests

## 📄 License

MIT License

---

**Built with React, TypeScript, Vite, and ❤️ for modern agriculture**