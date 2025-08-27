import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { ApiClient } from '../lib/api';

export interface ProjectContext {
    projectId?: string;
    projectName?: string;
    sessionId?: string;
    sessionName?: string;
    isProjectPage: boolean;
    isSessionPage: boolean;
}

export function useProjectContext(): ProjectContext {
    const params = useParams();
    const pathname = usePathname();
    const [projectContext, setProjectContext] = useState<ProjectContext>({
        isProjectPage: false,
        isSessionPage: false,
    });

    useEffect(() => {
        console.log('useProjectContext: pathname:', pathname);
        console.log('useProjectContext: params:', params);
        console.log('useProjectContext: pathname.includes("/projects/"):', pathname.includes('/projects/'));
        console.log('useProjectContext: pathname.includes("/sessions/"):', pathname.includes('/sessions/'));
        console.log('useProjectContext: params.projectId:', params.projectId);
        console.log('useProjectContext: params.sessionId:', params.sessionId);

        const fetchContext = async () => {
            // Extract projectId from URL if params are not available
            let extractedProjectId = params.projectId;
            if (!extractedProjectId && pathname.includes('/projects/')) {
                // Fallback: extract projectId from URL path
                const pathParts = pathname.split('/');
                const projectIndex = pathParts.findIndex(part => part === 'projects');
                if (projectIndex !== -1 && projectIndex + 1 < pathParts.length) {
                    extractedProjectId = pathParts[projectIndex + 1];
                    console.log('useProjectContext: Extracted projectId from URL path:', extractedProjectId);
                }
            }

            // Extract sessionId from URL if params are not available
            let extractedSessionId = params.sessionId;
            if (!extractedSessionId && pathname.includes('/sessions/')) {
                // Fallback: extract sessionId from URL path
                const pathParts = pathname.split('/');
                const sessionIndex = pathParts.findIndex(part => part === 'sessions');
                if (sessionIndex !== -1 && sessionIndex + 1 < pathParts.length) {
                    extractedSessionId = pathParts[sessionIndex + 1];
                    console.log('useProjectContext: Extracted sessionId from URL path:', extractedSessionId);
                }
            }

            // Check if we're on a project-specific page
            if (pathname.includes('/projects/') && extractedProjectId) {
                console.log('useProjectContext: Found project page with ID:', extractedProjectId);
                try {
                    const project = await ApiClient.get(`/projects/${extractedProjectId}`) as any;
                    console.log('useProjectContext: Project data fetched:', project);
                    setProjectContext({
                        projectId: extractedProjectId as string,
                        projectName: project?.name || project?.projectName || 'Current Project',
                        isProjectPage: true,
                        isSessionPage: false,
                    });
                } catch (error) {
                    console.error('useProjectContext: Failed to fetch project details:', error);
                    setProjectContext({
                        projectId: extractedProjectId as string,
                        projectName: 'Current Project',
                        isProjectPage: true,
                        isSessionPage: false,
                    });
                }
            } else if (pathname.includes('/sessions/') && extractedSessionId) {
                console.log('useProjectContext: Found session page with ID:', extractedSessionId);
                try {
                    console.log('useProjectContext: Sessions are stored within projects, need to find the containing project');

                    // For now, set the session context immediately and try to find the project in the background
                    // This ensures the UI works even if project lookup fails
                    setProjectContext({
                        projectId: undefined,
                        projectName: undefined,
                        sessionId: extractedSessionId as string,
                        sessionName: 'Current Session',
                        isProjectPage: false,
                        isSessionPage: true,
                    });

                    // Try to find the project in the background (non-blocking)
                    const findProjectForSession = async () => {
                        try {
                            // Get all projects for the current user
                            const projects = await ApiClient.get('/projects') as any[];
                            console.log('useProjectContext: Found projects:', projects);

                            // Try to find the session directly first (more efficient)
                            try {
                                console.log('useProjectContext: Trying to find session directly...');
                                const allSessions = await ApiClient.get('/sessions') as any[];
                                const targetSession = allSessions.find((s: any) => s._id === extractedSessionId);

                                if (targetSession && targetSession.projectId) {
                                    console.log(`useProjectContext: Found session with projectId: ${targetSession.projectId}`);
                                    const project = projects.find((p: any) => p._id === targetSession.projectId);
                                    if (project) {
                                        console.log(`useProjectContext: Found project: ${project.name}`);
                                        // Update context with project info
                                        setProjectContext(prev => ({
                                            ...prev,
                                            projectId: project._id,
                                            projectName: project.name || project.projectName || 'Current Project'
                                        }));
                                        return;
                                    }
                                }
                            } catch (directSessionError) {
                                console.warn('useProjectContext: Failed to fetch sessions directly:', directSessionError);
                            }

                            console.log('useProjectContext: Session not found in any project, but context is already set');
                        } catch (error) {
                            console.error('useProjectContext: Failed to search projects:', error);
                            // Context is already set, so this is not critical
                        }
                    };

                    // Run the search in the background
                    findProjectForSession();
                } catch (error) {
                    console.error('useProjectContext: Failed to fetch session data:', error);
                    setProjectContext({
                        projectId: undefined,
                        projectName: undefined,
                        sessionId: extractedSessionId as string,
                        sessionName: 'Current Session',
                        isProjectPage: false,
                        isSessionPage: true,
                    });
                }
            } else if (pathname.includes('/artifacts/') && params.artifactId) {
                console.log('useProjectContext: Found artifact page with ID:', params.artifactId);
                // For artifacts, we might want to get the project from the artifact's session
                setProjectContext({
                    projectId: 'current', // Placeholder
                    projectName: 'Current Artifact',
                    isProjectPage: false,
                    isSessionPage: false,
                });
            } else {
                console.log('useProjectContext: Not on a project/session/artifact page');
                setProjectContext({
                    isProjectPage: false,
                    isSessionPage: false,
                });
            }
        };

        fetchContext();
    }, [pathname, params]);

    return projectContext;
} 