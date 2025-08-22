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

        const fetchContext = async () => {
            // Check if we're on a project-specific page
            if (pathname.includes('/projects/') && params.projectId) {
                console.log('useProjectContext: Found project page with ID:', params.projectId);
                try {
                    const project = await ApiClient.get(`/projects/${params.projectId}`) as any;
                    setProjectContext({
                        projectId: params.projectId as string,
                        projectName: project?.name || project?.projectName || 'Current Project',
                        isProjectPage: true,
                        isSessionPage: false,
                    });
                } catch (error) {
                    console.error('useProjectContext: Failed to fetch project details:', error);
                    setProjectContext({
                        projectId: params.projectId as string,
                        projectName: 'Current Project',
                        isProjectPage: true,
                        isSessionPage: false,
                    });
                }
            } else if (pathname.includes('/sessions/') && params.sessionId) {
                console.log('useProjectContext: Found session page with ID:', params.sessionId);
                try {
                    // Since sessions are stored within projects, we need to find which project contains this session
                    console.log('useProjectContext: Sessions are stored within projects, need to find the containing project');

                    // Search through projects to find which one contains this session
                    const findProjectForSession = async () => {
                        try {
                            // Get all projects for the current user
                            const projects = await ApiClient.get('/projects') as any[];
                            console.log('useProjectContext: Found projects:', projects);

                            // Search for the project that contains this session
                            for (const project of projects) {
                                try {
                                    const projectSessions = await ApiClient.get(`/projects/${project._id}/sessions`) as any[];
                                    console.log(`useProjectContext: Project ${project._id} has ${projectSessions.length} sessions`);

                                    const sessionExists = projectSessions.some((s: any) => s._id === params.sessionId);
                                    if (sessionExists) {
                                        console.log(`useProjectContext: Found session ${params.sessionId} in project ${project._id}`);
                                        return {
                                            projectId: project._id,
                                            projectName: project.name || project.projectName || 'Current Project'
                                        };
                                    }
                                } catch (sessionError) {
                                    console.error(`useProjectContext: Failed to fetch sessions for project ${project._id}:`, sessionError);
                                    continue;
                                }
                            }

                            console.log('useProjectContext: Session not found in any project');
                            return null;
                        } catch (error) {
                            console.error('useProjectContext: Failed to search projects:', error);
                            return null;
                        }
                    };

                    // Find the project and set context
                    findProjectForSession().then(projectInfo => {
                        if (projectInfo) {
                            setProjectContext({
                                projectId: projectInfo.projectId,
                                projectName: projectInfo.projectName,
                                sessionId: params.sessionId as string,
                                sessionName: 'Current Session',
                                isProjectPage: false,
                                isSessionPage: true,
                            });
                        } else {
                            setProjectContext({
                                projectId: undefined,
                                projectName: undefined,
                                sessionId: params.sessionId as string,
                                sessionName: 'Current Session',
                                isProjectPage: false,
                                isSessionPage: true,
                            });
                        }
                    });

                    // Set initial context while searching
                    setProjectContext({
                        projectId: undefined,
                        projectName: undefined,
                        sessionId: params.sessionId as string,
                        sessionName: 'Current Session',
                        isProjectPage: false,
                        isSessionPage: true,
                    });
                } catch (error) {
                    console.error('useProjectContext: Failed to fetch session data:', error);
                    setProjectContext({
                        projectId: undefined,
                        projectName: undefined,
                        sessionId: params.sessionId as string,
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