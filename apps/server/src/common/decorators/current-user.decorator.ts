import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface IJwtUser {
  id: string;
  username: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof IJwtUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as IJwtUser;
    return data ? user?.[data] : user;
  },
);
