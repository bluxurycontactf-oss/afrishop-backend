import { ResiGroupService } from './resigroup.service';
export declare class ResiAiController {
    private service;
    constructor(service: ResiGroupService);
    log(question: string): Promise<{
        success: boolean;
    }>;
    knowledge(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        keywords: string;
        answer: string;
    }[]>;
    unanswered(): Promise<{
        id: string;
        createdAt: Date;
        count: number;
        question: string;
        lastAsked: Date;
    }[]>;
    dismiss(id: string): Promise<{
        success: boolean;
    }>;
    teach(body: {
        keywords: string;
        answer: string;
        unansweredId?: string;
    }): Promise<{
        success: boolean;
        knowledge: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            keywords: string;
            answer: string;
        };
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        knowledge?: undefined;
    }>;
    deleteKnowledge(id: string): Promise<{
        success: boolean;
    }>;
}
