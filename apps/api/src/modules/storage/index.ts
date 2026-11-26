import { env } from '../../config/env';
import { LocalPrivateStorageService } from './local-storage.service';
import { S3StorageService } from './s3-storage.service';
import type { IStorageService } from './storage.types';

export function createStorageService(): {
  storageService: IStorageService;
  localStorageService: LocalPrivateStorageService | null;
} {
  if (
    env.STORAGE_DRIVER === 's3' &&
    env.S3_BUCKET &&
    env.S3_ACCESS_KEY_ID &&
    env.S3_SECRET_ACCESS_KEY
  ) {
    return {
      storageService: new S3StorageService({
        endpoint: env.S3_ENDPOINT,
        region: env.S3_REGION,
        bucket: env.S3_BUCKET,
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        forcePathStyle: env.S3_FORCE_PATH_STYLE,
      }),
      localStorageService: null,
    };
  }

  const localStorageService = new LocalPrivateStorageService(
    env.STORAGE_LOCAL_DIR,
    env.STORAGE_SIGNING_SECRET,
    env.PUBLIC_API_BASE_URL,
  );
  return {
    storageService: localStorageService,
    localStorageService,
  };
}
