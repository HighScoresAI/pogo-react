export interface Project {
    projectId: string;
    projectName: string;
    description?: string;
    role: string;
    sessions: any[];
    artifacts: number;
    updatedAt: string;
    bgClass: string;
    iconClass: string;
    badgeClass: string;
    createdBy?: string;
} 