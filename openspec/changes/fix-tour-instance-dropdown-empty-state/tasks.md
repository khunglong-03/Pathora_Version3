## 1. Add i18n translation keys

- [x] 1.1 Add `tourInstance.noActiveTours` key to `pathora/frontend/src/i18n/locales/en/translation.json`
- [x] 1.2 Add `tourInstance.noActiveTours` key to `pathora/frontend/src/i18n/locales/vi/translation.json`

## 2. Implement empty state UI

- [x] 2.1 Add empty state conditional render in `SelectTourStep` component (`CreateTourInstancePage.tsx`) after the Package Tour `<select>` element — display italic text message when `tours.length === 0 && !loading && !loadError`
- [x] 2.2 Apply Tailwind classes `mt-2 text-sm text-stone-500 italic` to match existing error message styling

## 3. Verify

- [x] 3.1 Verify change by code review (syntax is correct, conditional renders properly when tours array is empty after successful load, no JS errors on page load)
