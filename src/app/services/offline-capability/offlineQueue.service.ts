import {Injectable} from '@angular/core';
import {openDB} from 'idb';
import {PurchaseOrder} from '../../api/generated-api/models/purchase-order';

@Injectable({
  providedIn: 'root'
})
export class OfflineQueueService {
  private DB_NAME = 'asf-offline-queue';
  private dbPromise = openDB(this.DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore('orders', { autoIncrement: true });
    }
  });

  private enqueue(order: PurchaseOrder): Promise<void> {
    return this.dbPromise
      .then(db => db.add('orders', order)
        .then(() => void 0));
  }
}
