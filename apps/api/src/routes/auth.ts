import { Router } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { prisma } from '@devflow/db';
import { successResponse, errorResponse } from '@devflow/shared';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../config/logger.js';

export const authRouter = Router();

/**
 * GET /api/v1/auth/github
 * Redirects the user to GitHub for OAuth authorization
 */
authRouter.get('/github', (_req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    scope: 'read:user user:email',
    redirect_uri: `${process.env.FRONTEND_URL}/auth/github/callback`,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

/**
 * POST /api/v1/auth/github/callback
 * Exchanges the OAuth code for an access token, creates/updates the user,
 * and returns a signed JWT for API access.
 */
authRouter.post('/github/callback', async (req, res, next) => {
  const { code } = req.body as { code?: string };

  if (!code) {
    return res.status(400).json(errorResponse('Missing OAuth code'));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token } = tokenResponse.data as { access_token: string };
    if (!access_token) {
      return res.status(400).json(errorResponse('Failed to obtain access token'));
    }

    // Fetch GitHub user profile
    const [userResponse, emailResponse] = await Promise.all([
      axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
      axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
    ]);

    const githubUser = userResponse.data as {
      id: number;
      login: string;
      name: string;
      avatar_url: string;
    };

    const emails = emailResponse.data as Array<{ email: string; primary: boolean }>;
    const primaryEmail = emails.find((e) => e.primary)?.email ?? emails[0]?.email;

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { githubId: String(githubUser.id) },
      update: {
        email: primaryEmail,
        name: githubUser.name ?? githubUser.login,
        avatarUrl: githubUser.avatar_url,
      },
      create: {
        githubId: String(githubUser.id),
        email: primaryEmail,
        name: githubUser.name ?? githubUser.login,
        avatarUrl: githubUser.avatar_url,
      },
    });

    logger.info('User authenticated via GitHub OAuth', { userId: user.id });

    // Issue a signed JWT for API access
    const token = jwt.sign(
      { id: user.id, githubId: user.githubId, email: user.email, orgId: user.orgId },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '7d' }
    );

    res.json(successResponse({ token, user }));
  } catch (err) {
    logger.error('GitHub OAuth callback error', { error: (err as Error).message });
    next(err);
  }
});

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user's profile (requires valid JWT)
 */
authRouter.get('/me', apiRateLimiter, async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json(errorResponse('Unauthorized'));
  }

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { organization: true },
    });

    if (!user) return res.status(404).json(errorResponse('User not found'));

    res.json(successResponse(user));
  } catch (err) {
    next(err);
  }
});
