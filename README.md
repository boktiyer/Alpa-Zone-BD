# Alpa Zone BD

E-commerce site for Bangladesh. Next.js 16 (App Router) + Tailwind CSS 4 + Supabase, deployed on Vercel.
Bangla + English. Brand: "Style Beyond Ordinary" — maroon / burgundy / champagne gold on warm ivory.

## First-time setup

### 1. Install and add your Supabase keys

```bash
npm install
```

Open `.env.local` and replace the two placeholder values
(Supabase Dashboard → Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx      # the "anon public" key also works
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Create the database

Supabase Dashboard → SQL Editor → New query. Paste and run, in this order:

1. `supabase/01_schema.sql` — tables, security rules, storage buckets
2. `supabase/02_seed.sql` — categories, 3 sample products, 2 banners, 1 coupon

Both are safe to run again.

### 3. Allow the login redirect

Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `http://localhost:3000`
- Redirect URLs: add `http://localhost:3000/**` (later also `https://your-domain/**`)

### 4. Run the site

```bash
npm run dev
```

Open http://localhost:3000

### 5. Make yourself admin

1. Sign up at http://localhost:3000/signup with `boktiyerhossen43085@gmail.com`
2. Open the confirmation link in the email
3. Run `supabase/03_make_admin.sql` in the SQL Editor (it must show `role = admin`)
4. Log in and open http://localhost:3000/admin

## Commands

| Command             | What it does                    |
| ------------------- | ------------------------------- |
| `npm run dev`       | Start the site for development  |
| `npm run build`     | Production build                |
| `npm run start`     | Run the production build        |
| `npm run typecheck` | Check TypeScript types          |

## Folder structure

```
supabase/
  01_schema.sql          tables, enums, functions, RLS policies, storage buckets
  02_seed.sql            starting categories, sample products, banners
  03_make_admin.sql      turns your account into an admin
public/
  brand/                 logo files
  seed/                  placeholder pictures used by the seed data
src/
  proxy.ts               middleware (Next.js 16 calls it "proxy"): session + /admin protection
  app/
    layout.tsx           root layout: fonts (Cormorant Garamond, DM Sans, Hind Siliguri), language, metadata
    globals.css          Tailwind 4 theme (brand colours and fonts live here)
    icon.png             favicon
    (store)/             CUSTOMER SITE
      layout.tsx           header + footer
      page.tsx             home: banners, categories, products
      category/[slug]/     category page (includes sub-categories)
      products/[slug]/     product page (size / colour / stock)
      login/  signup/      authentication
      account/             profile (login required)
    admin/               ADMIN PANEL (admin role required)
      layout.tsx           admin shell + role check
      page.tsx             dashboard
    auth/
      actions.ts           login, signup, logout, update profile
      callback/route.ts    email confirmation link
  components/            shared UI (store/ = customer site parts)
  i18n/                  Bangla / English: config, dictionaries, helpers
  lib/
    supabase/            client.ts (browser), server.ts (server), proxy.ts (middleware logic)
    auth.ts              current user + role
    queries.ts           all store data reads
    format.ts            price / number / date formatting
  types/database.ts      TypeScript types for every table
```

## How things work

- **Nothing is hardcoded.** Categories, products and banners are read from the database.
  Add a row (later: from the admin panel) and it shows up on the site.
- **Sub-categories:** a category whose `parent_id` points at another category.
- **Language:** stored in the `azbd_locale` cookie. UI text is in `src/i18n/dictionaries`;
  database content has `_bn` and `_en` columns.
- **Security:** Row Level Security is on for every table. Customers see only their own
  profile, cart, wishlist and orders; admins see everything; categories, products and
  banners are public. Customers cannot change their own role.
- **Orders** are created only through the `place_order()` database function, which
  calculates prices, discount and the delivery charge (Dhaka ৳60 / outside ৳120) itself
  and reduces stock, so a browser cannot send a fake total.
- **Theme:** edit the `--color-*` values at the top of `src/app/globals.css`.

## Deploy to Vercel

1. Push the project to GitHub and import it in Vercel.
2. Add the three variables from `.env.local` in Vercel → Settings → Environment Variables
   (set `NEXT_PUBLIC_SITE_URL` to the real domain).
3. Add `https://your-domain/**` to Supabase → Authentication → URL Configuration → Redirect URLs.
