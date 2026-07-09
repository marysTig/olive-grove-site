import { Response } from "express";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiResponsePayload<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: PaginationMeta;
}

export class ApiResponse {
  /**
   * 200 OK
   */
  static success<T>(res: Response, data: T, message = "Success"): Response {
    const payload: ApiResponsePayload<T> = {
      success: true,
      statusCode: 200,
      message,
      data,
    };
    return res.status(200).json(payload);
  }

  /**
   * 201 Created
   */
  static created<T>(res: Response, data: T, message = "Created successfully"): Response {
    const payload: ApiResponsePayload<T> = {
      success: true,
      statusCode: 201,
      message,
      data,
    };
    return res.status(201).json(payload);
  }

  /**
   * 204 No Content
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * 200 OK — Paginated list
   */
  static paginated<T>(
    res: Response,
    data: T[],
    meta: PaginationMeta,
    message = "Success",
  ): Response {
    const payload: ApiResponsePayload<T[]> = {
      success: true,
      statusCode: 200,
      message,
      data,
      meta,
    };
    return res.status(200).json(payload);
  }
}
