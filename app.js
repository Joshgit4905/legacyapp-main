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
    alert(message);
}

function showSuccess(message) {
    // Simple success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in-right z-50';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
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
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
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

        // Load tasks table
        loadTasksTable();
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

        showSuccess('Tarea actualizada exitosamente');
        clearTaskForm();
        await loadInitialData();
    } catch (error) {
        hideLoading();
        showError('Error updating task: ' + error.message);
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

function loadTasksTable() {
    const tbody = document.getElementById('tasksTableBody');
    tbody.innerHTML = '';

    allTasks.forEach(task => {
        const project = allProjects.find(p => p.id === task.project_id);
        const user = allUsers.find(u => u.id === task.assigned_to);

        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-50 cursor-pointer transition-colors';
        row.onclick = () => selectTask(task);

        const priorityColors = {
            'Baja': 'text-green-600',
            'Media': 'text-blue-600',
            'Alta': 'text-amber-600',
            'Crítica': 'text-red-600'
        };

        const statusColors = {
            'Pendiente': 'bg-slate-100 text-slate-700',
            'En Progreso': 'bg-blue-100 text-blue-700',
            'Completada': 'bg-green-100 text-green-700',
            'Bloqueada': 'bg-red-100 text-red-700'
        };

        row.innerHTML = `
            <td class="px-6 py-4 text-sm text-slate-900">${task.id}</td>
            <td class="px-6 py-4 text-sm font-medium text-slate-900">${task.title}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColors[task.status] || 'bg-slate-100 text-slate-700'}">
                    ${task.status}
                </span>
            </td>
            <td class="px-6 py-4 text-sm font-medium ${priorityColors[task.priority] || 'text-slate-600'}">${task.priority}</td>
            <td class="px-6 py-4 text-sm text-slate-600">${project ? project.name : 'Sin proyecto'}</td>
            <td class="px-6 py-4 text-sm text-slate-600">${user ? user.username : 'Sin asignar'}</td>
        `;

        tbody.appendChild(row);
    });
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

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;

        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active', 'border-blue-500', 'text-blue-600');
            b.classList.add('border-transparent', 'text-slate-600');
        });
        btn.classList.add('active', 'border-blue-500', 'text-blue-600');
        btn.classList.remove('border-transparent', 'text-slate-600');

        // Show active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(tabName + 'Tab').classList.remove('hidden');

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
            !task.description.toLowerCase().includes(searchText)) {
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

// Check if already logged in
if (authToken) {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    loadInitialData();
}
