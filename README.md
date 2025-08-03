# JIRA Agent - User Stories to JIRA Epics

A local agent that reads user stories from a text file and automatically creates corresponding epics and stories in JIRA using the JIRA REST API.

## Features

- 📖 **Smart Parser**: Parses structured user stories from text files
- 🎯 **Epic Organization**: Automatically groups stories into epics
- 🔄 **Priority & Story Points**: Supports priority levels and story point estimation
- 🔗 **JIRA Integration**: Creates epics and stories with proper linking
- 🛠️ **Flexible Configuration**: YAML config files or environment variables
- 🔍 **Dry Run Mode**: Preview what will be created without making changes
- ✅ **Validation**: Built-in validation for configuration and user stories

## Quick Start

### 1. Installation

```bash
# Clone or download the repository
git clone <repository-url>
cd jira-agent

# Install dependencies
pip install -r requirements.txt
```

### 2. Setup Configuration

Run the interactive setup wizard:

```bash
python jira_agent.py setup
```

Or manually create configuration:

**Option A: Create `config.yaml`**
```yaml
jira:
  server: "https://your-domain.atlassian.net"
  username: "your-email@example.com"
  api_token: "your-api-token"
  project_key: "PROJ"

stories:
  input_file: "user_stories.txt"
  epic_name_prefix: "Epic: "
  story_type: "Story"
  epic_type: "Epic"
```

**Option B: Create `.env` file**
```bash
JIRA_SERVER=https://your-domain.atlassian.net
JIRA_USERNAME=your-email@example.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEY=PROJ
```

### 3. Create User Stories File

Create a `user_stories.txt` file with your user stories:

```text
EPIC: User Authentication System
- As a user, I want to register with email and password so that I can create an account [High] {5}
- As a user, I want to login with my credentials so that I can access the application [High] {3}
- As a user, I want to reset my password if I forget it so that I can regain access [Medium] {3}

EPIC: Product Catalog Management
- As a customer, I want to browse products by category so that I can find what I need [High] {5}
- As a customer, I want to search for products by name so that I can quickly locate items [High] {8}
```

### 4. Test and Run

```bash
# Test JIRA connection
python jira_agent.py test

# Parse and validate user stories (dry run)
python jira_agent.py parse

# Create epics and stories in JIRA
python jira_agent.py create
```

## User Stories Format

The user stories file uses a simple, structured format:

```text
# Comments start with #
# Each epic starts with "EPIC:" followed by the epic name
# Stories are listed with "-" and can include priority and story points

EPIC: Epic Name Here
- As a [role], I want to [action] so that [benefit] [Priority] {Story Points}
- As a user, I want to login so that I can access my account [High] {3}
- As an admin, I want to manage users so that I can maintain security [Medium] {5}

EPIC: Another Epic
- Story without priority or points
- Story with priority only [Low]
- Story with story points only {8}
```

### Supported Elements

- **Epic Name**: Any text after `EPIC:`
- **Priority Levels**: `[High]`, `[Medium]`, `[Low]`, `[Critical]`, `[Blocker]`
- **Story Points**: Numbers in curly braces `{1}`, `{2}`, `{3}`, `{5}`, `{8}`, `{13}`, etc.
- **Comments**: Lines starting with `#` are ignored

## Commands

### `create` - Create JIRA Issues

Creates epics and stories in JIRA from the user stories file.

```bash
python jira_agent.py create [OPTIONS]

Options:
  -c, --config FILE        Configuration file path (default: config.yaml)
  -i, --input-file FILE    User stories input file (overrides config)
  -d, --dry-run           Parse stories but don't create JIRA issues
  -v, --verbose           Verbose output
```

Examples:
```bash
# Basic usage
python jira_agent.py create

# Use custom config file
python jira_agent.py create --config custom-config.yaml

# Use different input file
python jira_agent.py create --input-file my-stories.txt

# Dry run to see what would be created
python jira_agent.py create --dry-run

# Verbose output with detailed information
python jira_agent.py create --verbose
```

### `test` - Test Configuration

Tests JIRA connection and displays project information.

```bash
python jira_agent.py test [OPTIONS]

Options:
  -c, --config FILE        Configuration file path (default: config.yaml)
```

### `parse` - Parse User Stories

Parses and validates the user stories file without connecting to JIRA.

```bash
python jira_agent.py parse [OPTIONS]

Options:
  -i, --input-file FILE    User stories file to parse (default: user_stories.txt)
```

### `setup` - Interactive Setup

Interactive wizard to create configuration files.

```bash
python jira_agent.py setup
```

## JIRA Setup

### 1. Get API Token

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label and copy the token
4. Use this token in your configuration

### 2. Find Project Key

1. Go to your JIRA project
2. Look at the URL or project settings
3. The project key is usually 2-4 uppercase letters (e.g., "PROJ", "DEV", "TEAM")

### 3. Required Permissions

Your JIRA user needs permissions to:
- Create issues in the target project
- Create epics (if your project supports them)
- Link issues (for epic-story relationships)

## Configuration

### Configuration Precedence

1. Environment variables (highest priority)
2. Configuration file (YAML)
3. Default values (lowest priority)

### Environment Variables

