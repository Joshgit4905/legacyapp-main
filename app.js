// API Configuration
const API_URL = '/api';
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let selectedTaskId = null;
let selectedProjectId = null;
let allTasks = [];
let allProjects = [];
let allUsers = [];

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        logout();
        throw new Error('Session expired');
    }

    if (!response.ok && response.status !== 204) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || 'Request failed');
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-white border-l-4 border-red-500 text-gray-800 px-6 py-4 rounded-xl shadow-2xl z-[2000] flex items-center gap-3 animate-slide-in-right stagger-in';
    notification.innerHTML = `
        <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="text-sm font-medium">${message}</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(20px)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-white border-l-4 border-emerald-500 text-gray-800 px-6 py-4 rounded-xl shadow-2xl z-[2000] flex items-center gap-3 animate-slide-in-right stagger-in';
    notification.innerHTML = `
        <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span class="text-sm font-medium">${message}</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(20px)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3500);
}

// Authentication
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    showLoading();

    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        authToken = data.access_token;
        localStorage.setItem('authToken', authToken);

        // Get current user info
        currentUser = { username };

        // Show dashboard
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('currentUsername').textContent = username;

        // Load initial data
        await loadInitialData();

        hideLoading();
    } catch (error) {
        hideLoading();
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        }
    }
});

document.getElementById('logoutBtn')?.addEventListener('click', logout);

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');

    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
}

// Sidebar Management
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
});

// Load Initial Data
async function loadInitialData() {
    showLoading();

    try {
        // Load all data in parallel
        const [tasks, projects, users] = await Promise.all([
            apiRequest('/tasks'),
            apiRequest('/projects'),
            apiRequest('/users')
        ]);

        allTasks = tasks;
        allProjects = projects;
        allUsers = users;

        // Populate dropdowns
        populateProjectsDropdown();
        populateUsersDropdown();

        // Load tasks board
        loadTasksBoard();
        updateStats();

        hideLoading();
    } catch (error) {
        hideLoading();
        showError('Error loading data: ' + error.message);
    }
}

// Populate Dropdowns
function populateProjectsDropdown() {
    const select = document.getElementById('taskProject');
    select.innerHTML = '<option value="0">Sin proyecto</option>';

    allProjects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        select.appendChild(option);
    });
}

function populateUsersDropdown() {
    const select = document.getElementById('taskAssigned');
    select.innerHTML = '<option value="0">Sin asignar</option>';

    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.username;
        select.appendChild(option);
    });
}

// Tasks Management
document.getElementById('taskForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (selectedTaskId) {
        await updateTask();
    } else {
        await createTask();
    }
});

async function createTask() {
    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        status: document.getElementById('taskStatus').value,
        priority: document.getElementById('taskPriority').value,
        project_id: parseInt(document.getElementById('taskProject').value) || 0,
        assigned_to: parseInt(document.getElementById('taskAssigned').value) || 0,
        due_date: document.getElementById('taskDueDate').value,
        estimated_hours: parseFloat(document.getElementById('taskHours').value) || 0
    };

    showLoading();

    try {
        await apiRequest('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });

        showSuccess('Tarea creada exitosamente');
        clearTaskForm();
        await loadInitialData();
    } catch (error) {
        hideLoading();
        showError('Error creating task: ' + error.message);
    }
}

async function updateTask() {
    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        status: document.getElementById('taskStatus').value,
        priority: document.getElementById('taskPriority').value,
        project_id: parseInt(document.getElementById('taskProject').value) || 0,
        assigned_to: parseInt(document.getElementById('taskAssigned').value) || 0,
        due_date: document.getElementById('taskDueDate').value,
        estimated_hours: parseFloat(document.getElementById('taskHours').value) || 0
    };

    showLoading();

    try {
        await apiRequest(`/tasks/${selectedTaskId}`, {
            method: 'PUT',
            body: JSON.stringify(taskData)
        });

        if (taskData.status === 'Completada') {
            triggerConfetti();
        }

        showSuccess('Tarea actualizada exitosamente');
        clearTaskForm();
        await loadInitialData();
    } catch (error) {
        hideLoading();
        showError('Error updating task: ' + error.message);
    }
}

function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#2563EB', '#10B981', '#FFFFFF']
        });
    }
}

