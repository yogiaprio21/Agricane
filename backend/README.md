# AgriCane Intelligence Platform - Backend

Enterprise-scale sugarcane plantation management system with real-time IoT monitoring, satellite vegetation analysis, AI-powered decision support, and integration with open environmental APIs.

## 🚀 Features

### Core Modules
- **Authentication & Authorization**: JWT-based auth with access/refresh tokens and RBAC
- **User Management**: Full CRUD with role-based permissions
- **Field Management**: Plantation block tracking with auto-calculated crop age
- **Environmental Data**: OpenWeatherMap integration for real-time weather & forecasts
- **Agronomy Reference**: FAO agronomic data for AI decision context
- **IoT Sensors**: Real-time soil monitoring via WebSocket with anomaly detection
- **Satellite Monitoring**: Copernicus Sentinel NDVI vegetation analysis
- **Drone Operations**: Flight log management and field monitoring
- **AI Decision Support**: Rule-based irrigation, harvest readiness, and risk assessment
- **Notifications**: System alerts with priority-based routing

### Technical Highlights
- Clean architecture (Controller → Service → Repository)
- Real-time WebSocket gateway for IoT data streaming
- Scheduled cron jobs for automated data collection
- Comprehensive Swagger API documentation
- Global exception handling & validation
- Production-ready Docker containerization

## 📋 Prerequisites

- Node.js 20+ 
- PostgreSQL 16+
- npm or yarn
- OpenWeatherMap API key (free tier available)
- Copernicus account (optional for satellite data)

## 🛠️ Installation

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd agricane-backend
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required environment variables:**
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
OPENWEATHER_API_KEY=your-openweathermap-api-key
```

Never commit real `.env` files or production credentials. If a key or password
has ever been committed, rotate it before deploying.

**Get your OpenWeatherMap API key:**
1. Visit https://openweathermap.org/api
2. Sign up for free account
3. Generate API key (free tier: 1000 calls/day)

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run development migrations
npm run prisma:migrate:dev

# Seed complete demo data
npm run prisma:seed
```

For a clean local development database, use:

```bash
npm run prisma:reset:dev
```

`prisma:reset:dev` drops local data and reruns migrations and seeders. Do not run it
against Neon production. For Neon, Render, or any deployed database, apply pending
migrations with:

```bash
npm run prisma:migrate:deploy
```

Use a pooled Neon URL for `DATABASE_URL` and a direct Neon URL for `DIRECT_URL`.
Prisma CLI commands require `DIRECT_URL` when `directUrl` is configured in
`prisma/schema.prisma`.

### 4. Start Development Server

```bash
npm run start:dev
```

The API will be available at:
- **API**: http://localhost:3000/api/v1
- **Swagger Docs**: http://localhost:3000/api/docs
- **WebSocket**: ws://localhost:3000/iot

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Manual Docker Build

```bash
# Build image
docker build -t agricane-backend .

# Run container
docker run -p 3000:3000 --env-file .env agricane-backend
```

## 📚 API Documentation

Once running, access interactive API documentation at:
**http://localhost:3000/api/docs**

### Test Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@agricane.com | admin123 |
| Agronomist | agronomist@agricane.com | admin123 |
| Drone Operator | drone@agricane.com | admin123 |
| Manager | manager@agricane.com | admin123 |
| Viewer Demo | viewer@agricane.com | admin123 |

## 🔐 Authentication Flow

1. **Register/Login** → Get access token + refresh token
2. **Include token** in requests: `Authorization: Bearer <access_token>`
3. **Token expires** → Use refresh token endpoint
4. **Logout** → Invalidates refresh token

```bash
# Login example
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@agricane.com","password":"admin123"}'
```

## 🌐 External API Integrations

### OpenWeatherMap
- **Current weather**: Temperature, humidity, rainfall
- **Forecast**: 5-day/3-hour predictions
- **Rate limit**: 1000 calls/day (free tier)
- **Caching**: 10 minutes per location

### FAO Open Data
- Agronomic reference data for sugarcane
- Irrigation requirements & crop coefficients
- Soil pH & nutrient guidelines
- Pest management strategies

### Copernicus Sentinel Hub
- NDVI vegetation index (simulated in current version)
- Satellite imagery analysis
- Field health classification
- Cloud cover assessment

## 🔌 WebSocket Real-time Features

Connect to IoT gateway at `ws://localhost:3000/iot`:

```javascript
const socket = io('http://localhost:3000/iot');

// Subscribe to field updates
socket.emit('subscribe_field', { fieldId: 'field-uuid' });

// Receive real-time sensor data
socket.on('sensor_update', (data) => {
  console.log('New reading:', data.reading);
});

// Anomaly alerts
socket.on('sensor_anomaly', (data) => {
  console.log('Alert:', data.anomaly);
});
```

## 📊 Key Endpoints

### Fields
- `GET /api/v1/fields` - List all fields
- `POST /api/v1/fields` - Create new field
- `GET /api/v1/fields/:id` - Field details with related data

