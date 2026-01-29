# Solidarity Net

A platform for tracking economic impact, worker organizing, and housing issues.

## Features

- **Impact Calculator**: Calculate personalized economic impact metrics based on productivity-wage gap
- **Exploitation Calculator**: Analyze corporate housing ownership and economic inequality
- **Worker Collectives**: Track and organize worker movements
- **Petitions**: Create and monitor Change.org petitions
- **Price Resistance**: Track boycotts and consumer resistance movements

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

```bash
npm install
```

### Configuration

The application can pull live data from government APIs instead of using local fallback data. To enable this, you need to set up API keys:

#### 1. BLS API Key (Bureau of Labor Statistics)

The BLS API provides access to CPI inflation data and wage statistics.

**How to register:**
1. Visit: https://www.bls.gov/developers/
2. Click on "Register" or "Sign Up"
3. Fill out the registration form with your email and organization
4. Check your email for confirmation
5. After confirming, log in and create a new API key

**Set the environment variable:**
```bash
export BLS_API_KEY="your-bls-api-key-here"
```

**API Features:**
- Free tier: 500 queries per day
- Returns up to 20 years of data
- Provides CPI inflation rates, wage data, and employment statistics

#### 2. HUD API Key (Housing and Urban Development)

The HUD API provides Fair Market Rent (FMR) data by ZIP code and state.

**How to register:**
1. Visit: https://www.huduser.gov/portal/dataset/fmr-api.html
2. Sign up for an account and select "Datasets API"
3. Check your email for confirmation
4. Log in and click "Create New Token"
5. Copy your API token

**Set the environment variable:**
```bash
export HUD_API_KEY="your-hud-api-key-here"
```

**API Features:**
- Free access to Fair Market Rent data
- Data by ZIP code, county, MSA, or state
- Includes 0-4 bedroom rent estimates

### Running the Application

```bash
# Start the server
npm start

# Or with API keys
BLS_API_KEY="your-key" HUD_API_KEY="your-key" npm start
```

The application will be available at http://localhost:3000

### Data Sources

The application uses data from multiple sources:

**Live APIs (when configured):**
- **BLS (Bureau of Labor Statistics)**: CPI inflation data
- **HUD (Housing and Urban Development)**: Fair Market Rent data

**Local Fallback Data:**
- Economic Policy Institute: Productivity-wage gap data (1975-2024)
- Bureau of Labor Statistics: Wage data by MSA and state
- Census Bureau: Housing cost trends
- Federal Reserve: Economic indicators

### API Endpoints

#### Economic Data
- `GET /api/economic-data/cpi?startYear=1975&endYear=2024` - CPI inflation data from BLS API
- `GET /api/economic-data/yearly?startYear=1975&endYear=2024` - Yearly economic data (local)

#### Rent Data
- `GET /api/rent-data/hud/:zipCode` - HUD Fair Market Rent data by ZIP code
- `GET /api/rent-data/hud/state/:stateCode` - HUD state-wide FMR data

#### Calculators
- `POST /api/impact-calculator` - Calculate economic impact metrics
- `POST /api/exploitation-calculator` - Calculate exploitation metrics

#### Organizing
- `GET /api/petitions` - List all petitions
- `POST /api/petitions` - Create a new petition
- `GET /api/worker-collectives` - List all worker collectives
- `POST /api/worker-collectives` - Create a new worker collective

## Development

### Database

The application uses SQLite with better-sqlite3. The database is automatically initialized on first run with seed data.

```bash
# Reinitialize database with seed data
npm run seed
```

### Caching

Government API responses are cached for 24 hours to reduce API calls and improve performance. The cache is stored in memory and cleared on server restart.

### Fallback Behavior

If API keys are not configured or API requests fail:
- The application automatically falls back to local data
- The response includes a `source` field indicating whether data came from the API or local fallback
- All functionality continues to work with local data

## Contributing

When adding new data sources:
1. Add the API integration function in server.js
2. Implement caching with appropriate TTL
3. Add fallback to local data
4. Update the API endpoints section in this README
5. Document the data source in the calculator responses

## License

ISC
