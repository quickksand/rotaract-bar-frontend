import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {AdminAuthService} from '../services/admin-auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);

  if (auth.isUnlocked()) {
    return true;
  }
  return router.createUrlTree(['/admin/login']);
};
