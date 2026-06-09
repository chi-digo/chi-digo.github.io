import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: challenge } = await supabase
    .from('challenges')
    .select('id, challenger_id, score, total, category_breakdown')
    .eq('short_code', code)
    .single();

  if (!challenge) {
    return new Response('Not found', { status: 404 });
  }

  let name = 'Mtu wa Chidigo';
  if (challenge.challenger_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', challenge.challenger_id)
      .single();
    if (profile?.display_name) name = profile.display_name;
  }

  const categories: string[] = [];
  if (challenge.category_breakdown) {
    const cb = challenge.category_breakdown as Record<string, { total: number }>;
    if (cb.vocabulary?.total) categories.push(`${cb.vocabulary.total} msamiati`);
    if (cb.proverbs?.total) categories.push(`${cb.proverbs.total} misemo`);
    if (cb.riddles?.total) categories.push(`${cb.riddles.total} vitendawili`);
  }

  const image = new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F2EAD7',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#1F3A5F',
              letterSpacing: '0.05em',
              textTransform: 'uppercase' as const,
            }}
          >
            CHIDIGO
          </div>

          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#1F3A5F',
              color: '#F2EAD7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            {name[0]?.toUpperCase()}
          </div>

          <div style={{ fontSize: 24, color: '#0E1A2A', fontWeight: 500 }}>
            {name} akukualika kpwa Chidigo quiz!
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 72, fontWeight: 700, color: '#1F3A5F' }}>
              {challenge.score}
            </span>
            <span style={{ fontSize: 32, color: '#666' }}>
              /{challenge.total}
            </span>
          </div>

          <div style={{ fontSize: 20, color: '#666' }}>
            Unaweza kumshinda?
          </div>

          {categories.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {categories.map((cat) => (
                <div
                  key={cat}
                  style={{
                    fontSize: 14,
                    color: '#1F3A5F',
                    backgroundColor: 'rgba(31, 58, 95, 0.1)',
                    padding: '6px 12px',
                    borderRadius: 16,
                  }}
                >
                  {cat}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );

  image.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
  return image;
}
