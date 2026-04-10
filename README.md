# DiscreetOpinions

An anonymous messaging web app — share your link, receive honest messages. Built with React, Express, Supabase, and Twilio.

---

## Setup Guide

### 1. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (pick any name/region, set a database password)
3. Once the project is ready, go to **SQL Editor** in the sidebar
4. Copy the contents of `schema.sql` from this project and paste it in, then click **Run**
5. Go to **Settings > API** and copy:
   - **Project URL** → this is your `SUPABASE_URL`
   - **service_role key** (under "Project API keys") → this is your `SUPABASE_SERVICE_ROLE_KEY`

### 2. Set up Twilio

1. Go to [twilio.com](https://www.twilio.com) and create a free trial account
2. Verify your phone number during signup
3. From the Twilio Console dashboard, copy:
   - **Account SID** → `TWILIO_ACCOUNT_SID`
   - **Auth Token** → `TWILIO_AUTH_TOKEN`
4. Go to **Phone Numbers > Manage > Buy a number** — get a number with SMS capability
5. Copy that number (e.g. `+1234567890`) → `TWILIO_PHONE_NUMBER`

> **Note:** On a free trial, Twilio can only send SMS to your verified phone number. That's fine for testing.

### 3. Create the `.env` file

In the project root, create a `.env` file:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

JWT_SECRET=pick-any-long-random-string-here

PORT=3001
CLIENT_URL=http://localhost:5173
```

For `JWT_SECRET`, generate a random string by running:

```bash
openssl rand -hex 32
```

### 4. Install dependencies

```bash
# Server
cd server
npm install

# Client (in a separate terminal)
cd client
npm install
```

### 5. Start the app

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

The app will be running at **http://localhost:5173** with the API on port 3001.

### 6. Test it

1. Open **http://localhost:5173**
2. Click **Get Started** → go to the **Sign Up** tab
3. Enter your name and phone number → you'll receive an OTP via SMS
4. Enter the OTP → you'll land on the Dashboard
5. Set a username (e.g. `john`) from the Dashboard
6. Copy your profile link and open it in an incognito window
7. Send yourself an anonymous message
8. Go back to the Dashboard to see it in your inbox

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| OTP / SMS | Twilio |
| Styling | Tailwind CSS |
| Auth | JWT (localStorage) |
| Theme | Dark + Light mode with toggle |

## Project Structure

```
discreetopinions/
├── schema.sql              # Database schema (run in Supabase SQL Editor)
├── .env.example            # Environment variable template
├── server/
│   ├── index.js            # Express entry point
│   ├── lib/
│   │   ├── supabase.js     # Supabase client
│   │   └── twilio.js       # Twilio OTP sender
│   ├── middleware/
│   │   └── auth.js         # JWT auth middleware
│   └── routes/
│       ├── auth.js         # send-otp, verify-otp
│       ├── user.js         # profile, username, toggle-public
│       └── messages.js     # send, inbox, public feed
├── client/
│   └── src/
│       ├── App.jsx         # Routes + providers
│       ├── lib/api.js      # API functions
│       ├── hooks/          # useAuth, useTheme
│       ├── components/     # Navbar, OtpFlow, MessageCard, etc.
│       └── pages/          # Landing, Login, Dashboard, Profile
```