- `JIRA_SERVER` - JIRA server URL
- `JIRA_USERNAME` - JIRA username (email)
- `JIRA_API_TOKEN` - JIRA API token
- `JIRA_PROJECT_KEY` - JIRA project key

### Custom Field IDs

JIRA custom fields may have different IDs in your instance. You can modify these in `jira_client.py`:

```python
# Epic Name field (common IDs: customfield_10011, customfield_10004)
epic_fields['customfield_10011'] = epic.title

# Story Points field (common IDs: customfield_10016, customfield_10002)
story_fields['customfield_10016'] = story.story_points
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify your API token is correct
   - Check that your username is your email address
   - Ensure your JIRA server URL is correct

2. **Permission Denied**
   - Verify you have permission to create issues in the project
   - Check if Epic issue type is available in your project

3. **Custom Field Errors**
   - Epic Name or Story Points fields may have different IDs
   - Modify the field IDs in `jira_client.py`

4. **Issue Type Not Found**
   - Verify "Epic" and "Story" issue types exist in your project
   - Check project configuration in JIRA

### Getting Help

1. Run with `--verbose` for detailed output
2. Use `python jira_agent.py test` to verify configuration
3. Use `python jira_agent.py parse` to validate user stories format

## File Structure

```
jira-agent/
├── jira_agent.py          # Main CLI script
├── story_parser.py        # User story parser
├── jira_client.py         # JIRA API client
├── config_loader.py       # Configuration loader
├── requirements.txt       # Python dependencies
├── config.yaml           # Configuration file (created by setup)
├── .env.example          # Environment variables example
├── user_stories.txt      # Sample user stories
└── README.md            # This file
```

## Examples

### Example User Stories File

```text
# E-commerce Platform User Stories

EPIC: User Authentication System
- As a new user, I want to register with email and password so that I can create an account [High] {5}
- As a returning user, I want to login with my credentials so that I can access my account [High] {3}
- As a user, I want to reset my password if I forget it so that I can regain access to my account [Medium] {3}
- As an admin, I want to manage user accounts so that I can maintain system security [Low] {8}

EPIC: Product Catalog Management
- As a customer, I want to browse products by category so that I can find what I need easily [High] {5}
- As a customer, I want to search for products by name or description so that I can quickly locate specific items [High] {8}
- As a customer, I want to view detailed product information so that I can make informed purchasing decisions [Medium] {3}
- As an admin, I want to add new products to the catalog so that customers can purchase them [High] {5}
- As an admin, I want to update product information so that the catalog stays current [Medium] {3}

EPIC: Shopping Cart and Checkout
- As a customer, I want to add products to my cart so that I can purchase multiple items at once [High] {5}
- As a customer, I want to modify quantities in my cart so that I can adjust my order before checkout [Medium] {3}
- As a customer, I want to remove items from my cart so that I can change my mind about purchases [Low] {2}
- As a customer, I want to proceed through a secure checkout process so that I can complete my purchase safely [High] {13}
- As a customer, I want to receive order confirmation so that I know my purchase was successful [Medium] {3}
```

### Example Output

```
🚀 JIRA Agent - Creating Epics and Stories
==================================================

📖 Parsing user stories from: user_stories.txt
✓ Parsed 3 epics with 12 total stories

🔗 Connecting to JIRA...
✓ Connected to JIRA project: E-commerce Platform

Creating 3 epics with their stories...

[1/3] Processing epic: User Authentication System
✓ Created epic: PROJ-100 - User Authentication System
  ✓ Created story: PROJ-101 - Register with email and password (linked to PROJ-100)
  ✓ Created story: PROJ-102 - Login with my credentials (linked to PROJ-100)
  ✓ Created story: PROJ-103 - Reset my password if I forget it (linked to PROJ-100)
  ✓ Created story: PROJ-104 - Manage user accounts (linked to PROJ-100)
  → Epic PROJ-100 created with 4 stories

[2/3] Processing epic: Product Catalog Management
✓ Created epic: PROJ-105 - Product Catalog Management
  ✓ Created story: PROJ-106 - Browse products by category (linked to PROJ-105)
  ✓ Created story: PROJ-107 - Search for products by name or description (linked to PROJ-105)
  ✓ Created story: PROJ-108 - View detailed product information (linked to PROJ-105)
  ✓ Created story: PROJ-109 - Add new products to the catalog (linked to PROJ-105)
  ✓ Created story: PROJ-110 - Update product information (linked to PROJ-105)
  → Epic PROJ-105 created with 5 stories

[3/3] Processing epic: Shopping Cart and Checkout
✓ Created epic: PROJ-111 - Shopping Cart and Checkout
  ✓ Created story: PROJ-112 - Add products to my cart (linked to PROJ-111)
  ✓ Created story: PROJ-113 - Modify quantities in my cart (linked to PROJ-111)
  ✓ Created story: PROJ-114 - Remove items from my cart (linked to PROJ-111)
  ✓ Created story: PROJ-115 - Proceed through a secure checkout process (linked to PROJ-111)
  ✓ Created story: PROJ-116 - Receive order confirmation (linked to PROJ-111)
  → Epic PROJ-111 created with 3 stories

🎉 Successfully created JIRA issues!
==================================================
Created 3 epics and 12 stories

🔗 View in JIRA:
   Project: https://your-domain.atlassian.net/projects/PROJ
```

## License

This project is open source and available under the MIT License.