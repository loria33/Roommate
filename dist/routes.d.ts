import { Request, Response } from "express";
export declare const wakeup: (req: Request, res: Response) => Promise<void>;
export declare const read: (req: Request, res: Response) => Promise<void>;
export declare const dashboard: (req: Request, res: Response) => Promise<void>;
export declare const getConversations: (req: Request, res: Response) => Promise<void>;
export declare const getInitConversations: (req: Request, res: Response) => Promise<void>;
export declare const getNotFound: (req: Request, res: Response) => Promise<void>;
/**
 * Update an existing room status entry
 */
export declare const updateRoomStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=routes.d.ts.map