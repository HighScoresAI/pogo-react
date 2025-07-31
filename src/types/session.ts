export interface Session {
    _id: string;
    description: string;
    status: string;
    duration?: string;
    artifacts: any[];
    createdAt: string;
    bgClass: string;
    iconClass: string;
    badgeClass: string;
} 