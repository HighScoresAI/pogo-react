export interface Artifact {
    _id: string;
    captureName: string;
    processedText?: string;
    captureType: string;
    createdAt: string;
    bgClass: string;
    iconClass: string;
    badgeClass: string;
    createdBy: string;
    url?: string;
    fileSize?: number;
    duration?: number;
    status?: 'pending' | 'processing' | 'completed' | 'failed';
    processedAt?: string;
    segments?: Array<{
        start: number;
        end: number;
        speaker: string;
    }>;
} 