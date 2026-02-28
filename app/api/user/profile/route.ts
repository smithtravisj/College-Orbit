import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import bcrypt from 'bcryptjs';
import { withRateLimit } from '@/lib/withRateLimit';

// GET user profile
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        profileImage: true,
        collegeId: true,
        college: {
          select: {
            id: true,
            fullName: true,
            acronym: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
});

// Username validation regex: 3-20 chars, alphanumeric + underscores
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// PATCH update user profile
export const PATCH = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      console.error('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { name, email, password, username, profileImage, collegeId } = data;
    console.log('Updating profile for user:', userId, { name, email, password: password ? 'provided' : 'not provided', username, collegeId });

    // Check if email is already in use by another user
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        );
      }
    }

    // Validate username if provided
    if (username !== undefined && username !== null && username !== '') {
      if (!USERNAME_REGEX.test(username)) {
        return NextResponse.json(
          { error: 'Username must be 3-20 characters, alphanumeric and underscores only' },
          { status: 400 }
        );
      }

      // Check if username is already taken by another user
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUsername && existingUsername.id !== userId) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 409 }
        );
      }
    }

    // Validate profile image if provided (max 5MB base64)
    if (profileImage !== undefined && profileImage !== null && profileImage !== '') {
      if (!profileImage.startsWith('data:image/')) {
        return NextResponse.json(
          { error: 'Invalid image format' },
          { status: 400 }
        );
      }
      // Base64 is ~33% larger than binary, so 5MB binary ≈ 6.7MB base64
      if (profileImage.length > 7 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Profile image must be less than 5MB' },
          { status: 400 }
        );
      }
    }

    // Validate collegeId if provided
    if (collegeId !== undefined && collegeId !== null && collegeId !== '') {
      const college = await prisma.college.findUnique({
        where: { id: collegeId },
      });

      if (!college) {
        return NextResponse.json(
          { error: 'Invalid college' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined && name !== '') updateData.name = name;
    if (email !== undefined && email !== '') updateData.email = email;
    if (password !== undefined && password !== '') {
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    if (username !== undefined) {
      updateData.username = username === '' ? null : username;
    }
    if (profileImage !== undefined) {
      updateData.profileImage = profileImage === '' ? null : profileImage;
    }
    if (collegeId !== undefined) {
      updateData.collegeId = collegeId === '' ? null : collegeId;
    }

    console.log('Update data:', { ...updateData, profileImage: updateData.profileImage ? '[base64 data]' : undefined });

    if (Object.keys(updateData).length === 0) {
      console.log('No fields to update');
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        profileImage: true,
        collegeId: true,
        college: {
          select: {
            id: true,
            fullName: true,
            acronym: true,
          },
        },
      },
    });

    // If collegeId was updated, also sync Settings.university for theming
    if (collegeId !== undefined) {
      const universityName = user.college?.fullName || null;
      await prisma.settings.updateMany({
        where: { userId },
        data: { university: universityName },
      });
      console.log('[PATCH /api/user/profile] Synced Settings.university:', universityName);
    }

    console.log('User updated successfully:', { ...user, profileImage: user.profileImage ? '[base64 data]' : null });
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
});
