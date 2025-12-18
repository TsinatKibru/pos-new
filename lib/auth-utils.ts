import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return session.user;
}

export async function requireAdmin() {
  const user = await requireAuth();

  if (user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required');
  }

  return user;
}

export async function validateApiAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
  }
  return { user: session.user, response: null };
}

export async function validateAdminAuth() {
  const { user, response } = await validateApiAuth();
  if (response) return { user, response };

  if (user?.role !== 'ADMIN') {
    return {
      user: null,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    };
  }
  return { user, response: null };
}

import { NextResponse } from 'next/server';
