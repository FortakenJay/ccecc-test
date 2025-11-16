import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get('locale') || 'es';

  const { data, error } = await supabase
    .from('team_members')
    .select(`
      *,
      translations:team_member_translations(*)
    `)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const membersWithTranslation = data.map(member => {
    const translation = member.translations.find((t: any) => t.locale === locale);
    return {
      ...member,
      ...translation,
      translations: undefined,
    };
  });

  return NextResponse.json({ data: membersWithTranslation });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { memberData, translations } = body;

  const { data: newMember, error: memberError } = await supabase
    .from('team_members')
    .insert({
      ...memberData,
      created_by: user.id,
    })
    .select()
    .single();

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 400 });
  }

  const translationsData = Object.entries(translations).map(([locale, trans]: any) => ({
    team_member_id: newMember.id,
    locale,
    ...trans,
  }));

  const { error: transError } = await supabase
    .from('team_member_translations')
    .insert(translationsData);

  if (transError) {
    return NextResponse.json({ error: transError.message }, { status: 400 });
  }

  return NextResponse.json({ data: newMember });
}