document.getElementById('deleteTaskBtn')?.addEventListener('click', async () => {
    if (!selectedTaskId) return;

    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;

    showLoading();

    try {
        await apiRequest(`/tasks/${selectedTaskId}`, {
            method: 'DELETE'
        });

        showSuccess('Tarea eliminada exitosamente');
        clearTaskForm();
        await loadInitialData();
    } catch (error) {
        hideLoading();
        showError('Error deleting task: ' + error.message);
    }
});

document.getElementById('clearTaskBtn')?.addEventListener('click', clearTaskForm);

function clearTaskForm() {
    document.getElementById('taskForm').reset();
    selectedTaskId = null;

    document.getElementById('updateTaskBtn').classList.add('hidden');
    document.getElementById('deleteTaskBtn').classList.add('hidden');
    document.getElementById('taskForm').querySelector('button[type="submit"]').classList.remove('hidden');
}

function selectTask(task) {
    selectedTaskId = task.id;

    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskStatus').value = task.status;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskProject').value = task.project_id;
    document.getElementById('taskAssigned').value = task.assigned_to;
    document.getElementById('taskDueDate').value = task.due_date || '';
    document.getElementById('taskHours').value = task.estimated_hours || '';

    document.getElementById('updateTaskBtn').classList.remove('hidden');
    document.getElementById('deleteTaskBtn').classList.remove('hidden');
    document.getElementById('taskForm').querySelector('button[type="submit"]').classList.add('hidden');

    // Scroll to form
    document.getElementById('taskForm').scrollIntoView({ behavior: 'smooth' });
}

function loadTasksBoard() {
    const board = document.getElementById('tasksBoard');
    if (!board) return;

    // Clear all columns
    const columns = board.querySelectorAll('.column-tasks');
    columns.forEach(col => col.innerHTML = '');

    allTasks.forEach(task => {
        const project = allProjects.find(p => p.id === task.project_id);
        const col = board.querySelector(`.board-column[data-status="${task.status}"] .column-tasks`);

        if (!col) return;

        const card = document.createElement('div');
        card.className = 'task-card stagger-in';
        card.draggable = true;
        card.dataset.taskId = task.id;

        card.onclick = () => selectTask(task);

        card.ondragstart = (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            setTimeout(() => card.classList.add('dragging'), 0);
        };
        card.ondragend = () => card.classList.remove('dragging');

        const priorityBadges = {
            'Baja': 'badge-low',
            'Media': 'badge-media',
            'Alta': 'badge-alta',
            'Crítica': 'badge-alta'
        };

        card.innerHTML = `
            <div class="task-title">${task.title}</div>
            <div class="task-meta">
                <span class="badge ${priorityBadges[task.priority] || 'badge-low'}">#${task.id}</span>
                <span>${project ? project.name : 'No project'}</span>
            </div>
        `;

        col.appendChild(card);
    });

    // Update counts and setup drop logic
    board.querySelectorAll('.board-column').forEach(col => {
        const status = col.dataset.status;
        const count = allTasks.filter(t => t.status === status).length;
        const countEl = col.querySelector('.count');
        if (countEl) countEl.textContent = count;

        col.ondragover = (e) => {
            e.preventDefault();
            col.classList.add('drop-target');
        };
        col.ondragleave = () => col.classList.remove('drop-target');
        col.ondrop = async (e) => {
            e.preventDefault();
            col.classList.remove('drop-target');
            const taskId = parseInt(e.dataTransfer.getData('text/plain'));
            const newStatus = col.dataset.status;

            const task = allTasks.find(t => t.id === taskId);
            if (task && task.status !== newStatus) {
                await updateTaskStatus(taskId, newStatus);
            }
        };
    });
}

async function updateTaskStatus(taskId, newStatus) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    const taskData = {
        title: task.title,
        description: task.description,
        status: newStatus,
        priority: task.priority,
        project_id: task.project_id,
        assigned_to: task.assigned_to,
        due_date: task.due_date,
        estimated_hours: task.estimated_hours
    };

    showLoading();
    try {
        await apiRequest(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(taskData)
        });

        if (newStatus === 'Completada') triggerConfetti();

        showSuccess(`Estado actualizado a ${newStatus}`);
        await loadInitialData();
    } catch (error) {
        hideLoading();
        showError('Error updating status: ' + error.message);
    }
}

