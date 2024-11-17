// To avoid the TypeScript error "Cannot redeclare block-scoped variable"
export {};

declare global {
  namespace Express {
    export interface Request {
      userId?: string; // Add your custom property
    }
  }
}
