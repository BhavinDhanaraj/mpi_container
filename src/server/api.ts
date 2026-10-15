import { Router, Request, Response } from 'express';
import { repository } from './db/repository.ts';
import { FlagType, YardContainer } from '../types/index.ts';

export const apiRouter = Router();

// GET /api/summary
apiRouter.get('/summary', async (_req: Request, res: Response) => {
  try {
    const summary = await repository.getSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/containers?flag=...&search=...&type=yard|out
apiRouter.get('/containers', async (req: Request, res: Response) => {
  try {
    const flag = req.query.flag as string | undefined;
    const search = req.query.search as string | undefined;
    const type = req.query.type as string | undefined;

    if (type === 'out') {
      const outList = await repository.getCheckedOutContainers(search);
      return res.json({ success: true, data: outList });
    }

    const yardList = await repository.getYardContainers({ flag, search });
    res.json({ success: true, data: yardList });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/containers/:id
apiRouter.get('/containers/:id', async (req: Request, res: Response) => {
  try {
    const container = await repository.getContainer(req.params.id);
    if (!container) {
      return res.status(404).json({ success: false, message: 'Container not found in yard' });
    }
    res.json({ success: true, data: container });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/containers/gate-in
apiRouter.post('/containers/gate-in', async (req: Request, res: Response) => {
  try {
    const payload = req.body as YardContainer;
    if (!payload.c || !payload.bacc) {
      return res.status(400).json({ success: false, message: 'Container number and BACC required' });
    }
    const created = await repository.gateInContainer(payload);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// PATCH /api/containers/:id/bacc
apiRouter.patch('/containers/:id/bacc', async (req: Request, res: Response) => {
  try {
    const { bacc, flag, label, cond, instr } = req.body;
    if (!bacc || !flag || !label || !cond) {
      return res.status(400).json({ success: false, message: 'Missing required BACC fields' });
    }

    const updated = await repository.updateContainerBacc(req.params.id, {
      bacc,
      flag: flag as FlagType,
      label,
      cond,
      instr
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Container not found in yard' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/containers/:id/checkout
apiRouter.post('/containers/:id/checkout', async (req: Request, res: Response) => {
  try {
    const outTime = req.body.outTime as string | undefined;
    const checkedOut = await repository.checkoutContainer(req.params.id, outTime);
    if (!checkedOut) {
      return res.status(404).json({ success: false, message: 'Container not found in yard' });
    }
    res.json({ success: true, data: checkedOut });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/runs
apiRouter.get('/runs', async (_req: Request, res: Response) => {
  try {
    const runs = await repository.getRuns();
    res.json({ success: true, data: runs });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/runs/poll (simulate agent mailbox poll)
apiRouter.post('/runs/poll', async (_req: Request, res: Response) => {
  try {
    const pollResult = await repository.triggerPoll();
    res.json({ success: true, data: pollResult });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/events
apiRouter.get('/events', async (_req: Request, res: Response) => {
  try {
    const events = await repository.getEvents();
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});
