"""
JIRA Client Module

This module handles authentication and interaction with JIRA API
to create epics and user stories.
"""

import os
import sys
from typing import List, Dict, Optional

# Python 3.13 compatibility fix for imghdr module
if sys.version_info >= (3, 13):
    try:
        import imghdr
    except ModuleNotFoundError:
        # Create a minimal imghdr module to satisfy JIRA library imports
        import types
        
        imghdr = types.ModuleType('imghdr')
        
        def what(file, h=None):
            """Determine what kind of image data is in a file."""
            return None
        
        imghdr.what = what
        sys.modules['imghdr'] = imghdr

from jira import JIRA
from jira.exceptions import JIRAError
from colorama import Fore, Style, init
from story_parser import Epic, UserStory

# Initialize colorama for cross-platform colored terminal output
init(autoreset=True)


class JiraClient:
    """Client for interacting with JIRA API."""
    
    def __init__(self, server: str, username: str, api_token: str, project_key: str):
        """
        Initialize JIRA client.
        
        Args:
            server: JIRA server URL
            username: JIRA username (email)
            api_token: JIRA API token
            project_key: Project key in JIRA
        """
        self.server = server
        self.username = username
        self.api_token = api_token
        self.project_key = project_key
        self.jira = None
        
        # Priority mapping
        self.priority_mapping = {
            'High': 'High',
            'Medium': 'Medium', 
            'Low': 'Low',
            'Critical': 'Highest',
            'Blocker': 'Highest'
        }
    
    def connect(self) -> bool:
        """
        Connect to JIRA instance.
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            self.jira = JIRA(
                server=self.server,
                basic_auth=(self.username, self.api_token)
            )
            
            # Test connection by getting project info
            project = self.jira.project(self.project_key)
            print(f"{Fore.GREEN}✓ Connected to JIRA project: {project.name}")
            return True
            
        except JIRAError as e:
            print(f"{Fore.RED}✗ JIRA connection failed: {e}")
            return False
        except Exception as e:
            print(f"{Fore.RED}✗ Connection error: {e}")
            return False
    
    def get_available_issue_types(self) -> List[str]:
        """Get available issue types for the project."""
        try:
            if not self.jira:
                raise Exception("Not connected to JIRA")
            
            project = self.jira.project(self.project_key)
            issue_types = [issue_type.name for issue_type in project.issueTypes]
            return issue_types
            
        except Exception as e:
            print(f"{Fore.YELLOW}⚠ Could not fetch issue types: {e}")
            return ['Epic', 'Story', 'Task', 'Bug']
    
    def create_epic(self, epic: Epic) -> Optional[str]:
        """
        Create an epic in JIRA.
        
        Args:
            epic: Epic object containing title and stories
            
        Returns:
            Epic key if created successfully, None otherwise
        """
        try:
            if not self.jira:
                raise Exception("Not connected to JIRA")
            
            # Prepare epic fields
            epic_fields = {
                'project': {'key': self.project_key},
                'summary': epic.title,
                'description': f"Epic containing {len(epic.stories)} user stories",
                'issuetype': {'name': 'Epic'}
            }
            
            # Add epic name if supported (Atlassian Cloud)
            try:
                epic_fields['customfield_10011'] = epic.title  # Epic Name field
            except:
                pass  # Epic name field might not exist or have different ID
            
            # Create the epic
            epic_issue = self.jira.create_issue(fields=epic_fields)
            print(f"{Fore.GREEN}✓ Created epic: {epic_issue.key} - {epic.title}")
            
            return epic_issue.key
            
        except JIRAError as e:
            print(f"{Fore.RED}✗ Failed to create epic '{epic.title}': {e}")
            return None
        except Exception as e:
            print(f"{Fore.RED}✗ Error creating epic '{epic.title}': {e}")
            return None
    
    def create_story(self, story: UserStory, epic_key: Optional[str] = None) -> Optional[str]:
        """
        Create a user story in JIRA.
        
        Args:
            story: UserStory object
            epic_key: Epic key to link the story to (optional)
            
        Returns:
            Story key if created successfully, None otherwise
        """
        try:
            if not self.jira:
                raise Exception("Not connected to JIRA")
            
            # Prepare story fields
            story_fields = {
                'project': {'key': self.project_key},
                'summary': story.title,
                'description': story.description,
                'issuetype': {'name': 'Story'}
            }
            
            # Add priority if specified
            if story.priority and story.priority in self.priority_mapping:
                story_fields['priority'] = {'name': self.priority_mapping[story.priority]}
            
            # Add story points if specified and field exists
            if story.story_points:
                try:
                    # Story Points field (customize field ID as needed)
                    story_fields['customfield_10016'] = story.story_points
                except:
                    pass  # Story points field might not exist or have different ID
            
            # Create the story
            story_issue = self.jira.create_issue(fields=story_fields)
            
            # Link to epic if provided
            if epic_key:
                try:
                    # Link story to epic
                    self.jira.add_issues_to_epic(epic_key, [story_issue.key])
                    print(f"{Fore.GREEN}  ✓ Created story: {story_issue.key} - {story.title} (linked to {epic_key})")
                except Exception as e:
                    print(f"{Fore.YELLOW}  ⚠ Created story: {story_issue.key} - {story.title} (epic link failed: {e})")
            else:
                print(f"{Fore.GREEN}  ✓ Created story: {story_issue.key} - {story.title}")
            
            return story_issue.key
            
        except JIRAError as e:
            print(f"{Fore.RED}  ✗ Failed to create story '{story.title}': {e}")
            return None
        except Exception as e:
            print(f"{Fore.RED}  ✗ Error creating story '{story.title}': {e}")
            return None
    
    def create_epics_and_stories(self, epics: List[Epic]) -> Dict[str, List[str]]:
        """
        Create all epics and their associated stories.
        
        Args:
            epics: List of Epic objects to create
            
        Returns:
            Dictionary mapping epic keys to lists of story keys
        """
        results = {}
        
        if not self.jira:
            print(f"{Fore.RED}✗ Not connected to JIRA")
            return results
        
        print(f"\n{Fore.CYAN}Creating {len(epics)} epics with their stories...")
        
        for i, epic in enumerate(epics, 1):
            print(f"\n{Fore.BLUE}[{i}/{len(epics)}] Processing epic: {epic.title}")
            
            # Create the epic
            epic_key = self.create_epic(epic)
            
            if epic_key:
                story_keys = []
                
                # Create stories for this epic
                for story in epic.stories:
                    story_key = self.create_story(story, epic_key)
                    if story_key:
                        story_keys.append(story_key)
                
                results[epic_key] = story_keys
                print(f"{Fore.GREEN}  → Epic {epic_key} created with {len(story_keys)} stories")
            else:
                print(f"{Fore.RED}  → Failed to create epic: {epic.title}")
        
        return results
    
    def get_project_info(self) -> Dict:
        """Get project information."""
        try:
            if not self.jira:
                raise Exception("Not connected to JIRA")
            
            project = self.jira.project(self.project_key)
            return {
                'key': project.key,
                'name': project.name,
                'description': getattr(project, 'description', 'No description'),
                'lead': getattr(project.lead, 'displayName', 'Unknown'),
                'issue_types': [it.name for it in project.issueTypes]
            }
        except Exception as e:
            print(f"{Fore.RED}✗ Error getting project info: {e}")
            return {}


def test_connection(server: str, username: str, api_token: str, project_key: str):
    """Test JIRA connection with provided credentials."""
    client = JiraClient(server, username, api_token, project_key)
    
    print(f"{Fore.CYAN}Testing JIRA connection...")
    print(f"Server: {server}")
    print(f"Username: {username}")
    print(f"Project: {project_key}")
    
    if client.connect():
        info = client.get_project_info()
        if info:
            print(f"\n{Fore.GREEN}Project Information:")
            print(f"  Name: {info['name']}")
            print(f"  Key: {info['key']}")
            print(f"  Lead: {info['lead']}")
            print(f"  Issue Types: {', '.join(info['issue_types'])}")
        
        issue_types = client.get_available_issue_types()
        print(f"\n{Fore.BLUE}Available Issue Types: {', '.join(issue_types)}")
        return True
    
    return False


if __name__ == "__main__":
    # Test with environment variables if available
    server = os.getenv('JIRA_SERVER', 'https://your-domain.atlassian.net')
    username = os.getenv('JIRA_USERNAME', 'your-email@example.com')
    api_token = os.getenv('JIRA_API_TOKEN', 'your-api-token')
    project_key = os.getenv('JIRA_PROJECT_KEY', 'PROJ')
    
    test_connection(server, username, api_token, project_key)