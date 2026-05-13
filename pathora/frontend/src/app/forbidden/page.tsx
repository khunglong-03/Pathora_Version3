import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
      <section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
          403
        </p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">
          Không có quyền truy cập
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-500">
          Tài khoản hiện tại không có quyền mở khu vực này.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
        >
          Về trang chủ
        </Link>
      </section>
    </main>
  );
}
