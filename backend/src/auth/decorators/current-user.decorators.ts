import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const Public = () => {
  const decorator = (target: any, key?: any, descriptor?: any) => {
    if (descriptor) {
      Reflect.defineMetadata('isPublic', true, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata('isPublic', true, target);
    return target;
  };
  return decorator;
};