import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, full_name, role, invited_by, is_active = true } = body;

    // Validate required fields
    if (!id || !email || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: id, email, full_name, role' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['owner', 'admin', 'officer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be owner, admin, or officer' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.id !== id) {
      return NextResponse.json(
        { error: 'Unauthorized: User must be authenticated and match the profile ID' },
        { status: 401 }
      );
    }

    // Create or update the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id,
        email,
        full_name,
        role,
        invited_by,
        is_active,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      
      let errorMessage = 'Failed to create profile';
      if (profileError.message) {
        if (profileError.message.includes('duplicate key')) {
          errorMessage = 'Profile already exists for this user';
        } else if (profileError.message.includes('foreign key')) {
          errorMessage = 'Invalid invitation reference';
        } else if (profileError.message.includes('check constraint')) {
          errorMessage = 'Invalid role or data format';
        } else if (profileError.message.includes('permission')) {
          errorMessage = 'Insufficient permissions to create profile';
        } else {
          errorMessage = profileError.message;
        }
      }
      
      return NextResponse.json(
        { error: errorMessage, details: profileError },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      profile,
      message: 'Profile created successfully' 
    });

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch profile', details: profileError },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Profile GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}