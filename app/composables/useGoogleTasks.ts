export const useGoogleTasks = () => {
  const config = useRuntimeConfig();
  const isAuthenticated = useState('google_tasks_auth', () => false);
  const accessToken = useState<string | null>('google_tasks_token', () => null);

  // Initialize Google Tasks API
  const initGoogleTasksApi = () => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      document.head.appendChild(script);
    });
  };

  // Sign in with Google
  const signIn = async () => {
    await initGoogleTasksApi();

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return reject('No window');

      const client = (window as any).google?.accounts.oauth2.initTokenClient({
        client_id: config.public.googleClientId,
        scope: 'https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/tasks.readonly',
        callback: (response: any) => {
          if (response.access_token) {
            accessToken.value = response.access_token;
            isAuthenticated.value = true;
            
            // Store token with expiry
            const expiryTime = new Date().getTime() + (response.expires_in * 1000);
            localStorage.setItem('google_tasks_token', response.access_token);
            localStorage.setItem('google_tasks_token_expiry', expiryTime.toString());
            
            resolve(response);
          } else {
            reject('No access token received');
          }
        },
        error_callback: (error: any) => {
          console.error('Google Tasks OAuth Error:', error);
          reject(error);
        }
      });

      client.requestAccessToken();
    });
  };

  // Sign out
  const signOut = () => {
    const tokenToRevoke = accessToken.value;
    
    accessToken.value = null;
    isAuthenticated.value = false;
    localStorage.removeItem('google_tasks_token');
    localStorage.removeItem('google_tasks_token_expiry');
    
    // Try to revoke token (may fail if already invalid)
    if (typeof window !== 'undefined' && (window as any).google && tokenToRevoke) {
      try {
        (window as any).google.accounts.oauth2.revoke(tokenToRevoke, () => {
          console.log('Tasks token revoked');
        });
      } catch (err) {
        // Ignore revoke errors
        console.log('Token revoke failed (already invalid)');
      }
    }
  };

  // Restore token from localStorage
  const restoreToken = async () => {
    if (typeof window === 'undefined') return false;

    const storedToken = localStorage.getItem('google_tasks_token');
    const expiryTime = localStorage.getItem('google_tasks_token_expiry');

    if (storedToken && expiryTime) {
      const now = new Date().getTime();
      if (now < parseInt(expiryTime)) {
        accessToken.value = storedToken;
        isAuthenticated.value = true;
        return true;
      } else {
        // Token expired, clear it
        localStorage.removeItem('google_tasks_token');
        localStorage.removeItem('google_tasks_token_expiry');
      }
    }
    return false;
  };

  // Fetch all task lists
  const fetchTaskLists = async () => {
    if (!accessToken.value) throw new Error('Not authenticated');

    const response = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      headers: {
        Authorization: `Bearer ${accessToken.value}`
      }
    });

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        // Token invalid or expired, clear it
        signOut();
        throw new Error('AUTH_ERROR');
      }
      throw new Error(`Failed to fetch task lists: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  };

  // Fetch tasks from a specific list
  const fetchTasks = async (taskListId: string, showCompleted: boolean = false) => {
    if (!accessToken.value) throw new Error('Not authenticated');

    const url = new URL(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`);
    url.searchParams.append('showCompleted', showCompleted.toString());
    url.searchParams.append('showHidden', 'false');

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken.value}`
      }
    });

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        signOut();
        throw new Error('AUTH_ERROR');
      }
      throw new Error(`Failed to fetch tasks: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  };

  // Fetch all tasks from all lists
  const fetchAllTasks = async (showCompleted: boolean = false) => {
    const lists = await fetchTaskLists();
    const allTasks: any[] = [];

    for (const list of lists) {
      const tasks = await fetchTasks(list.id, showCompleted);
      const tasksWithList = tasks.map((task: any) => ({
        ...task,
        listId: list.id,
        listTitle: list.title
      }));
      allTasks.push(...tasksWithList);
    }

    return allTasks;
  };

  // Create a new task
  const createTask = async (taskListId: string, task: {
    title: string;
    notes?: string;
    due?: string;
  }) => {
    if (!accessToken.value) throw new Error('Not authenticated');

    const response = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(task)
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create task');
    }

    return await response.json();
  };

  // Update a task
  const updateTask = async (taskListId: string, taskId: string, updates: any) => {
    if (!accessToken.value) throw new Error('Not authenticated');

    const response = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update task');
    }

    return await response.json();
  };

  // Complete a task
  const completeTask = async (taskListId: string, taskId: string) => {
    return await updateTask(taskListId, taskId, {
      status: 'completed'
    });
  };

  // Uncomplete a task
  const uncompleteTask = async (taskListId: string, taskId: string) => {
    return await updateTask(taskListId, taskId, {
      status: 'needsAction',
      completed: null
    });
  };

  // Delete a task
  const deleteTask = async (taskListId: string, taskId: string) => {
    if (!accessToken.value) throw new Error('Not authenticated');

    const response = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken.value}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete task');
    }

    return true;
  };

  // Move task to different list
  const moveTask = async (sourceListId: string, taskId: string, targetListId: string) => {
    if (!accessToken.value) throw new Error('Not authenticated');

    const response = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${sourceListId}/tasks/${taskId}/move?destinationTasklist=${targetListId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken.value}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to move task');
    }

    return await response.json();
  };

  // Create a new task list
  const createTaskList = async (title: string) => {
    if (!accessToken.value) throw new Error('Not authenticated');

    const response = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });

    if (!response.ok) {
      throw new Error('Failed to create task list');
    }

    return await response.json();
  };

  // Delete a task list
  const deleteTaskList = async (taskListId: string) => {
    if (!accessToken.value) throw new Error('Not authenticated');

    const response = await fetch(
      `https://tasks.googleapis.com/tasks/v1/users/@me/lists/${taskListId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken.value}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete task list');
    }

    return true;
  };

  return {
    isAuthenticated,
    accessToken,
    signIn,
    signOut,
    restoreToken,
    fetchTaskLists,
    fetchTasks,
    fetchAllTasks,
    createTask,
    updateTask,
    completeTask,
    uncompleteTask,
    deleteTask,
    moveTask,
    createTaskList,
    deleteTaskList
  };
};
