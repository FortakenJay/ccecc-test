import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { data, error } = await supabase
    .from('team_members')
    .select(`
      *,
      translations:team_member_translations(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json() as {
    memberData: Record<string, any>;
    translations?: Record<string, Record<string, any>>;
  };

  const { memberData, translations } = body;

  const { data: updatedMember, error: memberError } = await supabase
    .from('team_members')
    .update(memberData)
    .eq('id', id)
    .select()
    .single();

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 400 });
  }

  if (translations) {
    for (const [locale, trans] of Object.entries(translations)) {
      const transObj = trans as Record<string, any>;

      const { error: transError } = await supabase
        .from('team_member_translations')
        .upsert(
          {
            team_member_id: id,
            locale,
            ...transObj,
          },
          { onConflict: 'team_member_id,locale' }
        );

      if (transError) {
        return NextResponse.json({ error: transError.message }, { status: 400 });
      }
    }
  }

  return NextResponse.json({ data: updatedMember });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
