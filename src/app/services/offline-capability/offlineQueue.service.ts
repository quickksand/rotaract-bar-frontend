import {inject, Injectable} from '@angular/core';
import {openDB} from 'idb';
import {PurchaseOrderDto} from '../../api/generated-api/models';
import {ConnectionStatusService} from './connection-status.service';
import {OrderService} from '../order.service';
import {BehaviorSubject, filter, Observable, pairwise} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OfflineQueueService {

  private connectionStatusService = inject(ConnectionStatusService);
  private orderService = inject(OrderService);

  private DB_NAME = 'asf-offline-queue';
  private dbPromise = openDB(this.DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore('orders', {autoIncrement: true});
    }
  });

  private queueLength$ = new BehaviorSubject<number>(0);

  get queueLength(): Observable<number> {
    return this.queueLength$.asObservable();
  }

  constructor() {
    this.dbPromise.then(db =>
      db.count('orders').then(count => this.queueLength$.next(count))
    );

    this.connectionStatusService.isOnline
      .pipe(
        pairwise(),
        filter(([previous, current]) => !previous && current)
      )
      .subscribe(() => this.flushQueue());
  }

  public enqueue(order: PurchaseOrderDto): Promise<void> {
    return this.dbPromise
      .then(db => db.add('orders', order))
      .then(() => {
        this.queueLength$.next(this.queueLength$.value + 1);
      });
  }

  public flushQueue(): void {
    this.dbPromise.then(db =>
      db.getAll('orders').then((queued: PurchaseOrderDto[]) => {
        if (queued.length === 0) return;

        this.orderService.flushQueuedOrders(queued).subscribe({
          next: result => {
            if (result.errors?.length) {
              console.warn('Batch-Import: einige Orders wurden abgelehnt:', result.errors);
            }
            db.clear('orders');
            this.queueLength$.next(0);
          },
          error: err => console.error('Batch-Import fehlgeschlagen, Queue bleibt erhalten:', err)
        });
      })
    );
  }
}
