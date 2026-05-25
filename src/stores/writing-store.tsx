import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { WritingProject, Fragment, ArticleOutput } from '../types';
import * as api from '../services/api';

interface WritingState {
  projects: WritingProject[];
  activeProjectId: string | null;
  fragments: Fragment[];
  articles: Record<string, ArticleOutput>;
  sidebarOpen: boolean;
  loading: boolean;
}

const initialState: WritingState = {
  projects: [],
  activeProjectId: null,
  fragments: [],
  articles: {},
  sidebarOpen: false,
  loading: true,
};

type Action =
  | { type: 'SET_PROJECTS'; projects: WritingProject[] }
  | { type: 'SET_FRAGMENTS'; fragments: Fragment[] }
  | { type: 'SET_ACTIVE_PROJECT'; id: string | null }
  | { type: 'SAVE_ARTICLE'; projectId: string; article: ArticleOutput }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_LOADING'; loading: boolean };

function reducer(state: WritingState, action: Action): WritingState {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.projects };
    case 'SET_FRAGMENTS':
      return { ...state, fragments: action.fragments };
    case 'SET_ACTIVE_PROJECT':
      return { ...state, activeProjectId: action.id, sidebarOpen: false };
    case 'SAVE_ARTICLE':
      return {
        ...state,
        articles: { ...state.articles, [action.projectId]: action.article },
      };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

