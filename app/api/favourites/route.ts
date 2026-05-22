import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('favourites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { entry_type, entry_id, entry_label, entry_gloss } = body;

  if (!entry_type || !entry_id || !entry_label) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (entry_type !== 'word' && entry_type !== 'proverb') {
    return NextResponse.json({ error: 'Invalid entry_type' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('favourites')
    .insert({
      user_id: user.id,
      entry_type,
      entry_id,
      entry_label,
      entry_gloss: entry_gloss || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already favourited' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
