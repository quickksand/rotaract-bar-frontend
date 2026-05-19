import {inject, Injectable} from '@angular/core';
import {openDB} from 'idb';
import {PurchaseOrderDto} from '../../api/generated-api/models';
import {BehaviorSubject, filter, Observable, pairwise, startWith, take} from 'rxjs';
import {ConnectionStatusService} from './connection-status.service';
import {OrderService} from '../order.service';

export interface QueuedOrder {
  order: PurchaseOrderDto;
  enqueuedAt: string;
}

export interface FailedOrderEntry {
  order: PurchaseOrderDto;
  enqueuedAt?: string;
  failedAt: string;
  reason: string;
}

function asQueuedOrder(raw: any): QueuedOrder {
  return ('order' in raw && 'enqueuedAt' in raw)
    ? raw as QueuedOrder
    : { order: raw as PurchaseOrderDto, enqueuedAt: new Date().toISOString() };
}

@Injectable({ providedIn: 'root' })
export class OfflineQueueService {

  private connectionStatusService = inject(ConnectionStatusService);
  private orderService = inject(OrderService);

  private readonly DB_NAME = 'asf-offline-queue';
  private dbPromise = openDB(this.DB_NAME, 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('orders', { autoIncrement: true });
      }
      if (oldVersion < 2) {
        db.createObjectStore('failed-orders', { autoIncrement: true });
      }
    }
  });

  private readonly _queueLength$ = new BehaviorSubject<number>(0);
  private readonly _failedCount$ = new BehaviorSubject<number>(0);

  get queueLength(): Observable<number> {
    return this._queueLength$.asObservable();
  }

  get failedCount$(): Observable<number> {
    return this._failedCount$.asObservable();
  }

  constructor() {
    this.dbPromise.then(db =>
      Promise.all([db.count('orders'), db.count('failed-orders')]).then(([pending, failed]) => {
        this._queueLength$.next(pending);
        this._failedCount$.next(failed);
      })
    );

    this.connectionStatusService.isOnline
      .pipe(
        startWith(false as boolean),
        pairwise(),
        filter(([previous, current]) => !previous && current)
      )
      .subscribe(() => this.flushQueue());
  }

  public enqueue(order: PurchaseOrderDto): Promise<void> {
    const entry: QueuedOrder = { order, enqueuedAt: new Date().toISOString() };
    return this.dbPromise
      .then(db => db.add('orders', entry))
      .then(() => {
        this._queueLength$.next(this._queueLength$.value + 1);
        this.connectionStatusService.isOnline.pipe(take(1)).subscribe(online => {
          if (online) this.flushQueue();
        });
      });
  }

  public getPendingOrders(): Promise<QueuedOrder[]> {
    return this.dbPromise.then(db =>
      db.getAll('orders').then((items: any[]) => items.map(asQueuedOrder))
    );
  }

  public getFailedOrders(): Promise<FailedOrderEntry[]> {
    return this.dbPromise.then(db => db.getAll('failed-orders') as Promise<FailedOrderEntry[]>);
  }

  public clearFailedOrders(): Promise<void> {
    return this.dbPromise
      .then(db => db.clear('failed-orders'))
      .then(() => this._failedCount$.next(0));
  }

  public flushQueue(): void {
    this.dbPromise.then(db =>
      db.getAll('orders').then((rawItems: any[]) => {
        const queuedOrders = rawItems.map(asQueuedOrder);
        if (queuedOrders.length === 0) return;

        this.orderService.flushQueuedOrders(queuedOrders.map(q => q.order)).subscribe({
          next: result => {
            const errorCount = result.errors?.length ?? 0;
            if (errorCount === 0) {
              db.clear('orders');
              this._queueLength$.next(0);
            } else {
              const failed = this.findFailedOrders(queuedOrders, result.created ?? []);
              this.moveToDeadLetter(db, failed, result.errors!.join(' · '));
            }
          },
          error: err => console.error('Batch-Import fehlgeschlagen, Queue bleibt erhalten:', err)
        });
      })
    );
  }

  // Identifies which queued orders were NOT returned in `created` using content fingerprinting.
  // Uses a counting map to handle duplicate orders correctly.
  private findFailedOrders(queued: QueuedOrder[], created: PurchaseOrderDto[]): QueuedOrder[] {
    const remaining = new Map<string, number>();
    for (const o of created) {
      const fp = this.fingerprint(o);
      remaining.set(fp, (remaining.get(fp) ?? 0) + 1);
    }
    const failed: QueuedOrder[] = [];
    for (const q of queued) {
      const fp = this.fingerprint(q.order);
      const count = remaining.get(fp) ?? 0;
      if (count > 0) {
        remaining.set(fp, count - 1);
      } else {
        failed.push(q);
      }
    }
    return failed;
  }

  private fingerprint(order: PurchaseOrderDto): string {
    const items = [...(order.items ?? [])].sort((a, b) => (a.productId ?? 0) - (b.productId ?? 0));
    return JSON.stringify({
      items,
      paymentMethod: order.paymentMethod,
      tipAmount: order.tipAmount ?? 0,
      returnedCupsCount: order.returnedCupsCount ?? 0,
      freeDrinkDiscount: order.freeDrinkDiscount ?? 0,
    });
  }

  private moveToDeadLetter(db: any, queuedOrders: QueuedOrder[], reason: string): void {
    const now = new Date().toISOString();
    const tx = db.transaction(['orders', 'failed-orders'], 'readwrite');
    Promise.all([
      tx.objectStore('orders').clear(),
      ...queuedOrders.map(({ order, enqueuedAt }) =>
        tx.objectStore('failed-orders').add({ order, enqueuedAt, failedAt: now, reason } as FailedOrderEntry)
      ),
      tx.done,
    ]).then(() => {
      this._queueLength$.next(0);
      this._failedCount$.next(this._failedCount$.value + queuedOrders.length);
    });
  }
}
