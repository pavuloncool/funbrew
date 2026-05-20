import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { ScanQRResponse, FlavorNoteSummary, BrewMethod } from '@funcup/types';
import { useLocalStorageSync, createOfflineTasting } from '../hooks/useLocalStorageSync';
import { useScanHistory } from '../hooks/useScanHistory';

function StarRating({ rating, onChange, readonly = false }: { rating: number; onChange?: (r: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          className={`text-2xl ${star <= rating ? 'text-amber-400' : 'text-stone-300'} ${!readonly && 'hover:scale-110 transition-transform'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function FlavorNotePill({ note, selected, onClick }: { note: FlavorNoteSummary; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        selected 
          ? 'bg-amber-100 text-amber-800 border-2 border-amber-400' 
          : 'bg-stone-100 text-stone-600 border border-stone-200 hover:border-stone-300'
      }`}
    >
      {note.label}
    </button>
  );
}

function ProcessingMethodLabel({ method }: { method: string | null }) {
  const labels: Record<string, string> = {
    'washed': 'Wash',
    'natural': 'Natural',
    'honey': 'Honey',
    'anaerobic': 'Anaerobic',
    'wet-hulled': 'Wet Hulled',
    'other': 'Other',
  };
  return method ? <span className="text-stone-600">{labels[method] || method}</span> : null;
}

export default function CoffeePage() {
  const { id } = useParams();
  const [data, setData] = useState<ScanQRResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flavorNotes, setFlavorNotes] = useState<FlavorNoteSummary[]>([]);
  const [brewMethods, setBrewMethods] = useState<BrewMethod[]>([]);
  const [formData, setFormData] = useState({
    rating: 0,
    brewMethodId: '',
    brewTime: '',
    notes: '',
    review: '',
    selectedFlavors: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchCoffee() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan_qr`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ hash: id }),
          }
        );
        
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Failed to load coffee');
        }
        
        const result: ScanQRResponse = await response.json();
        setData(result);
        
        if (result.coffee && result.roaster) {
          addToHistory(id!, result.coffee.name, result.roaster.name);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    async function fetchMeta() {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const [flavorsRes, brewRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/tasting_notes?select=*&order=sort_order`, {
          headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
        }),
        fetch(`${supabaseUrl}/rest/v1/brew_methods?select=*&order=sort_order`, {
          headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
        }),
      ]);

      const flavorsData: FlavorNoteSummary[] = await flavorsRes.json();
      const brewData: BrewMethod[] = await brewRes.json();

      setFlavorNotes(flavorsData.map((f) => ({ ...f, count: 0 })));
      setBrewMethods(brewData);
    }

    fetchCoffee();
    fetchMeta();
  }, [id, addToHistory]);

  const { isOnline, addPendingTasting } = useLocalStorageSync();
  const { addToHistory } = useScanHistory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const token = localStorage.getItem('funcup_token');
    const batchId = data?.batch.id;

    if (!token) {
      alert('Please log in to log a tasting');
      setSubmitting(false);
      return;
    }

    if (!isOnline) {
      const offlineTasting = createOfflineTasting(
        batchId!,
        formData.rating,
        {
          brewMethodId: formData.brewMethodId || undefined,
          brewTimeSeconds: formData.brewTime ? parseInt(formData.brewTime) : undefined,
          tastingNoteIds: formData.selectedFlavors,
          freeTextNotes: formData.notes || undefined,
          review: formData.review || undefined,
        }
      );
      addPendingTasting(offlineTasting);
      setSubmitted(true);
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log-tasting`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            batch_id: batchId,
            rating: formData.rating,
            brew_method_id: formData.brewMethodId || undefined,
            brew_time_seconds: formData.brewTime ? parseInt(formData.brewTime) : undefined,
            tasting_note_ids: formData.selectedFlavors,
            free_text_notes: formData.notes || undefined,
            review: formData.review || undefined,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to log tasting');
      setSubmitted(true);
    } catch (err) {
      const offlineTasting = createOfflineTasting(
        batchId!,
        formData.rating,
        {
          brewMethodId: formData.brewMethodId || undefined,
          brewTimeSeconds: formData.brewTime ? parseInt(formData.brewTime) : undefined,
          tastingNoteIds: formData.selectedFlavors,
          freeTextNotes: formData.notes || undefined,
          review: formData.review || undefined,
        }
      );
      addPendingTasting(offlineTasting);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-pulse text-stone-500">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-stone-50 p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || 'Coffee not found'}
        </div>
        <Link to="/" className="mt-4 inline-block text-amber-600 hover:underline">
          ← Back to Home
        </Link>
      </div>
    );
  }

  const { batch, coffee, origin, roaster, stats, archived } = data;

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {archived && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-amber-800 text-center text-sm">
          This batch is no longer active
        </div>
      )}

      <div className="bg-gradient-to-b from-amber-100 to-stone-100 px-6 py-8">
        <h1 className="text-3xl font-bold text-stone-800">{coffee.name}</h1>
        <Link to={`/roaster/${roaster.id}`} className="text-amber-700 hover:underline mt-1 block">
          {roaster.name}
        </Link>
      </div>

      <div className="px-6 py-4 space-y-6">
        <section className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-stone-800 mb-3">Origin</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-stone-500">Country</span>
              <p className="font-medium">{origin.country}</p>
            </div>
            {origin.region && (
              <div>
                <span className="text-stone-500">Region</span>
                <p className="font-medium">{origin.region}</p>
              </div>
            )}
            {origin.farm && (
              <div>
                <span className="text-stone-500">Farm</span>
                <p className="font-medium">{origin.farm}</p>
              </div>
            )}
            {coffee.variety && (
              <div>
                <span className="text-stone-500">Variety</span>
                <p className="font-medium">{coffee.variety}</p>
              </div>
            )}
            {coffee.processing_method && (
              <div>
                <span className="text-stone-500">Process</span>
                <ProcessingMethodLabel method={coffee.processing_method} />
              </div>
            )}
            {origin.altitude_min && (
              <div>
                <span className="text-stone-500">Altitude</span>
                <p className="font-medium">
                  {origin.altitude_min}{origin.altitude_max ? `-${origin.altitude_max}` : ''}m
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-stone-800 mb-3">Batch Info</h2>
          <div className="text-sm text-stone-600">
            <p>Roast date: {new Date(batch.roast_date).toLocaleDateString()}</p>
            <p>Lot: {batch.lot_number}</p>
          </div>
          {batch.roaster_story && (
            <div className="mt-3 pt-3 border-t border-stone-100">
              <h3 className="font-medium text-stone-700 mb-1">Story</h3>
              <p className="text-sm text-stone-600">{batch.roaster_story}</p>
            </div>
          )}
          {batch.brewing_notes && (
            <div className="mt-3 pt-3 border-t border-stone-100">
              <h3 className="font-medium text-stone-700 mb-1">Brewing Notes</h3>
              <p className="text-sm text-stone-600">{batch.brewing_notes}</p>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-stone-800 mb-3">Community</h2>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">{stats.avg_rating.toFixed(1)}</p>
              <p className="text-xs text-stone-500">{stats.total_count} ratings</p>
            </div>
            <div className="flex-1">
              <div className="flex gap-1 h-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <div
                    key={r}
                    className="h-full bg-amber-200 rounded-full"
                    style={{ width: `${(stats.rating_distribution[String(r)] / Math.max(stats.total_count, 1)) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
          {stats.top_flavor_notes.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-stone-500 mb-2">Popular flavors</p>
              <div className="flex flex-wrap gap-1">
                {stats.top_flavor_notes.slice(0, 5).map((note) => (
                  <span key={note.id} className="px-2 py-0.5 bg-stone-100 text-stone-600 text-xs rounded-full">
                    {note.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {submitted ? (
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">✓</div>
            <h3 className="font-semibold text-amber-800">Tasting Logged!</h3>
            <p className="text-amber-700 text-sm mt-1">
              {!isOnline ? 'Saved offline. Will sync when online.' : 'Thank you for sharing your experience'}
            </p>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-stone-800">Log Your Tasting</h2>
              {!isOnline && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                  Offline
                </span>
              )}
            </div>
            
            <div>
              <label className="block text-sm text-stone-600 mb-2">Rating</label>
              <StarRating 
                rating={formData.rating} 
                onChange={(r) => setFormData(f => ({ ...f, rating: r }))} 
              />
            </div>

            <div>
              <label className="block text-sm text-stone-600 mb-2">Flavor Notes</label>
              <div className="flex flex-wrap gap-2">
                {flavorNotes.map((note) => (
                  <FlavorNotePill
                    key={note.id}
                    note={note}
                    selected={formData.selectedFlavors.includes(note.id)}
                    onClick={() => {
                      setFormData(f => ({
                        ...f,
                        selectedFlavors: f.selectedFlavors.includes(note.id)
                          ? f.selectedFlavors.filter(id => id !== note.id)
                          : [...f.selectedFlavors, note.id]
                      }));
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-stone-600 mb-2">Brew Method</label>
                <select
                  value={formData.brewMethodId}
                  onChange={e => setFormData(f => ({ ...f, brewMethodId: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-stone-700"
                >
                  <option value="">Select...</option>
                  {brewMethods.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-stone-600 mb-2">Brew Time (sec)</label>
                <input
                  type="number"
                  value={formData.brewTime}
                  onChange={e => setFormData(f => ({ ...f, brewTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-stone-700"
                  placeholder="e.g. 180"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-stone-600 mb-2">Notes (optional)</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-stone-700"
                rows={2}
                placeholder="Your thoughts..."
              />
            </div>

            <div>
              <label className="block text-sm text-stone-600 mb-2">Review (optional)</label>
              <textarea
                value={formData.review}
                onChange={e => setFormData(f => ({ ...f, review: e.target.value }))}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-stone-700"
                rows={3}
                placeholder="Share with the community..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting || formData.rating === 0}
              className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Log Tasting'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}