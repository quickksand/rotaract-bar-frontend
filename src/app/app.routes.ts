import {Routes} from '@angular/router';
import {OrderComponent} from './order/order.component';
import {PreparationComponent} from './preparation-component/preparation-component';

export const routes: Routes = [
  { path: '', redirectTo: '/order', pathMatch: 'full' },
  { path: 'order', component: OrderComponent },
  { path: 'preparation', component: PreparationComponent },
  // { path: '**', redirectTo: '/order' } // Fallback
];
