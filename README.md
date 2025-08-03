# JIRA User Story Creator

A local web application that reads user stories from files and creates them automatically in JIRA. Upload your user stories in various formats (TXT, JSON, CSV, MD) and have them created in your JIRA project with proper organization under epics.

## Features

- 📁 **Multiple File Formats**: Support for .txt, .json, .csv, and .md files
- 🎯 **JIRA Integration**: Direct integration with JIRA Cloud using REST API
- 📝 **Story Editor**: Built-in editor to review and modify stories before creation
- 🏗️ **Epic Organization**: Option to organize stories under existing epics
- 📊 **Results Dashboard**: Detailed feedback on creation success/failures
- 🎨 **Modern UI**: Clean, responsive interface with drag-and-drop file upload

## Quick Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure JIRA Settings**
   - Edit the `.env` file with your JIRA details:
   ```
   JIRA_BASE_URL=https://your-domain.atlassian.net
   JIRA_EMAIL=your-email@example.com
   JIRA_API_TOKEN=your-api-token-here
   ```

3. **Start the Application**
   ```bash
   npm start
   ```

4. **Open in Browser**
   - Navigate to `http://localhost:3000`

## JIRA API Setup

1. **Generate an API Token**
   - Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
   - Click "Create API token"
   - Give it a label and copy the token

2. **Update Environment Variables**
   - Replace the placeholder values in `.env` with your actual JIRA details
   - The API token provided in your request has already been added to the `.env` file

## Supported File Formats

### 1. Plain Text (.txt, .md)
Stories separated by empty lines or dividers:

```
User Login Feature
As a user, I want to log into the system so that I can access my account.

Acceptance Criteria:
- User can enter email and password
- System validates credentials
- User is redirected to dashboard on success

---

Password Reset
As a user, I want to reset my password so that I can regain access to my account.

AC:
- User can request password reset via email
- Reset link expires after 24 hours
```

### 2. JSON (.json)
Structured format for precise control:

```json
{
  "stories": [
    {
      "title": "User Login Feature",
      "description": "As a user, I want to log into the system so that I can access my account.",
      "acceptanceCriteria": "- User can enter email and password\n- System validates credentials\n- User is redirected to dashboard on success"
    },
    {
      "title": "Password Reset",
      "description": "As a user, I want to reset my password so that I can regain access to my account.",
      "acceptanceCriteria": "- User can request password reset via email\n- Reset link expires after 24 hours"
    }
  ]
}
```

### 3. CSV (.csv)
Spreadsheet format for bulk imports:

```csv
Title,Description,Acceptance Criteria
User Login Feature,As a user I want to log into the system,User can enter credentials and access dashboard
Password Reset,As a user I want to reset my password,User can request reset via email
Profile Management,As a user I want to update my profile,User can edit personal information
```

## Usage Workflow

1. **Upload File**: Drag and drop or select your user stories file
2. **Parse Stories**: Review the automatically parsed stories
3. **Edit (Optional)**: Use the built-in editor to modify stories
4. **Select Project**: Choose your JIRA project from the dropdown
5. **Select Epic (Optional)**: Choose an epic to organize your stories
6. **Create Stories**: Bulk create all stories in JIRA
7. **Review Results**: See which stories were created successfully

## API Endpoints

- `GET /api/projects` - Fetch available JIRA projects
- `GET /api/projects/:projectKey/epics` - Fetch epics for a project
- `POST /api/parse-stories` - Parse user stories from uploaded file
- `POST /api/create-stories` - Create user stories in JIRA

## File Parsing Logic

### Text Files
- Stories separated by empty lines or horizontal rules (`---`, `===`)
- First line becomes the title if it's short (<100 chars) or starts with `#`, `Title:`, `Story:`
- Acceptance criteria detected with keywords: "Acceptance Criteria", "AC"

### JSON Files
- Supports array of story objects or `{stories: [...]}` wrapper
- Maps `title/summary`, `description/details`, `acceptanceCriteria/acceptance`

### CSV Files
- Header row required
- Auto-detects columns containing "title", "description", "acceptance", etc.
- Flexible column ordering

## Error Handling

- **File Validation**: Only accepted file types allowed
- **JIRA Connection**: Clear error messages for authentication issues
- **Story Creation**: Individual story failures don't stop the batch
- **Detailed Feedback**: Complete results with success/failure details

## Development

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## Dependencies

- **Express**: Web server framework
- **Multer**: File upload handling
- **Axios**: HTTP client for JIRA API
- **CORS**: Cross-origin request support
- **dotenv**: Environment variable management

## Security Notes

- API tokens are stored in environment variables
- File uploads are validated and cleaned up
- No persistent file storage
- Basic authentication for JIRA API

## Troubleshooting

### Common Issues

1. **"Failed to load JIRA projects"**
   - Check your JIRA base URL format: `https://your-domain.atlassian.net`
   - Verify your email and API token are correct
   - Ensure the API token has proper permissions

2. **"Story issue type not found"**
   - Your JIRA project must have a "Story" or "User Story" issue type
   - Check your project configuration in JIRA

3. **"No stories found in file"**
   - Check file format matches expected patterns
   - Ensure proper separation between stories in text files
   - Verify JSON structure for JSON files

### File Format Tips

- **Text files**: Use empty lines or `---` to separate stories
- **JSON files**: Use consistent field names (`title`, `description`, `acceptanceCriteria`)
- **CSV files**: Include headers and use commas as separators
- **All formats**: Keep titles concise and descriptions clear

### BASE ENV FILE
```
# JIRA Configuration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=ATATT3xFfGF0B6nlZdFyOu1KTQ8UqadJH7rEIoApMdjz4DMDTs-Uxo72f54SYgIiAPcCEC-tNOnPC2Dmfsh5fTdP68K7QfSzKF1PrV0PMtVBX-gtHx2J1kVjoV_PP3JtsvplVs1ZKKAxDdBkuAI0OkUs_DM20u2WPsmuaomw8_o8Bz9atBC-3Xk=162E305B

# Server Configuration
PORT=3000
```

## License

MIT License - Feel free to modify and distribute as needed.

