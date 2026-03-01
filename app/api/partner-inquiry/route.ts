import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPartnerInquiryNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, email, name, clubName, school, memberCount, platform, role, audienceSize, website, message } = body;

    // Validate required fields
    if (!type || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['club', 'educator', 'partner'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid inquiry type' },
        { status: 400 }
      );
    }

    // Create the inquiry in the database
    const inquiry = await prisma.partnerInquiry.create({
      data: {
        type,
        email,
        name: name || null,
        clubName: clubName || null,
        school: school || null,
        memberCount: memberCount || null,
        platform: platform || null,
        role: role || null,
        audienceSize: audienceSize || null,
        website: website || null,
        notes: message || null,
      },
    });

    // Send email notification
    try {
      await sendPartnerInquiryNotification({
        type,
        email,
        name,
        clubName,
        school,
        memberCount,
        platform,
        role,
        audienceSize,
        website,
        message,
      });
    } catch (emailError) {
      // Log but don't fail the request if email fails
      console.error('Failed to send partner inquiry notification email:', emailError);
    }

    return NextResponse.json({ success: true, id: inquiry.id });
  } catch (error) {
    console.error('Partner inquiry error:', error);
    return NextResponse.json(
      { error: 'Failed to submit inquiry' },
      { status: 500 }
    );
  }
}
