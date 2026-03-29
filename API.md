# API Documentation

Complete reference for HEJ PAPA REST API endpoints.

**Base URL:** `http://localhost:3000/api` (development)

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

Tokens are obtained via login/register and expire after 30 days.

## Error Handling

All errors return JSON with an `error` field:

```json
{
  "error": "User-friendly error message"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Token expired
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists (e.g., email taken)
- `500 Internal Server Error` - Server error

## Auth Endpoints

### Register User

**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "conceptionDate": "2025-06-15",
  "partnerName": "Anna"
}
```

**Required Fields:**
- `email` - Valid email address
- `password` - Min 6 characters
- `conceptionDate` - YYYY-MM-DD format

**Optional Fields:**
- `partnerName` - Partner's name

**Response (201 Created):**
```json
{
  "message": "Konto utworzone pomyślnie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "conceptionDate": "2025-06-15",
    "partnerName": "Anna"
  }
}
```

**Error Responses:**
- `400` - Missing required fields
- `409` - Email already registered

---

### Login User

**POST** `/api/auth/login`

Authenticate and get JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "conceptionDate": "2025-06-15",
    "partnerName": "Anna"
  }
}
```

**Error Responses:**
- `400` - Missing email/password
- `401` - Invalid credentials

---

### Get Current User

**GET** `/api/auth/me`

Get authenticated user's profile.

**Required:** Bearer token

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "conceptionDate": "2025-06-15",
  "partnerName": "Anna",
  "createdAt": "2025-11-15T10:30:00Z"
}
```

**Error Responses:**
- `401` - No token provided
- `403` - Token expired
- `404` - User not found

---

### Update User Profile

**PUT** `/api/auth/me`

Update user information.

**Required:** Bearer token

**Request Body:**
```json
{
  "conceptionDate": "2025-06-20",
  "partnerName": "Anna Maria"
}
```

**Optional Fields:**
- `conceptionDate` - New conception date (YYYY-MM-DD)
- `partnerName` - Updated partner name

**Response (200 OK):**
```json
{
  "message": "Profil zaktualizowany"
}
```

**Error Responses:**
- `400` - No fields to update
- `401` - No token provided
- `403` - Token expired

---

## Pregnancy Week Endpoints

### Get Current Week

**GET** `/api/weeks/current`

Get the current pregnancy week based on user's conception date.

**Required:** Bearer token

**Response (200 OK):**
```json
{
  "weekNumber": 20,
  "fetal_development": "Fetus is about 25-26 cm long...",
  "partner_health": "Partner may experience backaches...",
  "partner_emotions": "Mixed feelings about impending parenthood...",
  "partner_tips": "Support partner by helping with household chores...",
  "dad_tips": "This is a good time to attend prenatal classes..."
}
```

---

### Get Specific Week

**GET** `/api/weeks/:weekNumber`

Get data for a specific pregnancy week (1-42).

**Parameters:**
- `weekNumber` - Week number (1-42)

**Response (200 OK):**
```json
{
  "weekNumber": 20,
  "fetal_development": "Fetus is about 25-26 cm long...",
  "partner_health": "Partner may experience backaches...",
  "partner_emotions": "Mixed feelings about impending parenthood...",
  "partner_tips": "Support partner by helping with household chores...",
  "dad_tips": "This is a good time to attend prenatal classes..."
}
```

**Error Responses:**
- `404` - Week not found (out of range)

---

### Get All Weeks

**GET** `/api/weeks/all`

Get all pregnancy weeks (40-42 weeks).

**Response (200 OK):**
```json
[
  {
    "weekNumber": 1,
    "fetal_development": "..."
  },
  {
    "weekNumber": 2,
    "fetal_development": "..."
  },
  ...
]
```

**Response:** Array of 40+ week objects

---

## Checkups Endpoints

### Get All Checkups

**GET** `/api/checkups`

Get all medical checkup information by trimester.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "trimester": 1,
    "weekRange": "8-12",
    "name": "Pierwsza wizyta u ginekologa",
    "what_to_expect": "Potwierdzenie ciąży, badania krwi...",
    "father_role": "Przychodzenie na wizyty wsparciem..."
  },
  ...
]
```

---

### Get Checkups by Trimester

**GET** `/api/checkups/trimester/:trimester`

Get checkups for specific trimester.

**Parameters:**
- `trimester` - 1, 2, 3, or 4

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "trimester": 1,
    "weekRange": "8-12",
    "name": "Pierwsza wizyta u ginekologa",
    "what_to_expect": "...",
    "father_role": "..."
  }
]
```

---

## Shopping Endpoints

### Get Shopping List

**GET** `/api/shopping`

Get complete shopping list with costs.

