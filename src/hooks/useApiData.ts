import { useState, useCallback } from 'react';
import { ApiClient } from '../lib/api';
import { Project } from '../types/project';
import { Session } from '../types/session';
import { Artifact } from '../types/artifact';

export function useApiData() {
    const [loading, setLoading] = useState(false);

    const getProjects = useCallback(async (): Promise<Project[]> => {
        setLoading(true);
        try {
            const projects = await ApiClient.get<Project[]>('/projects');
            return projects || [];
        } catch (error) {
            console.error('Error fetching projects:', error);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getSessions = useCallback(async (): Promise<Session[]> => {
        setLoading(true);
        try {
            const sessions = await ApiClient.get<Session[]>('/sessions');
            return sessions || [];
        } catch (error) {
            console.error('Error fetching sessions:', error);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getArtifacts = useCallback(async (): Promise<Artifact[]> => {
        setLoading(true);
        try {
            const artifacts = await ApiClient.get<Artifact[]>('/artifacts');
            return artifacts || [];
        } catch (error) {
            console.error('Error fetching artifacts:', error);
            return [];
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