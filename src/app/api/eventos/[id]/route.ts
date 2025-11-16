// src/app/api/eventos/[id]/route.ts
import {createClient} from '@/lib/supabase/server';
import {NextRequest, NextResponse} from 'next/server';

export async function GET(request : NextRequest, {params} : {
    params: Promise < {
        id: string
    } >
}) {
    const supabase = await createClient();
    const {id} = await params;

    const {data, error} = await supabase
        .from('events')
        .select(`
      *,
      translations:event_translations(*)
    `)
        .eq('id', id)
        .single();

    if (error) {
        return NextResponse.json({
            error: error.message
        }, {status: 400});
    }

    return NextResponse.json({data});
}

export async function PUT(request : NextRequest, {params} : {
    params: Promise < {
        id: string
    } >
}) {
    const supabase = await createClient();
    const {id} = await params;

    // Authentication
    const {data: {
            user
        }, error: authError} = await supabase
        .auth
        .getUser();

    if (authError || !user) {
        return NextResponse.json({
            error: "Unauthorized"
        }, {status: 401});
    }

    // Body with proper typing
    const body = (await request.json())as {
        eventData: Record < string,
        any >;
        translations?: Record < string,
        Record < string,
        any >>;
    };

    const {eventData, translations} = body;

    // Update event
    const {data: updatedEvent, error: eventError} = await supabase
        .from("events")
        .update(eventData)
        .eq("id", id)
        .select()
        .single();

    if (eventError) {
        return NextResponse.json({
            error: eventError.message
        }, {status: 400});
    }

    // Update translations
    if (translations) {
        for (const [locale,
            trans]of Object.entries(translations)) {
            // ⬅️ FIX: trans is guaranteed to be an object
            const transObj = trans as Record < string,
                any >;

            const {error: transError} = await supabase
                .from("event_translations")
                .upsert({
                    event_id: id,
                    locale,
                    ...transObj
                }, {onConflict: "event_id,locale"});

            if (transError) {
                return NextResponse.json({
                    error: transError.message
                }, {status: 400});
            }
        }
    }

    return NextResponse.json({data: updatedEvent});
}

export async function DELETE(request : NextRequest, {params} : {
    params: Promise < {
        id: string
    } >
}) {
    const supabase = await createClient();
    const {id} = await params;

    const {data: {
            user
        }, error: authError} = await supabase
        .auth
        .getUser();
    if (authError || !user) {
        return NextResponse.json({
            error: 'Unauthorized'
        }, {status: 401});
    }

    const {error} = await supabase
        .from('events')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({
            error: error.message
        }, {status: 400});
    }

    return NextResponse.json({success: true});
}