import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <h1 className="text-3xl font-bold text-stone-800">funcup</h1>
      <p className="mt-2 text-stone-600">Twój przewodnik po świecie kawy</p>
      <div className="mt-8 flex gap-4">
        <Link
          to="/scan"
          className="rounded-lg bg-amber-600 px-4 py-2 text-white"
        >
          Skanuj QR
        </Link>
        <Link
          to="/hub"
          className="rounded-lg bg-stone-200 px-4 py-2 text-stone-800"
        >
          Kawiarnia
        </Link>
        <Link
          to="/profile"
          className="rounded-lg bg-stone-200 px-4 py-2 text-stone-800"
        >
          Profil
        </Link>
      </div>
    </div>
  );
}
