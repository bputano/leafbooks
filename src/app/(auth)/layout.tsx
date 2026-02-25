import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-8">
        <Link href="/" className="text-2xl font-bold text-leaf-700">
          LeafBooks
        </Link>
      </div>
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
        {children}
      </div>
    </div>
  );
}
