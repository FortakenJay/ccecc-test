import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      translations:class_translations(*)
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

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Typed body
  const body = (await request.json()) as {
    classData: Record<string, any>;
    translations?: Record<string, Record<string, any>>;
  };

  const { classData, translations } = body;

  // Update class
  const { data: updatedClass, error: classError } = await supabase
    .from('classes')
    .update(classData)
    .eq('id', id)
    .select()
    .single();

  if (classError) {
    return NextResponse.json({ error: classError.message }, { status: 400 });
  }

  // Update translations if provided
  if (translations) {
    for (const [locale, trans] of Object.entries(translations)) {
      const transObj = trans as Record<string, any>; // ← FIX

      const { error: transError } = await supabase
        .from('class_translations')
        .upsert(
          {
            class_id: id,
            locale,
            ...transObj, // ← SAFE
          },
          {
            onConflict: 'class_id,locale',
          }
        );

      if (transError) {
        return NextResponse.json(
          { error: transError.message },
          { status: 400 }
        );
      }
    }
  }

  return NextResponse.json({ data: updatedClass });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase.from('classes').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
