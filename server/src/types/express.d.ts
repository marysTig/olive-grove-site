declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        fullName: string;
        email: string;
      };
    }
  }
}

export {};