interface WritingContextValue {
  state: WritingState;
  dispatch: React.Dispatch<Action>;
  activeProject: WritingProject | undefined;
  projectFragments: Fragment[];
  sortedFragments: Fragment[];
  ProjectActions: {
    addProject: (data: Omit<WritingProject, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
    updateProject: (id: string, updates: Partial<WritingProject>) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    setActiveProject: (id: string | null) => void;
    reloadProjects: () => Promise<void>;
  };
  FragmentActions: {
    addFragment: (data: Omit<Fragment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
    updateFragment: (id: string, updates: Partial<Fragment>) => Promise<void>;
    deleteFragment: (id: string) => Promise<void>;
    reloadFragments: () => Promise<void>;
  };
  ArticleActions: {
    saveArticle: (projectId: string, article: ArticleOutput) => Promise<void>;
  };
}

const WritingContext = createContext<WritingContextValue | null>(null);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function WritingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const activeProject = state.projects.find(p => p.id === state.activeProjectId);
  const projectFragments = state.fragments.filter(f => f.projectId === state.activeProjectId);
  const sortedFragments = [...projectFragments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  useEffect(() => {
    api.projectsApi.list().then(projects => {
      dispatch({ type: 'SET_PROJECTS', projects });
      dispatch({ type: 'SET_FRAGMENTS', fragments: [] });
      dispatch({ type: 'SET_LOADING', loading: false });
      // Auto-activate first project
      if (projects.length > 0) {
        dispatch({ type: 'SET_ACTIVE_PROJECT', id: projects[0].id });
      }
    }).catch(err => {
      console.error('Failed to load projects:', err);
      dispatch({ type: 'SET_LOADING', loading: false });
    });
  }, []);

  useEffect(() => {
    if (!state.activeProjectId) {
      dispatch({ type: 'SET_FRAGMENTS', fragments: [] });
      return;
    }
    // Load fragments
    api.fragmentsApi.listByProject(state.activeProjectId).then(fragments => {
      dispatch({ type: 'SET_FRAGMENTS', fragments });
    }).catch(err => {
      console.error('Failed to load fragments:', err);
    });
    // Load article
    api.articlesApi.get(state.activeProjectId).then(article => {
      if (article) {
        dispatch({ type: 'SAVE_ARTICLE', projectId: state.activeProjectId!, article });
      }
    }).catch(err => {
      console.error('Failed to load article:', err);
    });
  }, [state.activeProjectId]);

  const ProjectActions = {
    addProject: useCallback(async (data: Omit<WritingProject, 'id' | 'createdAt' | 'updatedAt'>) => {
      const id = generateId();
      const now = new Date().toISOString();
      await api.projectsApi.create({ ...data, id, createdAt: now, updatedAt: now } as WritingProject);
      await api.projectsApi.list().then(projects => dispatch({ type: 'SET_PROJECTS', projects }));
      return id;
    }, []),

    updateProject: useCallback(async (id: string, updates: Partial<WritingProject>) => {
      await api.projectsApi.update(id, updates);
      await api.projectsApi.list().then(projects => dispatch({ type: 'SET_PROJECTS', projects }));
    }, []),

    deleteProject: useCallback(async (id: string) => {
      await api.projectsApi.delete(id);
      dispatch({ type: 'SET_ACTIVE_PROJECT', id: null });
      await api.projectsApi.list().then(projects => dispatch({ type: 'SET_PROJECTS', projects }));
    }, []),

    setActiveProject: useCallback((id: string | null) => {
      dispatch({ type: 'SET_ACTIVE_PROJECT', id });
    }, []),

    reloadProjects: useCallback(async () => {
      const projects = await api.projectsApi.list();
      dispatch({ type: 'SET_PROJECTS', projects });
    }, []),
  };

  const FragmentActions = {
    addFragment: useCallback(async (data: Omit<Fragment, 'id' | 'createdAt' | 'updatedAt'>) => {
      const id = generateId();
      const now = new Date().toISOString();
      await api.fragmentsApi.create({ ...data, id, createdAt: now, updatedAt: now } as Fragment);
      if (state.activeProjectId) {
        const fragments = await api.fragmentsApi.listByProject(state.activeProjectId);
        dispatch({ type: 'SET_FRAGMENTS', fragments });
      }
      // 刷新项目列表以更新 fragmentCount
      const projects = await api.projectsApi.list();
      dispatch({ type: 'SET_PROJECTS', projects });
      return id;
    }, [state.activeProjectId]),

    updateFragment: useCallback(async (id: string, updates: Partial<Fragment>) => {
      await api.fragmentsApi.update(id, updates);
      if (state.activeProjectId) {
        const fragments = await api.fragmentsApi.listByProject(state.activeProjectId);
        dispatch({ type: 'SET_FRAGMENTS', fragments });
      }
      // 刷新项目列表以更新 fragmentCount
      const projects = await api.projectsApi.list();
      dispatch({ type: 'SET_PROJECTS', projects });
    }, [state.activeProjectId]),

    deleteFragment: useCallback(async (id: string) => {
      await api.fragmentsApi.delete(id);
      if (state.activeProjectId) {
        const fragments = await api.fragmentsApi.listByProject(state.activeProjectId);
        dispatch({ type: 'SET_FRAGMENTS', fragments });
      }
      // 刷新项目列表以更新 fragmentCount
      const projects = await api.projectsApi.list();
      dispatch({ type: 'SET_PROJECTS', projects });
    }, [state.activeProjectId]),

    reloadFragments: useCallback(async () => {
      if (state.activeProjectId) {
        const fragments = await api.fragmentsApi.listByProject(state.activeProjectId);
        dispatch({ type: 'SET_FRAGMENTS', fragments });
      }
      // 刷新项目列表以更新 fragmentCount
      const projects = await api.projectsApi.list();
      dispatch({ type: 'SET_PROJECTS', projects });
    }, [state.activeProjectId]),
  };

  const ArticleActions = {
    saveArticle: useCallback(async (projectId: string, article: ArticleOutput) => {
      await api.articlesApi.save({ ...article, projectId });
      dispatch({ type: 'SAVE_ARTICLE', projectId, article });
    }, []),
  };

  return (
    <WritingContext.Provider
      value={{
        state,
        dispatch,
        activeProject,
        projectFragments,
        sortedFragments,
        ProjectActions,
        FragmentActions,
        ArticleActions,
      }}
    >
      {children}
    </WritingContext.Provider>
  );
}

export function useWriting() {
  const ctx = useContext(WritingContext);
  if (!ctx) throw new Error('useWriting must be used within WritingProvider');
  return ctx;
}

export { generateId };
