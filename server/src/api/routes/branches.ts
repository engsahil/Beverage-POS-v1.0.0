import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate);

/** List branches belonging to the authenticated business. */
router.get('/', authorize('branches.view'), async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    return;
  }

  try {
    const branches = await prisma.branch.findMany({
      where: { businessId: req.user.businessId },
      select: { id: true, name: true, code: true, address: true, phone: true, isActive: true },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
    res.json({ success: true, data: branches });
  } catch {
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch branches' } });
  }
});

export default router;
