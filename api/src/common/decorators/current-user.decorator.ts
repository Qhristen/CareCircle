import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface IUser {
  id: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof IUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: IUser }>();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
