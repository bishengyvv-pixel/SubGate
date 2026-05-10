import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl: url, ip } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.log(`${method} ${url} ${ms}ms - ${ip}`);
        },
        error: (error) => {
          const ms = Date.now() - start;
          const status = error?.status || error?.statusCode || 500;
          this.logger.error(`${method} ${url} ${status} ${ms}ms - ${ip}`, error.stack);
        },
      }),
    );
  }
}
