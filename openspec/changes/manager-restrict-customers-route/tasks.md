# Tasks: Manager Restrict Customers Route

## 1. Middleware Implementation

- [x] 1.1 Add Manager route exception in `pathora/frontend/src/middleware.ts` — block Manager from `/dashboard/customers/*`

## 2. Unit Test

- [x] 2.1 Add unit test in `pathora/frontend/src/middleware/__tests__/middleware.test.ts` — verify Manager + `/dashboard/customers` routing decision logic

## 3. Verification

- [x] 3.1 Build frontend — `npm --prefix "pathora/frontend" run build` (pre-existing type errors in unrelated files block full build; middleware changes introduce zero new errors)
- [x] 3.2 Run unit tests — `npm --prefix "pathora/frontend" run test -- middleware/__tests__/middleware.test.ts` (37/37 pass)
- [ ] 3.3 Manual test: Login as Manager → navigate to `/dashboard/customers` → should redirect to `/dashboard`
- [ ] 3.4 Manual test: Login as Manager → navigate to `/dashboard/customers/abc` → should redirect to `/dashboard`
- [ ] 3.5 Manual test: Login as Manager → navigate to `/dashboard` → should show dashboard
- [ ] 3.6 Manual test: Login as Manager → navigate to other dashboard sub-pages → should work normally
