import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class DebugInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    try {
      const url = req.url || '';
      if (url.includes('/api/utilisateurs') && (req.method === 'POST' || req.method === 'PUT')) {
        console.log('DebugInterceptor -> outgoing request to', req.method, url);
        console.log('Headers:', req.headers.keys().reduce((acc: any, k: string) => ({ ...acc, [k]: req.headers.get(k) }), {}));
        const contentType = req.headers.get('Content-Type');
        console.log('Content-Type header:', contentType);
        const body = req.body;
        if (body instanceof FormData) {
          console.log('Body is FormData. Entries:');
          for (const [key, value] of body.entries()) {
            if (value instanceof File) {
              console.log('FormData entry:', key, 'File:', { name: value.name, size: value.size, type: value.type });
            } else {
              console.log('FormData entry:', key, value);
            }
          }
        } else {
          console.log('Body is not FormData, body:', body);
        }
      }
    } catch (e) {
      console.error('DebugInterceptor error', e);
    }

    return next.handle(req).pipe(
      tap({
        next: () => {},
      })
    );
  }
}
