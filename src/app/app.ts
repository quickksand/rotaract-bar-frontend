import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {toSignal} from '@angular/core/rxjs-interop';
import {OrderService} from './services/order.service';
import {ConnectionStatusService} from './services/offline-capability/connection-status.service';
import {OfflineQueueService} from './services/offline-capability/offlineQueue.service';


@Component({
  selector: 'app-root',
  imports: [
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private _orderService = inject(OrderService);
  private _connectionStatusService = inject(ConnectionStatusService);
  private _offlineQueue = inject(OfflineQueueService);

  openOrderCount = toSignal(this._orderService.openOrderCount$, {initialValue: 0});
  isOnline = toSignal(this._connectionStatusService.isOnline, {initialValue: navigator.onLine});
}
