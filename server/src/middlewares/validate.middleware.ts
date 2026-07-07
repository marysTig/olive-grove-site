import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

interface ValidationSchemas {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

/**
 * Generic Zod validation middleware factory.
 * Validates `req.body`, `req.query`, and/or `req.params` against
 * the provided Zod schemas.
 *
 * @example
 *   router.post('/product', validate({ body: createProductSchema }), createProduct);
 */
export const validate = (schemas: ValidationSchemas) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query) as Record<string, string>;
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params) as Record<string, string>;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(422).json({
          success: false,
          statusCode: 422,
          message: 'Validation failed',
          errors: formattedErrors,
        });
        return;
      }

      next(error);
    }
  };
};
