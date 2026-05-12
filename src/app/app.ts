import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {toSignal} from '@angular/core/rxjs-interop';
import {OrderService} from './services/order.service';
import {ConnectionStatusService} from './services/connection-status.service';


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
  private orderService = inject(OrderService);
  openOrderCount = toSignal(this.orderService.openOrderCount$, {initialValue: 0});

  private connectionStatusService= inject(ConnectionStatusService);
  isOnline = toSignal(this.connectionStatusService.isOnline, {initialValue: navigator.onLine})
}
