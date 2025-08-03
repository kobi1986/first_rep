const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configure multer for file uploads
const upload = multer({ 
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        // Accept text files, JSON, CSV, and common document formats
        const allowedTypes = /txt|json|csv|md/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'text/plain';
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only text files (txt, json, csv, md) are allowed!'));
        }
    }
});

// JIRA API configuration
const jiraConfig = {
    baseURL: process.env.JIRA_BASE_URL,
    email: process.env.JIRA_EMAIL,
    apiToken: process.env.JIRA_API_TOKEN
};

// Helper function to create JIRA auth header
function getJiraAuthHeader() {
    const auth = Buffer.from(`${jiraConfig.email}:${jiraConfig.apiToken}`).toString('base64');
    return `Basic ${auth}`;
}

// Helper function to parse user stories from file content
function parseUserStories(content, fileExtension) {
    const stories = [];
    
    switch (fileExtension) {
        case '.json':
            try {
                const jsonData = JSON.parse(content);
                if (Array.isArray(jsonData)) {
                    return jsonData.map(story => ({
                        title: story.title || story.summary || 'Untitled Story',
                        description: story.description || story.details || '',
                        acceptanceCriteria: story.acceptanceCriteria || story.acceptance || ''
                    }));
                } else if (jsonData.stories && Array.isArray(jsonData.stories)) {
                    return jsonData.stories.map(story => ({
                        title: story.title || story.summary || 'Untitled Story',
                        description: story.description || story.details || '',
                        acceptanceCriteria: story.acceptanceCriteria || story.acceptance || ''
                    }));
                }
            } catch (e) {
                throw new Error('Invalid JSON format');
            }
            break;
            
        case '.csv':
            const lines = content.split('\n').filter(line => line.trim());
            if (lines.length < 2) throw new Error('CSV must have header and at least one data row');
            
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const titleIndex = headers.findIndex(h => h.includes('title') || h.includes('summary'));
            const descIndex = headers.findIndex(h => h.includes('description') || h.includes('detail'));
            const acIndex = headers.findIndex(h => h.includes('acceptance') || h.includes('criteria'));
            
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim());
                if (cols.length >= Math.max(titleIndex + 1, descIndex + 1)) {
                    stories.push({
                        title: cols[titleIndex] || `Story ${i}`,
                        description: cols[descIndex] || '',
                        acceptanceCriteria: cols[acIndex] || ''
                    });
                }
            }
            break;
            
        default: // .txt, .md or other text formats
            // Split by empty lines or common story separators
            const sections = content.split(/\n\s*\n|\n---+\n|\n===+\n/).filter(s => s.trim());
            
            sections.forEach((section, index) => {
                const lines = section.trim().split('\n');
                let title = `Story ${index + 1}`;
                let description = '';
                let acceptanceCriteria = '';
                
                // Try to extract title from first line
                if (lines.length > 0) {
                    const firstLine = lines[0].trim();
                    if (firstLine.startsWith('#') || firstLine.startsWith('Title:') || firstLine.startsWith('Story:')) {
                        title = firstLine.replace(/^#+\s*|^Title:\s*|^Story:\s*/i, '').trim();
                        lines.shift();
                    } else if (firstLine.length < 100) {
                        title = firstLine;
                        lines.shift();
                    }
                }
                
                // Split remaining content into description and acceptance criteria
                const content = lines.join('\n').trim();
                const acMatch = content.match(/(?:acceptance criteria|ac):?\s*(.*?)$/ims);
                if (acMatch) {
                    acceptanceCriteria = acMatch[1].trim();
                    description = content.replace(/(?:acceptance criteria|ac):?\s*.*$/ims, '').trim();
                } else {
                    description = content;
                }
                
                if (title || description) {
                    stories.push({ title, description, acceptanceCriteria });
                }
            });
            break;
    }
    
    return stories;
}

// API Routes

// Get JIRA projects
app.get('/api/projects', async (req, res) => {
    try {
        const response = await axios.get(`${jiraConfig.baseURL}/rest/api/3/project`, {
            headers: {
                'Authorization': getJiraAuthHeader(),
                'Accept': 'application/json'
            }
        });
        
        const projects = response.data.map(project => ({
            id: project.id,
            key: project.key,
            name: project.name
        }));
        
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch JIRA projects', details: error.response?.data || error.message });
    }
});

