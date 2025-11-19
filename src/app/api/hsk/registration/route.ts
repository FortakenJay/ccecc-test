import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidFutureDate,
  isValidSlots,
  isValidPayloadSize,
  sanitizeError,
  checkAuth,
  checkAuthorization,
  errorResponse,
  checkCSRFProtection,
  sanitizeTextInput
} from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('hsk_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('HSK registrations query error:', error);
      return errorResponse('Failed to fetch HSK registrations', 400);
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    return errorResponse(sanitizeError(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // CSRF Protection
    if (!checkCSRFProtection(request)) {
      return errorResponse('Invalid request origin', 403);
    }

    const body = await request.json();

    // Validate payload size
    if (!isValidPayloadSize(body)) {
      return errorResponse('Request body too large', 413);
    }

    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      level, 
      previous_level,
      exam_session_id,
      recaptcha_token 
    } = body;

    // Validate required fields
    if (!first_name || !last_name || !email || !phone || !level) {
      return errorResponse('Missing required fields: first_name, last_name, email, phone, level', 400);
    }

    // Validate field lengths to prevent overflow
    if (first_name.length > 50 || first_name.length < 2) {
      return errorResponse('First name must be between 2 and 50 characters', 400);
    }

    if (last_name.length > 50 || last_name.length < 2) {
      return errorResponse('Last name must be between 2 and 50 characters', 400);
    }

    if (email.length > 255) {
      return errorResponse('Email is too long', 400);
    }

    if (phone.length > 20) {
      return errorResponse('Phone number is too long', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse('Invalid email format', 400);
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^(\+?\d{1,3}[\s-]?)?\d{4}[\s-]?\d{4}$/;
    if (!phoneRegex.test(phone.trim())) {
      return errorResponse('Invalid phone number format', 400);
    }

    // Validate level is a valid HSK level
    const validLevels = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6'];
    if (!validLevels.includes(level.toLowerCase())) {
      return errorResponse('Invalid HSK level', 400);
    }

    // Validate name contains only letters, spaces, hyphens, and accented characters
    const nameRegex = /^[a-zA-Z\u00e1\u00e9\u00ed\u00f3\u00fa\u00c1\u00c9\u00cd\u00d3\u00da\u00f1\u00d1\s-]+$/;
    if (!nameRegex.test(first_name) || !nameRegex.test(last_name)) {
      return errorResponse('Names can only contain letters, spaces, and hyphens', 400);
    }

    // Validate reCAPTCHA token
    if (!recaptcha_token) {
      return errorResponse('reCAPTCHA verification required', 400);
    }

    // Verify reCAPTCHA token with Google
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    if (recaptchaSecret) {
      const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${recaptchaSecret}&response=${recaptcha_token}`,
      });

      const recaptchaResult = await recaptchaResponse.json();

      if (!recaptchaResult.success) {
        return errorResponse('reCAPTCHA verification failed', 400);
      }
    }

    // Sanitize inputs (remove dangerous characters)
    const sanitizedData = {
      first_name: sanitizeTextInput(first_name),
      last_name: sanitizeTextInput(last_name),
      email: sanitizeTextInput(email.toLowerCase().trim()),
      phone: sanitizeTextInput(phone),
      level: sanitizeTextInput(level.toLowerCase()),
      previous_level: previous_level ? sanitizeTextInput(previous_level) : 'no',
      exam_session_id: exam_session_id || null,
      status: 'pending'
    };

    // Insert registration into database
    const { data, error } = await supabase
      .from('hsk_registrations')
      .insert(sanitizedData)
      .select()
      .single();

    if (error || !data) {
      console.error('Registration insert error:', error);
      return errorResponse('Failed to create HSK registration', 400);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('Unauthorized', 401);
    }
    if (error.message === 'FORBIDDEN') {
      return errorResponse('Insufficient permissions', 403);
    }
    return errorResponse(sanitizeError(error));
  }
}