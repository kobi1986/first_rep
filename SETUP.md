# Quick Setup Guide

## 1. Configure Your JIRA Connection

Edit the `.env` file and replace the placeholder values with your actual JIRA details:

```env
# JIRA Configuration
JIRA_BASE_URL=https://YOUR-DOMAIN.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=ATATT3xFfGF0B6nlZdFyOu1KTQ8UqadJH7rEIoApMdjz4DMDTs-Uxo72f54SYgIiAPcCEC-tNOnPC2Dmfsh5fTdP68K7QfSzKF1PrV0PMtVBX-gtHx2J1kVjoV_PP3JtsvplVs1ZKKAxDdBkuAI0OkUs_DM20u2WPsmuaomw8_o8Bz9atBC-3Xk=162E305B

# Server Configuration  
PORT=3000
```

**Important:** 
- Replace `YOUR-DOMAIN` with your actual Atlassian domain
- Replace `your-email@example.com` with your JIRA account email
- The API token has been pre-filled from your request

## 2. Start the Application

```bash
npm start
```

## 3. Open in Browser

Navigate to: http://localhost:3000

## 4. Test with Sample Files

Try uploading one of the example files from the `examples/` directory:
- `examples/sample-stories.txt` - Plain text format
- `examples/sample-stories.json` - JSON format  
- `examples/sample-stories.csv` - CSV format

## Troubleshooting

If you get a "Failed to load JIRA projects" error:
1. Check that your JIRA_BASE_URL is correct (should end with .atlassian.net)
2. Verify your email address is correct
3. Make sure your API token has the necessary permissions
4. Ensure your JIRA instance is accessible

## Next Steps

1. Configure your JIRA details in `.env`
2. Start the server with `npm start`
3. Upload a user stories file
4. Select your project and epic
5. Create stories in JIRA!

The application will show you detailed results including links to the created JIRA issues.