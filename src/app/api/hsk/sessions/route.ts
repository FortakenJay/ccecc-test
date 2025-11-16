import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  let query = supabase
    .from('hsk_registrations')
    .select('*')
    .order('created_at', { ascending: false });

  if (sessionId) {
    query = query.eq('exam_session_id', sessionId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  // Check if session has available slots
  const { data: session, error: sessionError } = await supabase
    .from('hsk_exam_sessions')
    .select('available_slots')
    .eq('id', body.exam_session_id)
    .single();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 400 });
  }

  if (session.available_slots <= 0) {
    return NextResponse.json({ error: 'No available slots' }, { status: 400 });
  }

  // Create registration
  const { data, error } = await supabase
    .from('hsk_registrations')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Update available slots
  await supabase
    .from('hsk_exam_sessions')
    .update({ available_slots: session.available_slots - 1 })
    .eq('id', body.exam_session_id);

  return NextResponse.json({ data });
}