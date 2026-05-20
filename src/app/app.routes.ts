import {Routes} from '@angular/router';
import {OrderComponent} from './order/order.component';
import {PreparationComponent} from './preparation-component/preparation-component';
import {StatusComponent} from './status/status.component';
import {AdminComponent} from './admin/admin.component';
import {AdminLoginComponent} from './admin/admin-login/admin-login.component';
import {adminGuard} from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/order', pathMatch: 'full' },
  { path: 'order', component: OrderComponent },
  { path: 'preparation', component: PreparationComponent },
  { path: 'status', component: StatusComponent },
  { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
  { path: 'admin/login', component: AdminLoginComponent },
  // { path: '**', redirectTo: '/order' } // Fallback
];
