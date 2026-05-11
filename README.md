# CourseHub — Developer Handoff

Nigeria's #1 study materials platform for university students.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Backend/DB | Supabase (Postgres + Auth + Storage) |
| Payments | Paystack (NGN transactions + seller payouts) |
| AI | Anthropic Claude API (AI Study Assistant) |
| Deployment | Vercel (frontend) |

---

## Project Structure

```
coursehub/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout + nav
│   ├── auth/page.tsx             # Login + signup (3-step)
│   ├── browse/page.tsx           # Browse + search + filters
│   ├── upload/page.tsx           # Upload materials (drag & drop)
│   ├── dashboard/page.tsx        # Seller dashboard + withdrawals
│   └── api/
│       ├── paystack/route.ts     # Payment init, verify, webhook, withdrawal
│       ├── study/route.ts        # AI Study Assistant (Claude API)
│       └── download/route.ts     # Secure signed download URLs
├── components/
│   └── Navigation.tsx
├── lib/
│   └── supabase.ts               # Client setup + TypeScript types + query helpers
└── sql/
    └── schema.sql                # Complete DB schema — paste into Supabase SQL Editor
```

---

## Setup — Step by Step

### 1. Supabase

1. Go to [supabase.com](https://supabase.com) → New Project
2. SQL Editor → paste entire `sql/schema.sql` → Run
3. Authentication → Providers → Enable Email + Google OAuth
4. Storage → two buckets will be created by the schema (`materials` private, `previews` public)
5. Project Settings → API → copy `Project URL` and `anon public` key

### 2. Paystack

1. Register at [paystack.com](https://paystack.com/signup)
2. Complete business verification (takes 1–3 days)
3. Settings → API Keys → copy Test secret key (use until you go live)
4. Settings → Webhooks → add: `https://your-domain.vercel.app/api/paystack` (PUT method)

### 3. Anthropic

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. API Keys → Create Key
3. Copy the key (starts with `sk-ant-`)

### 4. Local Development

```bash
# Clone repo
git clone https://github.com/YOUR_USERNAME/coursehub.git
cd coursehub

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your actual keys

# Run dev server
npm run dev
# Open http://localhost:3000
```

### 5. Deploy to Vercel

```bash
# Push to GitHub first
git add .
git commit -m "initial commit"
git push origin main
```

Then:
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Add ALL environment variables from `.env.example` (with real values)
4. Click Deploy
5. Update `NEXT_PUBLIC_APP_URL` in Vercel env vars to your Vercel URL
6. Update Paystack webhook URL to your Vercel URL

---

## Environment Variables

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `PAYSTACK_SECRET_KEY` | Paystack → Settings → API Keys |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack → Settings → API Keys |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (or localhost:3000 for dev) |

---

## Key Business Logic

### Revenue Split
- Platform takes **15%** of every sale
- Seller receives **85%**
- Implemented in `app/api/paystack/route.ts` and DB trigger `handle_purchase_success()`

### File Security
- All uploaded materials go into a **private** Supabase Storage bucket
- Signed URLs are generated on-demand (expire after 1 hour)
- Only verified purchasers can get a signed URL
- Logic in `app/api/download/route.ts`

### Material Review
- All uploads start with `status: 'pending'`
- Admin must approve before materials appear in browse
- Admin panel route: `/admin` (build separately or use Supabase dashboard for now)

### AI Study Assistant
- Only available for purchased materials
- Calls `claude-sonnet-4-20250514` with full material context in system prompt
- Supports 4 modes: chat, quiz (MCQ with answers), summary, exam tips
- API route: `app/api/study/route.ts`

---

## Test Cards (Paystack)

Use these in test mode:

| Card | Number |
|---|---|
| Success | 4084 0840 8408 4081 |
| Declined | 4084 0840 8408 4084 |

Expiry: any future date. CVV: any 3 digits. Pin: 0000.

---

## Going Live Checklist

- [ ] Paystack business verification approved
- [ ] Switch `PAYSTACK_SECRET_KEY` to live key in Vercel
- [ ] Update Paystack webhook URL to production domain
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Add custom domain in Vercel (SSL is automatic)
- [ ] Seed database with initial materials (20+ from target school)
- [ ] Test full purchase flow with real card
- [ ] Test withdrawal flow (requires Paystack balance)

---

## Estimated Timeline

| Task | Days |
|---|---|
| Account setup (Supabase, Vercel, Paystack registration) | Day 1 |
| Run schema, configure auth + storage | Day 2 |
| Scaffold Next.js, deploy skeleton to Vercel | Day 3 |
| Wire all pages to real Supabase/Paystack/Anthropic | Day 4 |
| Test, fix bugs, go live | Day 5 |

---

## Support

For questions about the codebase, ask Claude at claude.ai — this entire project was built there.
