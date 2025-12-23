import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, retry, throwError, timer } from 'rxjs';

const RATE_LIMIT_STATUS = 429;

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.weatherApiBaseUrl)) {
    return next(req);
  }

  // Prefer static key from environment, fallback to runtime-provided key (window.__env__)
  const runtimeKey = (window as any).__env__?.weatherApiKey;
  const apiKey = environment.weatherApiKey || runtimeKey || '';

  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const request = req.clone({ setHeaders: headers });

  return next(request).pipe(
    retry({
      count: 2,
      delay: (err, retryCount) => {
        if (err instanceof HttpErrorResponse && err.status === RATE_LIMIT_STATUS) {
          // simple backoff to handle rate limiting politely
          return timer(500 * retryCount);
        }
        return throwError(() => err);
      },
    }),
    catchError((error: HttpErrorResponse) => {
      const friendly =
        error.status === RATE_LIMIT_STATUS
          ? 'WeatherAPI rate limit reached. Please try again in a moment.'
          : error.status === 401 || error.status === 403
          ? 'WeatherAPI rejected the request (check API key/plan permissions).'
          : 'Unable to reach WeatherAPI at the moment.';
      return throwError(() => new Error(friendly));
    })
  );
};