### Environmental
- `POST /api/v1/environmental/fetch/:fieldId` - Fetch current weather
- `GET /api/v1/environmental/forecast/:fieldId` - Get 5-day forecast
- `GET /api/v1/environmental/stats/:fieldId` - Weather statistics

### IoT Sensors
- `POST /api/v1/iot/readings` - Create sensor reading
- `GET /api/v1/iot/readings/:fieldId/latest` - Latest readings
- `GET /api/v1/iot/readings/:fieldId/anomalies` - Detect anomalies

### AI Decisions
- `POST /api/v1/ai-decision/irrigation/:fieldId` - Irrigation recommendation
- `POST /api/v1/ai-decision/harvest/:fieldId` - Harvest readiness
- `POST /api/v1/ai-decision/risk-assessment/:fieldId` - Risk analysis

### Monitoring
- `POST /api/v1/monitoring/ndvi/fetch/:fieldId` - Fetch NDVI data
- `GET /api/v1/monitoring/health/summary` - All fields health
- `POST /api/v1/monitoring/drone/flights` - Log drone flight

## 🤖 AI Decision Logic

### Irrigation Recommendations
Factors analyzed:
- Current soil moisture level
- Temperature & evapotranspiration
- Recent rainfall
- Crop age & growth stage
- FAO crop coefficient (1.05 for sugarcane)

Decision categories:
- `IMMEDIATE_IRRIGATION_REQUIRED` (moisture < 35%)
- `SCHEDULE_IRRIGATION_24H` (moisture 35-50%)
- `MAINTAIN_CURRENT_SCHEDULE` (moisture 50-75%)
- `REDUCE_IRRIGATION` (moisture > 75%)

### Harvest Readiness
Factors analyzed:
- Crop age (optimal: 350-420 days)
- NDVI vegetation index
- Growth status
- Historical weather patterns

Decision categories:
- `TOO_EARLY` (< 300 days)
- `MONITOR_CLOSELY` (300-350 days)
- `READY_FOR_HARVEST` (350-420 days)
- `OVERDUE_HARVEST` (> 420 days)

### Risk Assessment
Monitors:
- Heat stress (temp > 35°C)
- Excess rainfall (> 100mm)
- Soil pH imbalance (< 5.5 or > 8.0)
- Severe vegetation stress (NDVI < 0.4)

## 🔄 Scheduled Jobs

### Weather Update Cron
**Schedule**: Every 6 hours  
**Function**: Fetches current weather for all fields from OpenWeatherMap

### IoT Anomaly Check (Optional)
**Schedule**: Every 5 minutes  
**Function**: Scans recent sensor readings for threshold violations

## 🏗️ Project Structure

```
src/
├── auth/               # JWT authentication & RBAC
│   ├── guards/        # JWT & Roles guards
│   ├── strategies/    # Passport strategies
│   └── decorators/    # Custom decorators
├── users/             # User management
├── fields/            # Field CRUD & lifecycle
├── environmental/     # OpenWeatherMap integration
├── agronomy/          # FAO reference data
├── iot/               # Sensor data & WebSocket
├── monitoring/        # NDVI & drone operations
├── ai-decision/       # AI recommendation engine
├── notifications/     # Alert system
├── common/            # Shared utilities
├── config/            # Configuration
└── prisma/            # Database layer
```

## 🗄️ Database Schema

Key tables:
- `users` - Authentication & roles
- `fields` - Plantation blocks
- `weather_data` - Environmental history
- `sensor_readings` - IoT time-series data
- `ndvi_data` - Satellite vegetation indices
- `drone_flights` - Flight logs
- `ai_decisions` - Recommendation history
- `fao_references` - Agronomic guidelines
- `notifications` - System alerts

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📈 Performance Tips

1. **Weather API caching**: Responses cached for 10 minutes
2. **Database indexing**: On frequently queried fields (timestamp, fieldId)
3. **Pagination**: Limit results (default: 20-50 items)
4. **Connection pooling**: Prisma manages database connections
5. **WebSocket throttling**: Rate-limit sensor data broadcasts

## 🔒 Security Best Practices

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens with short expiration (15 minutes)
- ✅ Refresh token rotation on use
- ✅ CORS configured for specific origins
- ✅ Input validation with class-validator
- ✅ SQL injection protected (Prisma ORM)
- ✅ Rate limiting on external APIs
- ✅ Environment secrets not committed

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify DATABASE_URL in .env
echo $DATABASE_URL

# Reset database
npx prisma migrate reset
```

### OpenWeatherMap API Errors
- Verify API key is active
- Check quota (1000 calls/day free tier)
- Ensure coordinates are valid

### WebSocket Connection Failed
- Verify port 3000 is not blocked
- Check CORS origin configuration
- Test with Socket.IO client library

## 📞 Support & Contact

For issues and questions:
- Open GitHub issue
- Check API docs at `/api/docs`
- Review logs: `docker-compose logs -f`

## 📄 License

MIT License - See LICENSE file for details

---

**Built with NestJS, Prisma, PostgreSQL, and ❤️ for sustainable agriculture**
