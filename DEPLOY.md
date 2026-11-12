# Alpa Zone BD — Deploy ও Launch গাইড

এই file-এ আছে: database update, security checklist, GitHub, Vercel, Supabase সেটিং, domain, আর launch-এর আগের test।

---

## ০. Database update (সবার আগে)

Supabase → SQL Editor-এ এই file গুলো ক্রম অনুযায়ী run করা থাকতে হবে। সবগুলো আবার run করলেও ক্ষতি নেই।

| ক্রম | File | কাজ |
| --- | --- | --- |
| 1 | `supabase/01_schema.sql` | টেবিল, security নিয়ম, storage |
| 2 | `supabase/02_seed.sql` | নমুনা category, product, banner |
| 3 | `supabase/03_make_admin.sql` | আপনার account-কে admin বানায় |
| 4 | `supabase/04_step2_store.sql` | cart, checkout, order tracking |
| 5 | `supabase/05_step3_admin.sql` | **নতুন** — order বাতিল করলে stock ফেরত |

---

## ১. Security checklist

### যা পরীক্ষা করা হয়েছে (login ছাড়া একজন visitor হিসেবে, আসল database-এ)

- [x] `/admin`-এর সব page (১১টা) login page-এ পাঠিয়ে দেয়
- [x] category / product / coupon / order যোগ করা যায় না (401)
- [x] product-এর দাম বদলানো বা product মুছে ফেলা যায় না (০টা row বদলায়)
- [x] profiles, orders, order_items, coupons, cart, wishlist পড়া যায় না (খালি আসে)
- [x] storage-এ ছবি upload করা যায় না
- [x] `.env.local` git-এ যায়নি

### যা test database-এ পরীক্ষা করা হয়েছে

- [x] সাধারণ customer নিজেকে admin বানাতে পারে না
- [x] customer শুধু নিজের profile, cart, order দেখে; অন্যের দেখে না
- [x] customer সরাসরি order টেবিলে লিখতে পারে না — দাম database নিজে হিসাব করে
- [x] stock-এর বেশি cart-এ নেওয়া যায় না
- [x] order tracking-এ ভুল ফোন নম্বর দিলে কিছু দেখায় না

### Admin-এর তিন স্তরের তালা

1. `src/proxy.ts` — admin না হলে page খোলার আগেই ফেরত পাঠায়
2. `src/lib/admin.ts` → `requireAdmin()` — প্রতিটা admin page ও প্রতিটা save/delete-এর শুরুতে আবার role যাচাই
3. Database-এর Row Level Security — code-এ ভুল থাকলেও database data দেয় না

### Input validation

- সব admin form server-এ যাচাই হয় (`src/app/admin/actions.ts`): দাম/stock সংখ্যা কিনা, কুপনের % ১০০-এর বেশি না, link শুধু `/` বা `https://` দিয়ে শুরু
- ছবি: শুধু JPG/PNG/WebP, সর্বোচ্চ 5 MB
- মোবাইল নম্বর: `01XXXXXXXXX` format
- CSV export-এ formula injection আটকানো আছে

### আপনাকে যা করতে হবে

- [ ] Supabase → Authentication → Sign In / Providers → Email: **Confirm email চালু** রাখুন
- [ ] Supabase → Authentication → Policies-এ দেখুন প্রতিটা টেবিলে "RLS enabled" লেখা আছে
- [ ] Supabase-এর `service_role` / secret key কোথাও ব্যবহার করবেন না, কাউকে দেবেন না (এই project-এ লাগে না)
- [ ] Admin account-এর password শক্ত রাখুন
- [ ] Launch-এর আগে নমুনা product ও `WELCOME10` কুপন admin panel থেকে মুছে/বদলে নিন

---

## ২. GitHub-এ push

Code আগে থেকেই git-এ commit করা আছে। শুধু GitHub-এ পাঠাতে হবে।

1. https://github.com/new খুলুন
2. Repository name: `alpa-zone-bd`, **Private** বাছুন, আর কিছু tick দেবেন না → **Create repository**
3. VS Code-এর terminal-এ (project folder-এ) এই তিনটা command দিন — `YOUR-USERNAME`-এর জায়গায় আপনার GitHub username:

```bash
git remote add origin https://github.com/YOUR-USERNAME/alpa-zone-bd.git
git branch -M main
git push -u origin main
```

প্রথমবার GitHub login চাইবে — browser-এ login করে দিন।

পরে কোনো পরিবর্তন করলে:

```bash
git add -A
git commit -m "কী বদলেছেন লিখুন"
git push
```

---

## ৩. Vercel-এ deploy

1. https://vercel.com → **Continue with GitHub** দিয়ে login
2. **Add New… → Project** → `alpa-zone-bd` repository-র পাশে **Import**
3. Framework: **Next.js** (নিজে থেকেই ধরবে) — কিছু বদলাতে হবে না
4. **Environment Variables** অংশে এই তিনটা যোগ করুন:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ymajktmyqggtgcecmpfp.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | আপনার `.env.local`-এর key (`sb_publishable_...`) |
| `NEXT_PUBLIC_SITE_URL` | প্রথমে ফাঁকা রাখুন, deploy-এর পরে বসাবেন (নিচে দেখুন) |

