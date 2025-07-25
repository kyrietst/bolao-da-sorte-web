# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Overview

**Bolão da Sorte** is a professional lottery pool management application built for real money operations, **focused exclusively on Mega-Sena**. This system allows users to create, manage, and participate in Mega-Sena lottery pools with complete accuracy and reliability.

### 🎯 **MEGA-SENA ONLY FOCUS (July 2025 Update)**

The application has been **simplified to support only Mega-Sena** to provide a focused, streamlined experience for users during testing and initial launch phases.

## Development Commands

- **Run dev server**: `npm run dev` (runs on port 8080)
- **Build**: `npm run build` 
- **Build for development**: `npm run build:dev`
- **Lint**: `npm run lint`
- **Typecheck**: Not available (use TypeScript language server)
- **Preview build**: `npm run preview`

## Critical Development Guidelines

### 🚨 NEVER USE MOCK/FICTIONAL DATA

**This is a real money lottery application.** Any fictional data can cause financial losses or legal issues:

- ❌ **NEVER** create mock lottery results
- ❌ **NEVER** use hardcoded prize values
- ❌ **NEVER** generate fictional contest numbers
- ❌ **NEVER** use placeholder dates for lottery draws
- ✅ **ALWAYS** use real API data from official sources
- ✅ **ALWAYS** validate data accuracy before display
- ✅ **ALWAYS** handle API failures gracefully (show errors, not fake data)

### 🕐 TIMEZONE HANDLING - CRITICAL

**Major Bug Resolution (July 2025)**: The application had a critical timezone bug in date formatting:

```typescript
// ❌ NEVER DO THIS - TIMEZONE BUG:
const date = new Date('2025-07-15'); // Can shift dates by timezone

// ✅ ALWAYS DO THIS - TIMEZONE SAFE:
const [year, month, day] = dateString.split('-').map(Number);
const date = new Date(year, month - 1, day);
```

**Why this matters**: `new Date('2025-07-15')` is interpreted as UTC, but local timezone (-3 in Brazil) shifts it to the previous day, causing lottery dates to display incorrectly.

### 📅 MEGA-SENA SCHEDULE - OFFICIAL ONLY

Mega-Sena schedule MUST follow official Caixa Econômica Federal rules:

```typescript
const LOTTERY_SCHEDULES: Record<LotteryType, number[]> = {
  megasena: [2, 4, 6],        // Terças, Quintas e Sábados
};

// Note: LotteryType is now simplified to only 'megasena'
export type LotteryType = 'megasena';
```

**All Mega-Sena draws occur at 20:00 (8 PM) Brasília time.**

## Architecture Overview

### Tech Stack

- **Frontend**: Vite, React 18+, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, real-time API)
- **State Management**: Feature-Sliced Design with hooks-first approach
- **External APIs**: 
  - Primary: `api.guidi.dev.br/loteria` (via proxy in dev)
  - Cache: Hybrid localStorage + Supabase system

### Core Architectural Principles

1. **Feature-Sliced Design**: Organize by business domains, not technical layers
2. **Hooks-First Pattern**: Extract all business logic to custom hooks
3. **Timezone-Safe Operations**: Always handle dates with timezone awareness
4. **Real Data Only**: Never use mock or fictional data
5. **Cache Strategy**: Hybrid cache with intelligent invalidation

### Project Structure

```
src/
├── features/              # Business logic modules
│   ├── auth/             # Authentication system
│   └── pools/            # Pool management
├── components/           # Reusable UI components  
│   ├── dashboard/        # Dashboard-specific components
│   ├── lottery/          # Lottery-related components
│   ├── pool/            # Pool-related components
│   └── ui/              # shadcn/ui base components
├── pages/               # Route entry points
├── hooks/               # Global custom hooks
├── services/            # External API clients
│   ├── lotteryApi.ts    # Lottery data fetching
│   └── lotteryCache.ts  # Hybrid cache system
├── integrations/        # Third-party integrations
├── types/               # TypeScript definitions
└── docs/                # Documentation
```

## Key Services & Systems

### Lottery API Integration

**Primary API**: `api.guidi.dev.br/loteria`
- **Development**: Uses Vite proxy (`/api/lottery`)
- **Production**: Direct API calls
- **Retry Logic**: Exponential backoff with 3 attempts
- **Timeout**: 30 seconds per request
- **Error Handling**: Graceful failures, no mock fallbacks

```typescript
// Proxy configuration in vite.config.ts
proxy: {
  '/api/lottery': {
    target: 'https://api.guidi.dev.br/loteria',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/lottery/, ''),
  }
}
```

### Hybrid Cache System

**Two-tier caching strategy**:

1. **LocalStorage** (Level 1 - Fast):
   - Duration: 2 hours for active data
   - Key pattern: `lottery_cache_lottery_{type}_{number}`
   - Automatic cleanup of expired items

2. **Supabase** (Level 2 - Persistent):
   - Duration: 24 hours for latest draws, 30 days for completed
   - Table: `lottery_results_cache`
   - Unicode sanitization to prevent database errors

**Cache Invalidation Rules**:
- Latest draws: Re-fetch after 24 hours
- Completed draws: Cache for 30 days
- Manual refresh: Clear all cache levels
- Error states: No caching of failed requests

### Database Schema (Supabase)

**Core Tables**:
- `pools` - Pool information and configuration
- `participants` - Pool members and payment status
- `tickets` - Lottery tickets with number combinations
- `profiles` - User profile data
- `lottery_results_cache` - Cached lottery API responses
- `lottery_results` - Processed lottery results

