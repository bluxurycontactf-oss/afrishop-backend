import { PrismaService } from '../../config/prisma.service';
export declare class ResiGroupService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllContent(): Promise<Record<string, any>>;
    getContent(key: string): Promise<any>;
    upsertContent(key: string, data: any): Promise<any>;
    upsertAllContent(payload: Record<string, any>): Promise<void>;
    createRequest(dto: {
        type: any;
        name: string;
        phone: string;
        email?: string;
        subject?: string;
        message?: string;
        data?: any;
    }): Promise<{
        id: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ResiRequestType;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        phone: string;
        subject: string | null;
        status: import(".prisma/client").$Enums.ResiRequestStatus;
        message: string | null;
        resiCustomerId: string | null;
    }>;
    getAllRequests(type?: string, status?: string): Promise<{
        id: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ResiRequestType;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        phone: string;
        subject: string | null;
        status: import(".prisma/client").$Enums.ResiRequestStatus;
        message: string | null;
        resiCustomerId: string | null;
    }[]>;
    updateRequestStatus(id: string, status: string): Promise<{
        id: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ResiRequestType;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        phone: string;
        subject: string | null;
        status: import(".prisma/client").$Enums.ResiRequestStatus;
        message: string | null;
        resiCustomerId: string | null;
    }>;
    deleteRequest(id: string): Promise<{
        id: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ResiRequestType;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        phone: string;
        subject: string | null;
        status: import(".prisma/client").$Enums.ResiRequestStatus;
        message: string | null;
        resiCustomerId: string | null;
    }>;
    getRequestStats(): Promise<{
        total: number;
        new: number;
        inProgress: number;
        done: number;
    }>;
    checkAvailability(propertyId: string, checkIn: string, checkOut: string): Promise<{
        available: boolean;
        message: string;
        nextAvailableFrom?: string;
        availableUntil?: string;
        conflicts?: Array<{
            checkIn: string;
            checkOut: string;
        }>;
    }>;
    private normalizeQuestion;
    logUnansweredQuestion(question: string): Promise<{
        success: boolean;
    }>;
    getUnansweredQuestions(): Promise<{
        id: string;
        createdAt: Date;
        count: number;
        question: string;
        lastAsked: Date;
    }[]>;
    dismissUnansweredQuestion(id: string): Promise<{
        success: boolean;
    }>;
    getAiKnowledge(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        keywords: string;
        answer: string;
    }[]>;
    teachAiAnswer(keywords: string, answer: string, unansweredId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        keywords: string;
        answer: string;
    }>;
    deleteAiKnowledge(id: string): Promise<{
        success: boolean;
    }>;
}