function updateStats() {
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.status === 'Completada').length;
    const pending = allTasks.filter(t => t.status === 'Pendiente').length;
    const highPriority = allTasks.filter(t => t.priority === 'Alta' || t.priority === 'Crítica').length;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statHighPriority').textContent = highPriority;
}

// Projects Management
document.getElementById('projectForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (selectedProjectId) {
        await updateProject();
    } else {
        await createProject();
    }
});

async function createProject() {
    const projectData = {
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDescription').value
    };

    showLoading();

    try {
        await apiRequest('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });

        showSuccess('Proyecto creado exitosamente');
        document.getElementById('projectForm').reset();
        selectedProjectId = null;

        allProjects = await apiRequest('/projects');
        populateProjectsDropdown();
        loadProjectsTable();

        hideLoading();
    } catch (error) {
        hideLoading();
        showError('Error creating project: ' + error.message);
    }
}

async function updateProject() {
    const projectData = {
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDescription').value
    };

    showLoading();

    try {
        await apiRequest(`/projects/${selectedProjectId}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        });

        showSuccess('Proyecto actualizado exitosamente');
        document.getElementById('projectForm').reset();
        selectedProjectId = null;

        document.getElementById('updateProjectBtn').classList.add('hidden');
        document.getElementById('deleteProjectBtn').classList.add('hidden');

        allProjects = await apiRequest('/projects');
        populateProjectsDropdown();
        loadProjectsTable();

        hideLoading();
    } catch (error) {
        hideLoading();
        showError('Error updating project: ' + error.message);
    }
}

document.getElementById('deleteProjectBtn')?.addEventListener('click', async () => {
    if (!selectedProjectId) return;

    if (!confirm('¿Estás seguro de eliminar este proyecto?')) return;

    showLoading();

    try {
        await apiRequest(`/projects/${selectedProjectId}`, {
            method: 'DELETE'
        });

        showSuccess('Proyecto eliminado exitosamente');
        document.getElementById('projectForm').reset();
        selectedProjectId = null;

        document.getElementById('updateProjectBtn').classList.add('hidden');
        document.getElementById('deleteProjectBtn').classList.add('hidden');

        allProjects = await apiRequest('/projects');
        populateProjectsDropdown();
        loadProjectsTable();

        hideLoading();
    } catch (error) {
        hideLoading();
        showError('Error deleting project: ' + error.message);
    }
});

function loadProjectsTable() {
    const tbody = document.getElementById('projectsTableBody');
    tbody.innerHTML = '';

    allProjects.forEach(project => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-50 cursor-pointer transition-colors';
        row.onclick = () => selectProject(project);

        row.innerHTML = `
            <td class="px-6 py-4 text-sm text-slate-900">${project.id}</td>
            <td class="px-6 py-4 text-sm font-medium text-slate-900">${project.name}</td>
            <td class="px-6 py-4 text-sm text-slate-600">${project.description || ''}</td>
        `;

        tbody.appendChild(row);
    });
}

function selectProject(project) {
    selectedProjectId = project.id;

    document.getElementById('projectName').value = project.name;
    document.getElementById('projectDescription').value = project.description || '';

    document.getElementById('updateProjectBtn').classList.remove('hidden');
    document.getElementById('deleteProjectBtn').classList.remove('hidden');
}

// Tab Navigation (Sidebar version)
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        if (!tabName) return;

        // Update active sidebar item
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Show active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        const activeTab = document.getElementById(tabName + 'Tab');
        if (activeTab) {
            activeTab.classList.remove('hidden');
            // Update title in header
            const titleMap = {
                'tasks': 'Tus Tareas',
                'projects': 'Proyectos Disponibles',
                'search': 'Búsqueda Inteligente',
                'reports': 'Reportes y Datos',
                'comments': 'Comunidad y Feedback',
                'history': 'Trazabilidad de cambios',
                'notifications': 'Centro de Notificaciones'
            };
            document.getElementById('viewTitle').textContent = titleMap[tabName] || tabName;
        }

        // Load data for specific tabs
        if (tabName === 'projects') {
            loadProjectsTable();
        }
    });
});

// Search Functionality
document.getElementById('searchBtn')?.addEventListener('click', async () => {
    const searchText = document.getElementById('searchText').value.toLowerCase();
    const status = document.getElementById('searchStatus').value;
    const priority = document.getElementById('searchPriority').value;

    const filtered = allTasks.filter(task => {
        if (searchText && !task.title.toLowerCase().includes(searchText) &&
            !(task.description && task.description.toLowerCase().includes(searchText))) {
            return false;
        }
        if (status && task.status !== status) {
            return false;
        }
        if (priority && task.priority !== priority) {
            return false;
        }
        return true;
    });

    const tbody = document.getElementById('searchTableBody');
    tbody.innerHTML = '';

    filtered.forEach(task => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-50';

        row.innerHTML = `
            <td class="px-6 py-4 text-sm text-slate-900">${task.id}</td>
            <td class="px-6 py-4 text-sm font-medium text-slate-900">${task.title}</td>
            <td class="px-6 py-4 text-sm text-slate-600">${task.status}</td>
            <td class="px-6 py-4 text-sm text-slate-600">${task.priority}</td>
        `;

        tbody.appendChild(row);
    });
});

// Reports
function generateReport(type) {
    let text = `=== REPORTE: ${type.toUpperCase()} ===\n\n`;

    if (type === 'tasks') {
        const statusCount = {};
        allTasks.forEach(task => {
            const status = task.status || 'Pendiente';
            statusCount[status] = (statusCount[status] || 0) + 1;
        });
        Object.keys(statusCount).forEach(status => {
            text += `${status}: ${statusCount[status]} tareas\n`;
        });
    } else if (type === 'projects') {
        allProjects.forEach(project => {
            const count = allTasks.filter(t => t.project_id === project.id).length;
            text += `${project.name}: ${count} tareas\n`;
        });
    }

    document.getElementById('reportArea').textContent = text;
}

function exportCSV() {
    let csv = 'ID,Título,Estado,Prioridad,Proyecto\n';

    allTasks.forEach(task => {
        const project = allProjects.find(p => p.id === task.project_id);
        csv += `${task.id},"${task.title}","${task.status}","${task.priority}","${project ? project.name : 'Sin proyecto'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export_tasks.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    showSuccess('Exportado a export_tasks.csv');
}

// Comments Management
document.getElementById('submitCommentBtn')?.addEventListener('click', async () => {
    const taskId = parseInt(document.getElementById('commentTaskId').value);
    const commentText = document.getElementById('commentText').value;

    if (!taskId || !commentText) {
        showError('Por favor ingresa el ID de la tarea y el comentario');
        return;
    }

    showLoading();

    try {
        await apiRequest('/comments', {
            method: 'POST',
            body: JSON.stringify({
                task_id: taskId,
                comment_text: commentText
            })
        });

        showSuccess('Comentario agregado exitosamente');
        document.getElementById('commentText').value = '';

        // Load comments automatically
        await loadComments(taskId);
    } catch (error) {
        hideLoading();
        showError('Error al agregar comentario: ' + error.message);
    }
});

document.getElementById('loadCommentsBtn')?.addEventListener('click', async () => {
    const taskId = parseInt(document.getElementById('commentTaskId').value);

    if (!taskId) {
        showError('Por favor ingresa el ID de la tarea');
        return;
    }

    await loadComments(taskId);
});

async function loadComments(taskId) {
    showLoading();

    try {
        const comments = await apiRequest(`/comments/${taskId}`);

        const commentsArea = document.getElementById('commentsArea');

        if (comments.length === 0) {
            commentsArea.textContent = 'No hay comentarios para esta tarea.';
        } else {
            let text = '';
            comments.forEach(comment => {
                const user = allUsers.find(u => u.id === comment.user_id);
                text += `Comentario #${comment.id}\n`;
                text += `Usuario: ${user ? user.username : 'Desconocido'}\n`;
                text += `Fecha: ${comment.created_at}\n`;
                text += `Contenido: ${comment.comment_text}\n`;
                text += '---\n\n';
            });
            commentsArea.textContent = text;
        }

        hideLoading();
    } catch (error) {
        hideLoading();
        showError('Error al cargar comentarios: ' + error.message);
    }
}

// History Management
document.getElementById('loadTaskHistoryBtn')?.addEventListener('click', async () => {
    const taskId = parseInt(document.getElementById('historyTaskId').value);

    if (!taskId) {
        showError('Por favor ingresa el ID de la tarea');
        return;
    }

    showLoading();

    try {
        const history = await apiRequest(`/history/${taskId}`);

        const historyArea = document.getElementById('historyArea');

        if (history.length === 0) {
            historyArea.textContent = 'No hay historial para esta tarea.';
        } else {
            let text = `=== HISTORIAL DE TAREA #${taskId} ===\n\n`;
            history.forEach(item => {
                const user = allUsers.find(u => u.id === item.user_id);
                text += `Tarea #${item.task_id} - ${item.action} - ${item.timestamp}\n`;
                text += `  Usuario: ${user ? user.username : 'Desconocido'}\n`;
                text += `  Antes: ${item.old_value || '(vacío)'}\n`;
                text += `  Después: ${item.new_value}\n`;
                text += '---\n';
            });
            historyArea.textContent = text;
        }

        hideLoading();
    } catch (error) {
        hideLoading();
        showError('Error al cargar historial: ' + error.message);
    }
});

document.getElementById('loadAllHistoryBtn')?.addEventListener('click', async () => {
    showLoading();

    try {
        const history = await apiRequest('/history');

        const historyArea = document.getElementById('historyArea');

        if (history.length === 0) {
            historyArea.textContent = 'No hay historial disponible.';
        } else {
            let text = '=== HISTORIAL COMPLETO ===\n\n';
            history.forEach(item => {
                const user = allUsers.find(u => u.id === item.user_id);
                text += `Tarea #${item.task_id} - ${item.action} - ${item.timestamp}\n`;
                text += `  Usuario: ${user ? user.username : 'Desconocido'}\n`;
                text += `  Antes: ${item.old_value || '(vacío)'}\n`;
                text += `  Después: ${item.new_value}\n`;
                text += '---\n';
            });
            historyArea.textContent = text;
        }

        hideLoading();
    } catch (error) {
        hideLoading();
        showError('Error al cargar historial: ' + error.message);
    }
});

// Notifications Management
document.getElementById('loadNotificationsBtn')?.addEventListener('click', async () => {
    await loadNotifications();
});

document.getElementById('markNotificationsReadBtn')?.addEventListener('click', async () => {
    showLoading();

    try {
        await apiRequest('/notifications/read', {
            method: 'PUT'
        });

        showSuccess('Notificaciones marcadas como leídas');

        // Reload notifications
        await loadNotifications();
    } catch (error) {
        hideLoading();
        showError('Error al marcar notificaciones: ' + error.message);
    }
});

async function loadNotifications() {
    showLoading();

    try {
        const notifications = await apiRequest('/notifications');
        const notificationsArea = document.getElementById('notificationsArea');

        if (notifications.length === 0) {
            notificationsArea.innerHTML = `
                <div class="flex flex-col items-center justify-center py-12 text-gray-400">
                    <svg class="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                    </svg>
                    <p class="text-xs font-medium uppercase tracking-widest">Bandeja vacía</p>
                </div>`;
        } else {
            let html = '';
            notifications.forEach(notification => {
                const isNew = !notification.read;
                html += `
                    <div class="p-5 mb-3 rounded-xl border transition-all duration-300 ${isNew ? 'bg-blue-50/50 border-blue-100 shadow-sm' : 'bg-white border-gray-100 opacity-60'}">
                        <div class="flex justify-between items-start gap-4">
                            <div class="flex-1">
                                <p class="text-sm ${isNew ? 'font-semibold text-gray-900' : 'text-gray-600'} leading-relaxed">${notification.message}</p>
                                <p class="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-tighter">${notification.created_at}</p>
                            </div>
                            ${isNew ? '<span class="w-2 h-2 bg-blue-500 rounded-full mt-2 pulse-soft"></span>' : ''}
                        </div>
                    </div>`;
            });
            notificationsArea.innerHTML = html;
        }

        hideLoading();
    } catch (error) {
        hideLoading();
        showError('Error al cargar notificaciones: ' + error.message);
    }
}

// Check if already logged in
if (authToken) {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    loadInitialData();
}

// Scroll Reveal Animations
const createScrollObserver = () => {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Optional: unobserve after revealing
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with scroll-reveal class
    document.querySelectorAll('.scroll-reveal').forEach(el => {
        observer.observe(el);
    });

    return observer;
};

// Initialize scroll reveal when dashboard loads
let scrollObserver = null;

// Create observer after login
const originalLoadInitialData = loadInitialData;
loadInitialData = async function () {
    await originalLoadInitialData();
    // Initialize scroll observer after content loads
    setTimeout(() => {
        if (!scrollObserver) {
            scrollObserver = createScrollObserver();
        }
    }, 100);
};
