# Pathora Frontend

## Recommended Setup: Backend in Docker, Frontend Local

### 1) Start backend services in Docker (from `D:\DoAn`)

```bash
docker compose up -d redis minio api
```

### 2) Configure frontend API endpoint (in `pathora/frontend/.env.local`)

```bash
NEXT_PUBLIC_API_GATEWAY=http://localhost:8080
```

### 3) Run frontend locally (from `pathora/frontend`)

```bash
npm ci
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### 4) Quick checks

```bash
docker compose ps
```

- Backend should be `healthy` on port `8080`.
- Frontend should run locally on port `3001` (not in Docker).

## Image Host Allowlist

To optimize user avatars with `next/image`, configure allowed remote hosts:

```bash
NEXT_PUBLIC_REMOTE_IMAGE_HOSTS=cdn.example.com,images.example.org,https://localhost:5001
```

- Comma-separated list
- Supports plain host (`cdn.example.com`) or full URL (`https://cdn.example.com`)
- Non-allowlisted avatar URLs automatically fall back to standard `<img>`

## Seeded Backend Data (Admin Pages)

Admin pages should use backend API data as the primary source (not local hardcoded data).

- Admin overview endpoint: `GET /api/admin/overview`
- Frontend service wrapper: `src/services/adminService.ts`
- Integration guide: `../docs/seed-data-integration.md`

For local verification against seeded backend data, follow the checklist in `../docs/seed-data-integration.md`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