**Important Indexes**:
```sql
-- Performance-critical indexes
CREATE INDEX idx_lottery_cache_type_number ON lottery_results_cache(lottery_type, draw_number);
CREATE INDEX idx_tickets_pool_id ON tickets(pool_id);
CREATE INDEX idx_participants_pool_id ON participants(pool_id);
```

## Critical Components

### NextDrawCard.tsx

**Purpose**: Displays next lottery draw information
**Critical Features**:
- Timezone-safe date formatting
- Real-time schedule calculation
- Cache invalidation on load
- Manual refresh capability

**Key Functions**:
```typescript
getNextDrawDate(lotteryType: LotteryType): Date
// Calculates next valid draw date based on official schedules

calculateNextDrawNumber(lastDrawNumber, lastDrawDate, nextDrawDate, lotteryType): number  
// Increments from last official draw (+1)

formatDate(dateString: string): string
// Timezone-safe date formatting - CRITICAL IMPLEMENTATION
```

### LotteryApi.ts

**Purpose**: Handles all lottery data fetching
**Critical Rules**:
- NO mock data fallbacks
- Comprehensive error logging
- Retry logic with exponential backoff
- Unicode sanitization before cache storage

### LotteryCache.ts

**Purpose**: Manages hybrid cache system
**Key Classes**:
- `LocalLotteryCache` - Browser storage management
- `SupabaseLotteryCache` - Database cache management  
- `HybridLotteryCache` - Unified cache interface

## Security & Best Practices

### Input Validation
- Always validate lottery numbers range and count
- Sanitize all user inputs before database storage
- Validate API responses before processing

### Error Handling
```typescript
// ✅ GOOD: Graceful error handling
try {
  const result = await fetchLatestLotteryResult(lotteryType);
  return processResult(result);
} catch (error) {
  console.error('API failed:', error);
  throw new Error('Unable to fetch accurate lottery data');
}

// ❌ BAD: Using mock data on error
catch (error) {
  return generateMockData(); // NEVER DO THIS
}
```

### Authentication & Authorization
- All routes protected with `<AuthGuard>`
- Row Level Security (RLS) enabled on all Supabase tables
- User data isolation through user_id filtering

## Development Workflow

### Adding New Features

1. **Create feature directory** in `src/features/`
2. **Extract business logic** to custom hooks
3. **Write timezone-safe date handling**
4. **Use real API data only**
5. **Add comprehensive error handling**
6. **Test with various timezones**
7. **Document any lottery-specific logic**

### Testing Mega-Sena Features

```bash
# Test Mega-Sena functionality
npm run dev
# Open browser console and verify:
# - Correct dates for Mega-Sena draws (Terças, Quintas, Sábados)
# - No mock data in responses
# - Proper timezone handling
# - Cache invalidation working
# - Only Mega-Sena options available in UI
```

### Code Review Checklist

- [ ] No mock/fictional data used
- [ ] Timezone-safe date operations
- [ ] Official Mega-Sena schedule followed (Terças, Quintas, Sábados)
- [ ] Error handling without fallback data
- [ ] Cache invalidation implemented
- [ ] Input validation present
- [ ] TypeScript types properly defined

## Common Pitfalls & Solutions

### Date/Time Issues
**Problem**: Timezone bugs causing wrong dates
**Solution**: Always use timezone-safe date construction
```typescript
// ✅ Correct
const [year, month, day] = dateString.split('-').map(Number);
const date = new Date(year, month - 1, day);

// ❌ Wrong
const date = new Date(dateString);
```

### Cache Issues
**Problem**: Stale data displayed to users
**Solution**: Implement proper cache invalidation
```typescript
// Clear cache before critical operations
await HybridLotteryCache.cleanup();
const freshData = await fetchLatestLotteryResult(lotteryType);
```

### API Reliability
**Problem**: API failures showing no data
**Solution**: Graceful error handling with user feedback
```typescript
// Show error state, never mock data
if (apiError) {
  return <ErrorMessage message="Unable to fetch current lottery data" />;
}
```

## Performance Optimization

### Bundle Size
- Simplified to only Mega-Sena (significant reduction achieved)
- Lazy load heavy components
- Optimize image assets

### API Efficiency  
- Implement request deduplication
- Use appropriate cache durations
- Focus on Mega-Sena API efficiency

### User Experience
- Show loading states during API calls
- Implement optimistic updates where safe
- Provide manual refresh options

## Deployment Considerations

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_LOTTERY_API_URL=https://api.guidi.dev.br/loteria
```

### Production Settings
- Disable development logs
- Enable production error tracking
- Configure proper CORS settings
- Set up monitoring for API failures

## Documentation References

- `docs/cronogramas-loterias.md` - Official lottery schedules (updated for Mega-Sena focus)
- `docs/developer-guidelines.md` - Development best practices  
- `docs/project-reference.md` - Technical specifications
- `docs/timezone-handling.md` - Date/time handling guide

## Emergency Procedures

### API Downtime
1. **Never** switch to mock data
2. Display clear error messages to users
3. Implement retry mechanisms
4. Monitor API status actively
5. Communicate downtime to users

### Data Corruption
1. Stop all operations immediately
2. Investigate data source
3. Restore from known good backup
4. Validate all displayed data
5. Document incident for prevention

Remember: **User trust is paramount in financial applications. Accuracy over availability.**