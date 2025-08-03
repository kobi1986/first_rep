class JiraStoryCreator {
    constructor() {
        this.currentStories = [];
        this.currentFile = null;
        this.projects = [];
        this.epics = [];
        this.initializeEventListeners();
        this.loadProjects();
    }

    initializeEventListeners() {
        // File upload listeners
        const fileUploadArea = document.getElementById('fileUploadArea');
        const fileInput = document.getElementById('fileInput');
        
        fileUploadArea.addEventListener('click', () => fileInput.click());
        fileUploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        fileUploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        fileUploadArea.addEventListener('drop', this.handleFileDrop.bind(this));
        
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        // Button listeners
        document.getElementById('parseBtn').addEventListener('click', this.parseStories.bind(this));
        document.getElementById('changeFile').addEventListener('click', this.changeFile.bind(this));
        document.getElementById('editStoriesBtn').addEventListener('click', this.openStoryEditor.bind(this));
        document.getElementById('nextToJiraBtn').addEventListener('click', this.showJiraStep.bind(this));
        document.getElementById('createStoriesBtn').addEventListener('click', this.createStoriesInJira.bind(this));
        document.getElementById('startOverBtn').addEventListener('click', this.startOver.bind(this));
        
        // Project selection
        document.getElementById('projectSelect').addEventListener('change', this.onProjectChange.bind(this));
        
        // Modal listeners
        document.getElementById('closeModal').addEventListener('click', this.closeModal.bind(this));
        document.getElementById('cancelEdit').addEventListener('click', this.closeModal.bind(this));
        document.getElementById('saveEdit').addEventListener('click', this.saveStoryEdits.bind(this));
        
        // Close modal on outside click
        document.getElementById('storyEditorModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });
    }

    // File handling methods
    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('fileUploadArea').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('fileUploadArea').classList.remove('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        document.getElementById('fileUploadArea').classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    handleFile(file) {
        const allowedTypes = ['text/plain', 'application/json', 'text/csv', 'text/markdown'];
        const allowedExtensions = ['.txt', '.json', '.csv', '.md'];
        
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
            this.showError('Please select a valid file type (.txt, .json, .csv, .md)');
            return;
        }

        this.currentFile = file;
        this.showFileInfo(file);
        document.getElementById('parseBtn').disabled = false;
    }

    showFileInfo(file) {
        document.getElementById('fileUploadArea').style.display = 'none';
        document.getElementById('fileInfo').style.display = 'flex';
        document.getElementById('fileName').textContent = file.name;
    }

    changeFile() {
        document.getElementById('fileUploadArea').style.display = 'block';
        document.getElementById('fileInfo').style.display = 'none';
        document.getElementById('parseBtn').disabled = true;
        this.currentFile = null;
        document.getElementById('fileInput').value = '';
    }

    // API methods
    async loadProjects() {
        try {
            const response = await fetch('/api/projects');
            if (!response.ok) throw new Error('Failed to load projects');
            
            this.projects = await response.json();
            this.populateProjectSelect();
        } catch (error) {
            console.error('Error loading projects:', error);
            this.showError('Failed to load JIRA projects. Please check your configuration.');
        }
    }

    populateProjectSelect() {
        const select = document.getElementById('projectSelect');
        select.innerHTML = '<option value="">Select a project</option>';
        
        this.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.key;
            option.textContent = `${project.name} (${project.key})`;
            select.appendChild(option);
        });
    }

    async onProjectChange() {
        const projectKey = document.getElementById('projectSelect').value;
        const epicSelect = document.getElementById('epicSelect');
        const createBtn = document.getElementById('createStoriesBtn');
        
        if (!projectKey) {
            epicSelect.innerHTML = '<option value="">Select a project first</option>';
            createBtn.disabled = true;
            return;
        }

        try {
            epicSelect.innerHTML = '<option value="">Loading epics...</option>';
            
            const response = await fetch(`/api/projects/${projectKey}/epics`);
            if (!response.ok) throw new Error('Failed to load epics');
            
            this.epics = await response.json();
            
            epicSelect.innerHTML = '<option value="">No epic (optional)</option>';
            this.epics.forEach(epic => {
                const option = document.createElement('option');
                option.value = epic.key;
                option.textContent = `${epic.summary} (${epic.key})`;
                epicSelect.appendChild(option);
            });
            
            createBtn.disabled = false;
        } catch (error) {
            console.error('Error loading epics:', error);
            epicSelect.innerHTML = '<option value="">Failed to load epics</option>';
            createBtn.disabled = true;
        }
    }

    async parseStories() {
        if (!this.currentFile) return;

        const formData = new FormData();
        formData.append('file', this.currentFile);

        this.showLoading('Parsing user stories...');

        try {
            const response = await fetch('/api/parse-stories', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.details || error.error || 'Failed to parse stories');
            }

            const result = await response.json();
            this.currentStories = result.stories;
            this.showStoriesPreview();
        } catch (error) {
            console.error('Error parsing stories:', error);
            this.showError(`Failed to parse stories: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    showStoriesPreview() {
        document.getElementById('step2').style.display = 'block';
        document.getElementById('storiesCount').textContent = `${this.currentStories.length} stories found`;
        
        const preview = document.getElementById('storiesPreview');
        preview.innerHTML = '';

        if (this.currentStories.length === 0) {
            preview.innerHTML = '<p class="text-muted">No user stories found in the file.</p>';
            return;
        }

        this.currentStories.forEach((story, index) => {
            const storyDiv = document.createElement('div');
            storyDiv.className = 'story-preview';
            storyDiv.innerHTML = `
                <h3>${story.title}</h3>
                <p><strong>Description:</strong> ${story.description || 'No description'}</p>
                ${story.acceptanceCriteria ? `<div class="acceptance-criteria"><strong>Acceptance Criteria:</strong> ${story.acceptanceCriteria}</div>` : ''}
            `;
            preview.appendChild(storyDiv);
        });
    }

    showJiraStep() {
        document.getElementById('step3').style.display = 'block';
    }

    async createStoriesInJira() {
        const projectKey = document.getElementById('projectSelect').value;
        const epicKey = document.getElementById('epicSelect').value;

        if (!projectKey) {
            this.showError('Please select a JIRA project');
            return;
        }

        if (this.currentStories.length === 0) {
            this.showError('No stories to create');
            return;
        }

        this.showLoading('Creating user stories in JIRA...');

        try {
            const response = await fetch('/api/create-stories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    stories: this.currentStories,
                    projectKey: projectKey,
                    epicKey: epicKey || null
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.details || error.error || 'Failed to create stories');
            }

            const result = await response.json();
            this.showResults(result);
        } catch (error) {
            console.error('Error creating stories:', error);
            this.showError(`Failed to create stories: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    showResults(result) {
        document.getElementById('step4').style.display = 'block';
        
        // Show summary
        const summary = document.getElementById('resultsSummary');
        summary.innerHTML = `
            <div class="result-stat">
                <div class="number">${result.total}</div>
                <div class="label">Total</div>
            </div>
            <div class="result-stat">
                <div class="number text-success">${result.successful}</div>
                <div class="label">Successful</div>
            </div>
            <div class="result-stat">
                <div class="number text-error">${result.failed}</div>
                <div class="label">Failed</div>
            </div>
        `;

        // Show details
        const details = document.getElementById('resultsDetails');
        details.innerHTML = '';

        // Show successful stories
        result.results.forEach(item => {
            const div = document.createElement('div');
            div.className = 'result-item success';
            div.innerHTML = `
                <h4><i class="fas fa-check-circle text-success"></i> ${item.title}</h4>
                <p>Created as <a href="${item.url}" target="_blank">${item.key}</a></p>
            `;
            details.appendChild(div);
        });

        // Show failed stories
        result.errors.forEach(item => {
            const div = document.createElement('div');
            div.className = 'result-item error';
            div.innerHTML = `
                <h4><i class="fas fa-times-circle text-error"></i> ${item.title}</h4>
                <p class="text-error">${typeof item.error === 'object' ? JSON.stringify(item.error) : item.error}</p>
            `;
            details.appendChild(div);
        });
    }

    // Story editor methods
    openStoryEditor() {
        const modal = document.getElementById('storyEditorModal');
        const body = document.getElementById('storyEditorBody');
        
        body.innerHTML = '';
        
        this.currentStories.forEach((story, index) => {
            const storyEditor = document.createElement('div');
            storyEditor.className = 'story-editor';
            storyEditor.innerHTML = `
                <div class="story-editor-header">
                    <span>Story ${index + 1}</span>
                    <button class="delete-story" onclick="app.deleteStory(${index})">Delete</button>
                </div>
                <div class="story-editor-content">
                    <input type="text" placeholder="Story Title" value="${story.title}" data-field="title" data-index="${index}">
                    <textarea placeholder="Description" data-field="description" data-index="${index}">${story.description}</textarea>
                    <textarea placeholder="Acceptance Criteria" data-field="acceptanceCriteria" data-index="${index}">${story.acceptanceCriteria}</textarea>
                </div>
            `;
            body.appendChild(storyEditor);
        });

        // Add new story button
        const addButton = document.createElement('button');
        addButton.className = 'btn-secondary';
        addButton.textContent = 'Add New Story';
        addButton.onclick = () => this.addNewStory();
        body.appendChild(addButton);

        modal.style.display = 'flex';
    }

    deleteStory(index) {
        if (confirm('Are you sure you want to delete this story?')) {
            this.currentStories.splice(index, 1);
            this.openStoryEditor(); // Refresh the editor
        }
    }

    addNewStory() {
        this.currentStories.push({
            title: 'New Story',
            description: '',
            acceptanceCriteria: ''
        });
        this.openStoryEditor(); // Refresh the editor
    }

    saveStoryEdits() {
        const inputs = document.querySelectorAll('#storyEditorBody input, #storyEditorBody textarea');
        
        inputs.forEach(input => {
            const index = parseInt(input.dataset.index);
            const field = input.dataset.field;
            if (this.currentStories[index]) {
                this.currentStories[index][field] = input.value;
            }
        });

        this.closeModal();
        this.showStoriesPreview(); // Refresh the preview
    }

    closeModal() {
        document.getElementById('storyEditorModal').style.display = 'none';
    }

    // Utility methods
    showLoading(text) {
        document.getElementById('loadingText').textContent = text;
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showError(message) {
        alert(message); // In a real app, you might want a nicer error display
    }

    startOver() {
        // Reset everything
        this.currentStories = [];
        this.currentFile = null;
        
        // Reset UI
        document.getElementById('step2').style.display = 'none';
        document.getElementById('step3').style.display = 'none';
        document.getElementById('step4').style.display = 'none';
        
        this.changeFile();
        
        // Reset forms
        document.getElementById('projectSelect').value = '';
        document.getElementById('epicSelect').innerHTML = '<option value="">Select a project first</option>';
        document.getElementById('createStoriesBtn').disabled = true;
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
}

// Initialize the application
const app = new JiraStoryCreator();