import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get('locale') || 'es';

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      translations:event_translations(*)
    `)
    .eq('is_active', true)
    .order('event_date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Filter translations by locale
  const eventsWithTranslation = data.map(event => {
    const translation = event.translations.find((t: any) => t.locale === locale);
    return {
      ...event,
      ...translation,
      translations: undefined,
    };
  });

  return NextResponse.json({ data: eventsWithTranslation });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { eventData, translations } = body;

  // Insert event
  const { data: newEvent, error: eventError } = await supabase
    .from('events')
    .insert({
      ...eventData,
      created_by: user.id,
    })
    .select()
    .single();

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 400 });
  }

  // Insert translations
  const translationsData = Object.entries(translations).map(([locale, trans]: any) => ({
    event_id: newEvent.id,
    locale,
    ...trans,
  }));

  const { error: transError } = await supabase
    .from('event_translations')
    .insert(translationsData);

  if (transError) {
    return NextResponse.json({ error: transError.message }, { status: 400 });
  }

  return NextResponse.json({ data: newEvent });
}