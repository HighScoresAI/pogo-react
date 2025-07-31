// @ts-nocheck
import { useState, useCallback } from 'react';
import { Project } from '../types/project';
import { Session } from '../types/session';
import { Artifact } from '../types/artifact';

export function useMockData() {
    const [loading, setLoading] = useState(false);

    const getProjects = useCallback(async (): Promise<Project[]> => {
        setLoading(true);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const mockProjects: Project[] = [
                {
                    projectId: '1',
                    projectName: 'E-commerce Platform',
                    description: 'A modern e-commerce platform with advanced features',
                    role: 'Owner',
                    sessions: [{}, {}, {}],
                    artifacts: 15,
                    updatedAt: '2024-01-15',
                    bgClass: 'bg-primary',
                    iconClass: 'bi-cart',
                    badgeClass: 'badge-success',
                },
                {
                    projectId: '2',
                    projectName: 'Mobile App Development',
                    description: 'Cross-platform mobile application',
                    role: 'Member',
                    sessions: [{}, {}],
                    artifacts: 8,
                    updatedAt: '2024-01-10',
                    bgClass: 'bg-success',
                    iconClass: 'bi-phone',
                    badgeClass: 'badge-info',
                },
                {
                    projectId: '3',
                    projectName: 'Data Analytics Dashboard',
                    description: 'Real-time analytics and reporting system',
                    role: 'Admin',
                    sessions: [{}, {}, {}, {}],
                    artifacts: 22,
                    updatedAt: '2024-01-12',
                    bgClass: 'bg-warning',
                    iconClass: 'bi-graph-up',
                    badgeClass: 'badge-warning',
                },
            ];

            return mockProjects;
        } finally {
            setLoading(false);
        }
    }, []);

    const getSessions = useCallback(async (): Promise<Session[]> => {
        setLoading(true);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const mockSessions: Session[] = [
                {
                    _id: 'session-001',
                    description: 'Initial project planning and requirements gathering',
                    status: 'Completed',
                    duration: '2 hours',
                    artifacts: [{}, {}],
                    createdAt: '2024-01-15T10:00:00Z',
                    bgClass: 'bg-success',
                    iconClass: 'bi-check-circle',
                    badgeClass: 'badge-success',
                },
                {
                    _id: 'session-002',
                    description: 'Technical architecture review and discussion',
                    status: 'In Progress',
                    duration: '1.5 hours',
                    artifacts: [{}],
                    createdAt: '2024-01-16T14:30:00Z',
                    bgClass: 'bg-warning',
                    iconClass: 'bi-clock',
                    badgeClass: 'badge-warning',
                },
                {
                    _id: 'session-003',
                    description: 'User interface mockup review and feedback session',
                    status: 'Pending',
                    duration: '1 hour',
                    artifacts: [{}],
                    createdAt: '2024-01-17T09:00:00Z',
                    bgClass: 'bg-info',
                    iconClass: 'bi-pending',
                    badgeClass: 'badge-info',
                },
            ];

            return mockSessions;
        } finally {
            setLoading(false);
        }
    }, []);

    const getArtifacts = useCallback(async (): Promise<Artifact[]> => {
        setLoading(true);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const mockArtifacts: Artifact[] = [
                {
                    _id: 'artifact-001',
                    captureName: 'Project Requirements Document',
                    processedText: 'Comprehensive requirements document outlining all project specifications...',
                    captureType: 'Document',
                    createdAt: '2024-01-15T10:00:00Z',
                    bgClass: 'bg-primary',
                    iconClass: 'bi-file-text',
                    badgeClass: 'badge-primary',
                    createdBy: 'John Doe',
                },
                {
                    _id: 'artifact-002',
                    captureName: 'Technical Architecture Diagram',
                    processedText: 'System architecture diagram showing component relationships...',
                    captureType: 'Image',
                    createdAt: '2024-01-16T14:30:00Z',
                    bgClass: 'bg-success',
                    iconClass: 'bi-diagram-3',
                    badgeClass: 'badge-success',
                    createdBy: 'Jane Smith',
                },
                {
                    _id: 'artifact-003',
                    captureName: 'User Interface Mockups',
                    processedText: 'Wireframes and mockups for the mobile application...',
                    captureType: 'Design',
                    createdAt: '2024-01-17T09:00:00Z',
                    bgClass: 'bg-warning',
                    iconClass: 'bi-palette',
                    badgeClass: 'badge-warning',
                    createdBy: 'Bob Johnson',
                },
                {
                    _id: 'artifact-004',
                    captureName: 'API Documentation',
                    processedText: 'Comprehensive API documentation with endpoints and examples...',
                    captureType: 'Document',
                    createdAt: '2024-01-18T11:20:00Z',
                    bgClass: 'bg-info',
                    iconClass: 'bi-code-slash',
                    badgeClass: 'badge-info',
                    createdBy: 'Alice Brown',
                },
            ];

            return mockArtifacts;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        getProjects,
        getSessions,
        getArtifacts,
        loading,
    };
} 