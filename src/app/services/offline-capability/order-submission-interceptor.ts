import {HttpInterceptorFn} from '@angular/common/http';
import {ConnectionStatusService} from './connection-status.service';
import {OfflineQueueService} from './offlineQueue.service';
import {PurchaseOrderDto} from '../../api/generated-api/models/purchase-order-dto';
import {EMPTY, from, switchMap, take} from "rxjs";
import {inject} from "@angular/core";

export const orderSubmissionInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'POST' || !req.url.includes('/api/orders')) {
    return next(req);
  }

  const connectionStatus = inject(ConnectionStatusService);
  const offlineQueue = inject(OfflineQueueService);

  return connectionStatus.isOnline$.pipe(
    take(1),
    switchMap(isOnline => {
      if (isOnline) return next(req);
      return from(offlineQueue.enqueue(req.body as PurchaseOrderDto)).pipe(
        switchMap(() => EMPTY)
      );
    })
  );
};
