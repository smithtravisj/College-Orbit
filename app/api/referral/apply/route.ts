import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Validate and apply a referral code (called during signup)
// This is a public endpoint used during the signup process
export async function POST(req: NextRequest) {
  try {
    const { referralCode, refereeId } = await req.json();

    if (!referralCode || !refereeId) {
      return NextResponse.json(
        { error: 'Missing referral code or referee ID' },
        { status: 400 }
      );
    }

    // Find the referrer by their referral code
    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
      select: { id: true, name: true, email: true },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    // Check self-referral
    if (referrer.id === refereeId) {
      return NextResponse.json(
        { error: 'Cannot use your own referral code' },
        { status: 400 }
      );
    }

    // Check if referee already has a referral
    const existingReferral = await prisma.referral.findUnique({
      where: { refereeId },
    });

    if (existingReferral) {
      return NextResponse.json(
        { error: 'User already has a referral' },
        { status: 409 }
      );
    }

    // Create the referral record and update the referee's referredById
    const [referral] = await prisma.$transaction([
      prisma.referral.create({
        data: {
          referrerId: referrer.id,
          refereeId,
          status: 'pending',
          rewardMonths: 1,
        },
      }),
      prisma.user.update({
        where: { id: refereeId },
        data: { referredById: referrer.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      referralId: referral.id,
      referrerName: referrer.name || referrer.email?.split('@')[0] || 'Someone',
    });
  } catch (error) {
    console.error('Referral apply error:', error);
    return NextResponse.json(
      { error: 'Failed to apply referral code' },
      { status: 500 }
    );
  }
}

// GET - Validate a referral code without applying it (for UI validation)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Missing referral code' },
        { status: 400 }
      );
    }

    const referrer = await prisma.user.findUnique({
      where: { referralCode: code.toUpperCase() },
      select: { id: true, name: true },
    });

    if (!referrer) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      referrerName: referrer.name || 'A friend',
    });
  } catch (error) {
    console.error('Referral validate error:', error);
    return NextResponse.json(
      { error: 'Failed to validate referral code' },
      { status: 500 }
    );
  }
}
