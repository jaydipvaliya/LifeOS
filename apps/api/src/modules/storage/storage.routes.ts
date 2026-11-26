import express, { Router } from 'express';
import { BadRequestError } from '../../shared/errors';
import { sendSuccess } from '../../shared/response';
import type { LocalPrivateStorageService } from './local-storage.service';

export function createLocalStorageRouter(localStorage: LocalPrivateStorageService): Router {
  const router = Router();

  router.put('/upload', express.raw({ type: '*/*', limit: '16mb' }), async (req, res, next) => {
    try {
      const token = typeof req.query.token === 'string' ? req.query.token : '';
      if (!token) {
        throw new BadRequestError('Storage upload token is required');
      }
      if (!Buffer.isBuffer(req.body)) {
        throw new BadRequestError('Binary request body is required');
      }
      const result = await localStorage.writeFromSignedUpload(token, req.body);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  });

  router.get('/download', async (req, res, next) => {
    try {
      const token = typeof req.query.token === 'string' ? req.query.token : '';
      if (!token) {
        throw new BadRequestError('Storage download token is required');
      }
      const file = await localStorage.readFromSignedDownload(token);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${file.filename.replace(/"/g, '')}"`);
      res.setHeader('Cache-Control', 'private, no-store');
      res.send(file.buffer);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
