import {HttpHandlerFn, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';
import {Router} from '@angular/router';
import {tap} from 'rxjs';
import {AdminAuthService} from '../services/admin-auth.service';

/**
 * Returns true for admin-only endpoints that require a JWT.
 * - PATCH /api/products/{id}
 * - POST  /api/products/reset
 */
function isAdminRequest(req: HttpRequest<unknown>): boolean {
  const url = req.url;
  if (url.includes('/api/products/reset') && req.method === 'POST') return true;
  if (url.match(/\/api\/products\/\d+/) && req.method === 'PATCH') return true;
  return false;
}

export const adminAuthInterceptor: HttpInterceptorFn = (req, next: HttpHandlerFn) => {
  if (!isAdminRequest(req)) {
    return next(req);
  }

  const auth = inject(AdminAuthService);
  const router = inject(Router);
  const token = auth.getToken();

  const authReq = token
    ? req.clone({setHeaders: {Authorization: `Bearer ${token}`}})
    : req;

  return next(authReq).pipe(
    tap({
      error: (err) => {
        if (err.status === 401) {
          auth.logout();
          router.navigate(['/admin/login']);
        }
      },
    }),
  );
};

