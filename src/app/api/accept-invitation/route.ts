import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, full_name, role, invited_by, invitation_id, is_active = true } = body;

    console.log('Accept invitation request:', { 
      id, 
      email, 
      role, 
      invitation_id, 
      invited_by,
      timestamp: new Date().toISOString() 
    });

    // Validate required fields
    if (!id || !email || !full_name || !role || !invitation_id) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: id, email, full_name, role, invitation_id' },
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
    
    // Use service role client for database operations to bypass RLS
    const serviceSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify there's a valid invitation for this email using service role
    const { data: invitation, error: invitationError } = await serviceSupabase
      .from('invitations')
      .select('*')
      .eq('id', invitation_id)
      .eq('email', email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    console.log('Invitation verification result:', { invitation: !!invitation, invitationError });

    if (invitationError || !invitation) {
      console.error('Invalid invitation:', { invitationError, invitation_id, email });
      return NextResponse.json(
        { error: 'Invalid or expired invitation', details: invitationError },
        { status: 400 }
      );
    }

    // Check if profile already exists using service role
    const { data: existingProfile } = await serviceSupabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single();

    console.log('Existing profile check:', { existingProfile: !!existingProfile });

    let profile;
    let profileError;

    if (existingProfile) {
      // Update existing profile using service role
      console.log('Updating existing profile');
      const { data, error } = await serviceSupabase
        .from('profiles')
        .update({
          email,
          full_name,
          role,
          invited_by,
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      profile = data;
      profileError = error;
    } else {
      // Create new profile using service role to bypass RLS
      console.log('Creating new profile with service role');
      const { data, error } = await serviceSupabase
        .from('profiles')
        .insert({
          id,
          email,
          full_name,
          role,
          invited_by,
          is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      profile = data;
      profileError = error;
    }

    console.log('Profile operation result:', { profile: !!profile, profileError });

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
        } else if (profileError.message.includes('policy')) {
          errorMessage = 'Profile creation not allowed - ensure invitation is valid';
        } else {
          errorMessage = profileError.message;
        }
      }
      
      return NextResponse.json(
        { error: errorMessage, details: profileError },
        { status: 500 }
      );
    }

    // Mark invitation as accepted using service role
    const { error: updateError } = await serviceSupabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation_id);

    if (updateError) {
      console.error('Failed to mark invitation as accepted:', updateError);
      // Don't fail the request since profile was created successfully
    }

    return NextResponse.json({ 
      success: true, 
      profile,
      message: 'Profile created successfully' 
    });

  } catch (error) {
    console.error('Invitation acceptance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}