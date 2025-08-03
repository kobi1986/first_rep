# JIRA Agent - Project Summary

## What Was Created

A complete local agent system that reads user stories from a text file and automatically creates corresponding epics and stories in JIRA. The solution includes:

### Core Components

1. **`jira_agent.py`** - Main CLI application with commands:
   - `create` - Create epics and stories in JIRA
   - `test` - Test JIRA connection
   - `parse` - Parse and validate user stories
   - `setup` - Interactive configuration wizard

2. **`story_parser.py`** - Intelligent parser that:
   - Reads structured user stories from text files
   - Extracts priorities ([High], [Medium], [Low])
   - Extracts story points ({1}, {2}, {3}, etc.)
   - Groups stories into epics
   - Generates meaningful titles from descriptions

3. **`jira_client.py`** - JIRA API integration that:
   - Authenticates with JIRA using API tokens
   - Creates epics with proper metadata
   - Creates stories linked to epics
   - Handles priorities and story points
   - Includes Python 3.13 compatibility fix

4. **`config_loader.py`** - Configuration management supporting:
   - YAML configuration files
   - Environment variables
   - Configuration validation
   - Flexible settings override

### Supporting Files

- **`user_stories.txt`** - Sample user stories with proper formatting
- **`config.yaml`** - Configuration template
- **`.env.example`** - Environment variables template
- **`requirements.txt`** - Python dependencies
- **`test_agent.py`** - Demonstration script
- **`README.md`** - Comprehensive documentation

## Key Features

### Smart Parsing
- Understands epic structure (`EPIC: Title`)
- Parses user story format with priorities and points
- Handles comments and empty lines
- Generates concise titles from story descriptions

### Flexible Configuration
- YAML files or environment variables
- Credential security (masked in output)
- Validation and helpful error messages
- Easy setup wizard

### JIRA Integration
- Full REST API integration
- Epic and story creation with proper linking
- Priority and story point mapping
- Error handling and retry logic
- Connection testing

### User Experience
- Colorized terminal output
- Verbose and quiet modes
- Dry-run capability
- Progress tracking
- Comprehensive help system

## Usage Examples

### Basic Workflow
```bash
# 1. Setup (interactive)
python jira_agent.py setup

# 2. Test connection
python jira_agent.py test

# 3. Parse and validate stories
python jira_agent.py parse

# 4. Create in JIRA
python jira_agent.py create
```

### Advanced Usage
```bash
# Dry run to see what would be created
python jira_agent.py create --dry-run --verbose

# Use custom files
python jira_agent.py create --config custom.yaml --input-file my-stories.txt

# Parse specific file
python jira_agent.py parse --input-file sprint-1-stories.txt
```

## User Stories Format

The agent uses a simple, intuitive format:

```text
# Comments are supported
EPIC: Epic Name Here
- As a [role], I want to [action] so that [benefit] [Priority] {Story Points}
- As a user, I want to login so that I can access my account [High] {3}
- As an admin, I want to manage users [Medium] {5}

EPIC: Another Epic
- Story without metadata
- Story with priority only [Low]
- Story with points only {8}
```

## Configuration Options

### JIRA Settings
- `server` - JIRA server URL
- `username` - JIRA username (email)
- `api_token` - JIRA API token
- `project_key` - Target project key

### Story Settings
- `input_file` - User stories file path
- `epic_type` - Issue type for epics
- `story_type` - Issue type for stories

## Technical Details

### Dependencies
- `jira==3.5.2` - JIRA API client
- `python-dotenv==1.0.0` - Environment variable loading
- `pyyaml==6.0.1` - YAML configuration parsing
- `click==8.1.7` - CLI framework
- `colorama==0.4.6` - Cross-platform colored output

### Python Compatibility
- Supports Python 3.8+
- Includes Python 3.13 compatibility fix for `imghdr` module
- Virtual environment recommended

### JIRA Compatibility
- Works with Atlassian Cloud and Server
- Supports custom fields for Epic Name and Story Points
- Handles different priority schemes
- Configurable issue types

## Security

- API tokens instead of passwords
- Credentials masked in output
- Environment variable support
- Configuration file flexibility

## Output Example

```
🚀 JIRA Agent - Creating Epics and Stories
==================================================

📖 Parsing user stories from: user_stories.txt
✓ Parsed 3 epics with 12 total stories

🔗 Connecting to JIRA...
✓ Connected to JIRA project: My Project

Creating 3 epics with their stories...

[1/3] Processing epic: User Authentication System
✓ Created epic: PROJ-100 - User Authentication System
  ✓ Created story: PROJ-101 - Register with email (linked to PROJ-100)
  ✓ Created story: PROJ-102 - Login with credentials (linked to PROJ-100)
  → Epic PROJ-100 created with 4 stories

🎉 Successfully created JIRA issues!
Created 3 epics and 12 stories

🔗 View in JIRA: https://your-domain.atlassian.net/projects/PROJ
```

## Benefits

1. **Time Saving** - Automates manual JIRA issue creation
2. **Consistency** - Ensures uniform epic/story structure
3. **Flexibility** - Supports various workflows and configurations
4. **Reliability** - Comprehensive error handling and validation
5. **Usability** - Simple text format that anyone can edit
6. **Integration** - Works with existing JIRA projects and workflows

## Ready to Use

The agent is fully functional and ready for production use. Simply:

1. Install dependencies: `pip install -r requirements.txt`
2. Run setup: `python jira_agent.py setup`
3. Create your user stories file
4. Start creating JIRA issues: `python jira_agent.py create`

All components include comprehensive error handling, validation, and user-friendly feedback.