**Response (200 OK):**
```json
{
  "trimester": 2,
  "total_min_cost": 5000,
  "total_max_cost": 12000,
  "items": [
    {
      "id": "s2-1",
      "category": "Odzież ciążowa",
      "name": "Legginsy ciążowe",
      "minCost": 100,
      "maxCost": 360,
      "qty": "2-3 pary"
    }
  ]
}
```

---

### Get Shopping by Trimester

**GET** `/api/shopping/trimester/:trimester`

Get shopping items for specific trimester.

**Parameters:**
- `trimester` - 1, 2, 3, or 4

---

### Get Cost Calculator

**GET** `/api/shopping/calculator`

Get detailed cost breakdown by trimester.

**Response (200 OK):**
```json
{
  "trimesters": [
    {
      "title": "I Trymestr",
      "subtitle": "1-12 tydzień",
      "cost_min": 1500,
      "cost_max": 2500,
      "categories": [
        {
          "title": "Wizyty lekarskie",
          "items": [...]
        }
      ]
    }
  ],
  "total_min": 15000,
  "total_max": 25000
}
```

---

## Birth Preparation Endpoints

### Get Birth Preparation Guide

**GET** `/api/birth/preparation`

Get comprehensive birth preparation information.

**Response (200 OK):**
```json
{
  "preparation_stages": [
    {
      "stage": 1,
      "title": "Przedporodowe przygotowania psychiczne",
      "description": "...",
      "dad_role": "Partner wspiera emocjonalnie..."
    }
  ],
  "pain_management": "Various pain relief options...",
  "support_role": "What expectant father should do..."
}
```

---

### Get Hospital Bag Checklist

**GET** `/api/birth/bag-checklist`

Get hospital bag packing list.

**Response (200 OK):**
```json
{
  "mother_items": [
    "Nightgownów rozpinanych",
    "Zapachy osobiste",
    "Dokumenty",
    ...
  ],
  "baby_items": [
    "Ubranka w rozmiarze 50-62",
    "Pieluszki",
    ...
  ],
  "partner_items": [
    "Wygodna odzież",
    "Aparat fotograficzny",
    ...
  ]
}
```

---

## Fourth Trimester Endpoints

### Get Fourth Trimester Guide

**GET** `/api/fourth-trimester`

Get postpartum care guidance for first 12 weeks.

**Response (200 OK):**
```json
{
  "weeks": [
    {
      "week_after_birth": 1,
      "title": "Pierwszy tydzień",
      "description": "Noworodek adaptuje się...",
      "baby_development": "Nauką narządy zmysłów...",
      "relationship_tips": "Wspierajcie się nawzajem...",
      "warning_signs": "Zwracajcie uwagę na..."
    },
    ...
  ]
}
```

**Covers weeks 1-12 postpartum with:**
- Baby development milestones
- Relationship and intimacy guidance
- Warning signs requiring medical attention

---

## Health Check Endpoint

### Health Check

**GET** `/api/health`

Simple endpoint to verify API is running.

**Response (200 OK):**
```json
{
  "status": "ok",
  "app": "HEJ PAPA",
  "version": "1.0.0"
}
```

---

## Rate Limiting

Currently no rate limits, but recommended for production:

```
X-Rate-Limit-Limit: 100
X-Rate-Limit-Remaining: 99
X-Rate-Limit-Reset: 1234567890
```

---

## Request/Response Examples

### Example: Register and Login Flow

**1. Register**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dad@example.com",
    "password": "securePass123",
    "conceptionDate": "2025-06-15",
    "partnerName": "Anna"
  }'
```

**2. Get Token from Response**
```
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**3. Use Token for Protected Requests**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Common Integration Patterns

### Frontend Login

```typescript
// 1. Register/Login
const response = await fetch('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify({ email, password, conceptionDate, partnerName })
});
const { token } = await response.json();

// 2. Save token
localStorage.setItem('authToken', token);

// 3. Use in requests
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

// 4. Get protected data
const user = await fetch('/api/auth/me', { headers });
```

### Token Refresh

Tokens expire after 30 days. Implement re-login for expired tokens:

```typescript
if (response.status === 403) {
  // Token expired
  localStorage.removeItem('authToken');
  // Redirect to login
  navigation.navigate('Login');
}
```

---

## Troubleshooting API Calls

**401 Unauthorized**
- Token missing from Authorization header
- Token is invalid or expired
- Solution: Re-login

**403 Forbidden**
- Token expired (30 days)
- Solution: Re-login

**404 Not Found**
- Endpoint doesn't exist
- Week number out of range (1-42)
- Solution: Check URL and parameters

**500 Internal Server Error**
- Check server logs
- Verify database connection
- Check environment variables

---

## API Versioning

Current version: **1.0.0**

No versioning in URL yet. Future versions may use:
- `/api/v2/endpoint`
- Header: `Accept: application/vnd.hejpapa.v2`

---

**Last Updated:** March 2026
**Support:** Check [README.md](./README.md)