// Get JIRA epics for a project
app.get('/api/projects/:projectKey/epics', async (req, res) => {
    try {
        const { projectKey } = req.params;
        
        const response = await axios.post(`${jiraConfig.baseURL}/rest/api/3/search`, {
            jql: `project = ${projectKey} AND issuetype = Epic`,
            fields: ['summary', 'key', 'status']
        }, {
            headers: {
                'Authorization': getJiraAuthHeader(),
                'Content-Type': 'application/json'
            }
        });
        
        const epics = response.data.issues.map(epic => ({
            id: epic.id,
            key: epic.key,
            summary: epic.fields.summary,
            status: epic.fields.status.name
        }));
        
        res.json(epics);
    } catch (error) {
        console.error('Error fetching epics:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch JIRA epics', details: error.response?.data || error.message });
    }
});

// Parse user stories from uploaded file
app.post('/api/parse-stories', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const fileContent = fs.readFileSync(req.file.path, 'utf8');
        const fileExtension = path.extname(req.file.originalname).toLowerCase();
        
        const stories = parseUserStories(fileContent, fileExtension);
        
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        
        res.json({ stories, count: stories.length });
    } catch (error) {
        console.error('Error parsing stories:', error.message);
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(400).json({ error: 'Failed to parse user stories', details: error.message });
    }
});

// Create user stories in JIRA
app.post('/api/create-stories', async (req, res) => {
    try {
        const { stories, projectKey, epicKey } = req.body;
        
        if (!stories || !Array.isArray(stories) || stories.length === 0) {
            return res.status(400).json({ error: 'No stories provided' });
        }
        
        if (!projectKey) {
            return res.status(400).json({ error: 'Project key is required' });
        }
        
        const results = [];
        const errors = [];
        
        // Get project details to find the Story issue type
        const projectResponse = await axios.get(`${jiraConfig.baseURL}/rest/api/3/project/${projectKey}`, {
            headers: {
                'Authorization': getJiraAuthHeader(),
                'Accept': 'application/json'
            }
        });
        
        // Find the Story issue type ID
        const storyIssueType = projectResponse.data.issueTypes.find(type => 
            type.name.toLowerCase() === 'story' || type.name.toLowerCase() === 'user story'
        );
        
        if (!storyIssueType) {
            return res.status(400).json({ error: 'Story issue type not found in project' });
        }
        
        for (const story of stories) {
            try {
                const issueData = {
                    fields: {
                        project: { key: projectKey },
                        summary: story.title,
                        description: {
                            type: 'doc',
                            version: 1,
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            text: story.description || 'No description provided',
                                            type: 'text'
                                        }
                                    ]
                                }
                            ]
                        },
                        issuetype: { id: storyIssueType.id }
                    }
                };
                
                // Add epic link if provided
                if (epicKey) {
                    issueData.fields.parent = { key: epicKey };
                }
                
                // Add acceptance criteria as a comment if provided
                const createResponse = await axios.post(`${jiraConfig.baseURL}/rest/api/3/issue`, issueData, {
                    headers: {
                        'Authorization': getJiraAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                });
                
                const createdIssue = createResponse.data;
                
                // Add acceptance criteria as comment if provided
                if (story.acceptanceCriteria && story.acceptanceCriteria.trim()) {
                    await axios.post(`${jiraConfig.baseURL}/rest/api/3/issue/${createdIssue.key}/comment`, {
                        body: {
                            type: 'doc',
                            version: 1,
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            text: 'Acceptance Criteria:',
                                            type: 'text',
                                            marks: [{ type: 'strong' }]
                                        }
                                    ]
                                },
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            text: story.acceptanceCriteria,
                                            type: 'text'
                                        }
                                    ]
                                }
                            ]
                        }
                    }, {
                        headers: {
                            'Authorization': getJiraAuthHeader(),
                            'Content-Type': 'application/json'
                        }
                    });
                }
                
                results.push({
                    title: story.title,
                    key: createdIssue.key,
                    url: `${jiraConfig.baseURL}/browse/${createdIssue.key}`,
                    success: true
                });
                
            } catch (error) {
                console.error(`Error creating story "${story.title}":`, error.response?.data || error.message);
                errors.push({
                    title: story.title,
                    error: error.response?.data?.errors || error.message,
                    success: false
                });
            }
        }
        
        res.json({ 
            results, 
            errors, 
            total: stories.length, 
            successful: results.length, 
            failed: errors.length 
        });
        
    } catch (error) {
        console.error('Error creating stories:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to create user stories', details: error.response?.data || error.message });
    }
});

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Make sure to update the .env file with your JIRA configuration');
});