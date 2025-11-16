import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get('locale') || 'es';

  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      translations:class_translations(*)
    `)
    .eq('is_active', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Filter translations by locale
  const classesWithTranslation = data.map(cls => {
    const translation = cls.translations.find((t: any) => t.locale === locale);
    return {
      ...cls,
      ...translation,
      translations: undefined,
    };
  });

  return NextResponse.json({ data: classesWithTranslation });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { classData, translations } = body;

  // Insert class
  const { data: newClass, error: classError } = await supabase
    .from('classes')
    .insert({
      ...classData,
      created_by: user.id,
    })
    .select()
    .single();

  if (classError) {
    return NextResponse.json({ error: classError.message }, { status: 400 });
  }

  // Insert translations
  const translationsData = Object.entries(translations).map(([locale, trans]: any) => ({
    class_id: newClass.id,
    locale,
    ...trans,
  }));

  const { error: transError } = await supabase
    .from('class_translations')
    .insert(translationsData);

  if (transError) {
    return NextResponse.json({ error: transError.message }, { status: 400 });
  }

  return NextResponse.json({ data: newClass });
}