5. **Deploy** চাপুন। ১–২ মিনিটে `https://alpa-zone-bd-xxxx.vercel.app`-এর মতো একটা link পাবেন।
6. সেই link copy করে Vercel → Project → **Settings → Environment Variables**-এ `NEXT_PUBLIC_SITE_URL`-এ বসান (শেষে `/` ছাড়া)।
7. **Deployments** → সবার উপরেরটার `⋯` → **Redeploy** চাপুন (নতুন মান কার্যকর করতে)।

এরপর যতবার `git push` করবেন, Vercel নিজে থেকে নতুন version deploy করবে।

---

## ৪. Supabase Auth redirect URL

এটা না করলে live site-এ signup-এর email link কাজ করবে না।

Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://আপনার-vercel-link.vercel.app`
- **Redirect URLs**-এ এগুলো যোগ করুন:
  - `https://আপনার-vercel-link.vercel.app/**`
  - `http://localhost:3000/**` (নিজের computer-এ কাজ করার জন্য রেখে দিন)

---

## ৫. পরে domain কিনে connect করা

1. যেকোনো জায়গা থেকে domain কিনুন (যেমন Namecheap, বা বাংলাদেশি কোনো registrar), ধরি `alpazonebd.com`
2. Vercel → Project → **Settings → Domains** → domain-এর নাম লিখে **Add**
3. Vercel দুইটা DNS record দেখাবে। Domain যেখান থেকে কিনেছেন সেখানকার **DNS settings**-এ ওই দুইটা হুবহু বসান। সাধারণত এরকম হয়, তবে Vercel যা দেখায় সেটাই বসাবেন:
   - `A` record: Name `@` → Vercel-এর দেওয়া IP
   - `CNAME` record: Name `www` → Vercel-এর দেওয়া ঠিকানা
4. কয়েক মিনিট থেকে কয়েক ঘণ্টা অপেক্ষা করুন। Vercel-এ domain-এর পাশে সবুজ ✓ এলে হয়ে গেছে; HTTPS নিজে থেকে চালু হয়।
5. তারপর **তিন জায়গায়** নতুন domain বসান:
   - Vercel → Environment Variables → `NEXT_PUBLIC_SITE_URL` = `https://alpazonebd.com` → **Redeploy**
   - Supabase → URL Configuration → **Site URL** = `https://alpazonebd.com`
   - Supabase → **Redirect URLs**-এ `https://alpazonebd.com/**` যোগ করুন

---

## ৬. Launch-এর আগে final test

Live link-এ (localhost না), সম্ভব হলে ফোন থেকে।

### Customer হিসেবে (নতুন একটা email দিয়ে)

- [ ] Home খোলে; banner, category, product দেখা যায়
- [ ] বাংলা ⇄ English বদলায়
- [ ] Search আর filter কাজ করে
- [ ] Signup → email-এর link → login হয়
- [ ] Product-এ সাইজ/রং বেছে কার্টে যোগ হয়; stock-এর বেশি নেওয়া যায় না
- [ ] কুপন কাজ করে
- [ ] COD অর্ডার: "এখন পাঠাতে হবে" শুধু ডেলিভারি চার্জ দেখায়; order নম্বর পাওয়া যায়
- [ ] বিকাশ অর্ডার: পুরো টাকা দেখায়
- [ ] Order tracking-এ নম্বর + ফোন দিয়ে status দেখা যায়
- [ ] My Orders-এ অর্ডার দেখা যায়
- [ ] WhatsApp button সঠিক নম্বরে খোলে
- [ ] এই customer account দিয়ে `/admin` খুললে home-এ ফেরত পাঠায়

### Admin হিসেবে

- [ ] Dashboard-এ আজকের বিক্রি ও chart-এ test অর্ডার দেখা যায়
- [ ] নতুন category যোগ → সাইটের menu-তে সাথে সাথে আসে
- [ ] নতুন product (ছবি, সাইজ/রং/stock, ছাড়ের দাম) যোগ → সাইটে দেখা যায়
- [ ] Order খুলে TrxID দেখে **Paid** করা যায়; status বদলালে customer-এর tracking-এ দেখা যায়
- [ ] Order বাতিল করলে stock ফেরত আসে
- [ ] Invoice print হয়
- [ ] Stock page থেকে stock বদলানো যায়
- [ ] নতুন banner upload → home-এ দেখা যায়; বন্ধ করলে চলে যায়
- [ ] Report-এ তারিখ বেছে CSV download হয়, Excel-এ বাংলা ঠিক দেখায়

### শেষ কাজ

- [ ] Test অর্ডারগুলো বাতিল করুন
- [ ] নমুনা product/banner-এর জায়গায় আসল ছবি ও তথ্য দিন
- [ ] `src/config/site.ts`-এ ফোন, WhatsApp, Facebook, Instagram ঠিক আছে কিনা দেখুন
