#!/usr/bin/env python3
"""
JIRA Agent - Local agent for populating user stories into JIRA epics

This script reads user stories from a file and creates corresponding epics
and stories in JIRA using the JIRA REST API.
"""

import sys
import os
import click
from colorama import Fore, Style, init
from typing import Optional

from config_loader import ConfigLoader
from story_parser import StoryParser
from jira_client import JiraClient, test_connection

# Initialize colorama for cross-platform colored terminal output
init(autoreset=True)


@click.group()
@click.version_option(version="1.0.0")
def cli():
    """JIRA Agent - Populate user stories into JIRA epics."""
    pass


@cli.command()
@click.option('--config', '-c', default='config.yaml', help='Configuration file path')
@click.option('--input-file', '-i', help='User stories input file (overrides config)')
@click.option('--dry-run', '-d', is_flag=True, help='Parse stories but don\'t create JIRA issues')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
def create(config: str, input_file: Optional[str], dry_run: bool, verbose: bool):
    """Create epics and stories in JIRA from user stories file."""
    
    print(f"{Fore.CYAN}🚀 JIRA Agent - Creating Epics and Stories")
    print("=" * 50)
    
    # Load configuration
    loader = ConfigLoader(config)
    config_data = loader.load_config()
    
    if verbose:
        loader.print_config()
    
    if not loader.validate_config():
        sys.exit(1)
    
    # Get configuration
    jira_config = loader.get_jira_config()
    stories_config = loader.get_stories_config()
    
    # Override input file if provided
    input_file_path = input_file or stories_config['input_file']
    
    if not os.path.exists(input_file_path):
        print(f"{Fore.RED}✗ User stories file not found: {input_file_path}")
        sys.exit(1)
    
    # Parse user stories
    print(f"\n{Fore.BLUE}📖 Parsing user stories from: {input_file_path}")
    parser = StoryParser()
    
    try:
        epics = parser.parse_file(input_file_path)
    except Exception as e:
        print(f"{Fore.RED}✗ Error parsing user stories: {e}")
        sys.exit(1)
    
    if not epics:
        print(f"{Fore.YELLOW}⚠ No epics found in the input file")
        sys.exit(0)
    
    # Display parsing results
    total_stories = sum(len(epic.stories) for epic in epics)
    print(f"{Fore.GREEN}✓ Parsed {len(epics)} epics with {total_stories} total stories")
    
    if verbose:
        for i, epic in enumerate(epics, 1):
            print(f"\n  {i}. Epic: {epic.title}")
            print(f"     Stories: {len(epic.stories)}")
            for j, story in enumerate(epic.stories, 1):
                priority_str = f" [{story.priority}]" if story.priority else ""
                points_str = f" ({story.story_points}pts)" if story.story_points else ""
                print(f"       {j}. {story.title}{priority_str}{points_str}")
    
    # If dry run, stop here
    if dry_run:
        print(f"\n{Fore.YELLOW}🔍 Dry run completed - no JIRA issues created")
        return
    
    # Connect to JIRA
    print(f"\n{Fore.BLUE}🔗 Connecting to JIRA...")
    client = JiraClient(
        server=jira_config['server'],
        username=jira_config['username'],
        api_token=jira_config['api_token'],
        project_key=jira_config['project_key']
    )
    
    if not client.connect():
        print(f"{Fore.RED}✗ Failed to connect to JIRA")
        sys.exit(1)
    
    # Create epics and stories
    try:
        results = client.create_epics_and_stories(epics)
        
        # Display results
        print(f"\n{Fore.GREEN}🎉 Successfully created JIRA issues!")
        print("=" * 50)
        
        created_epics = len(results)
        created_stories = sum(len(stories) for stories in results.values())
        
        print(f"Created {created_epics} epics and {created_stories} stories")
        
        if verbose and results:
            print(f"\n{Fore.BLUE}Created Issues:")
            for epic_key, story_keys in results.items():
                print(f"  Epic: {epic_key}")
                for story_key in story_keys:
                    print(f"    Story: {story_key}")
        
        # Provide links to view in JIRA
        base_url = jira_config['server'].rstrip('/')
        project_key = jira_config['project_key']
        print(f"\n{Fore.CYAN}🔗 View in JIRA:")
        print(f"   Project: {base_url}/projects/{project_key}")
        
    except Exception as e:
        print(f"{Fore.RED}✗ Error creating JIRA issues: {e}")
        sys.exit(1)


@cli.command()
@click.option('--config', '-c', default='config.yaml', help='Configuration file path')
def test(config: str):
    """Test JIRA connection and configuration."""
    
    print(f"{Fore.CYAN}🔧 Testing JIRA Connection")
    print("=" * 30)
    
    # Load configuration
    loader = ConfigLoader(config)
    config_data = loader.load_config()
    loader.print_config()
    
    if not loader.validate_config():
        sys.exit(1)
    
    # Test connection
    jira_config = loader.get_jira_config()
    success = test_connection(
        server=jira_config['server'],
        username=jira_config['username'],
        api_token=jira_config['api_token'],
        project_key=jira_config['project_key']
    )
    
    if success:
        print(f"\n{Fore.GREEN}✅ All tests passed!")
    else:
        print(f"\n{Fore.RED}❌ Connection test failed!")
        sys.exit(1)


@cli.command()
@click.option('--input-file', '-i', default='user_stories.txt', help='User stories file to parse')
def parse(input_file: str):
    """Parse and validate user stories file without connecting to JIRA."""
    
    print(f"{Fore.CYAN}📖 Parsing User Stories")
    print("=" * 30)
    
    if not os.path.exists(input_file):
        print(f"{Fore.RED}✗ File not found: {input_file}")
        sys.exit(1)
    
    parser = StoryParser()
    
    try:
        epics = parser.parse_file(input_file)
    except Exception as e:
        print(f"{Fore.RED}✗ Error parsing file: {e}")
        sys.exit(1)
    
    if not epics:
        print(f"{Fore.YELLOW}⚠ No epics found in the file")
        return
    
    # Display detailed parsing results
    total_stories = sum(len(epic.stories) for epic in epics)
    print(f"{Fore.GREEN}✓ Found {len(epics)} epics with {total_stories} total stories\n")
    
    for i, epic in enumerate(epics, 1):
        print(f"{Fore.BLUE}{i}. Epic: {epic.title}")
        print(f"   Stories: {len(epic.stories)}")
        
        for j, story in enumerate(epic.stories, 1):
            priority_str = f" [Priority: {story.priority}]" if story.priority else ""
            points_str = f" [Points: {story.story_points}]" if story.story_points else ""
            
            print(f"     {j}. {story.title}{priority_str}{points_str}")
            if len(story.description) > 80:
                print(f"        Description: {story.description[:77]}...")
            else:
                print(f"        Description: {story.description}")
        print()


@cli.command()
def setup():
    """Interactive setup wizard for configuration."""
    
    print(f"{Fore.CYAN}🛠️  JIRA Agent Setup Wizard")
    print("=" * 35)
    
    print("\nThis wizard will help you set up your JIRA configuration.")
    print("You can either create a config.yaml file or use environment variables.\n")
    
    # Collect configuration
    server = click.prompt("JIRA Server URL", type=str, default="https://your-domain.atlassian.net")
    username = click.prompt("JIRA Username (email)", type=str)
    api_token = click.prompt("JIRA API Token", type=str, hide_input=True)
    project_key = click.prompt("JIRA Project Key", type=str)
    
    print(f"\n{Fore.BLUE}Choose configuration method:")
    print("1. Create config.yaml file")
    print("2. Create .env file")
    
    method = click.prompt("Select method", type=click.Choice(['1', '2']))
    
    if method == '1':
        # Create config.yaml
        config_content = f"""# JIRA Configuration
jira:
  server: "{server}"
  username: "{username}"
  api_token: "{api_token}"
  project_key: "{project_key}"

# User Stories Configuration
stories:
  input_file: "user_stories.txt"
  epic_name_prefix: "Epic: "
  story_type: "Story"
  epic_type: "Epic"
"""
        
        with open('config.yaml', 'w') as f:
            f.write(config_content)
        
        print(f"{Fore.GREEN}✓ Created config.yaml")
    
    else:
        # Create .env file
        env_content = f"""JIRA_SERVER={server}
JIRA_USERNAME={username}
JIRA_API_TOKEN={api_token}
JIRA_PROJECT_KEY={project_key}
"""
        
        with open('.env', 'w') as f:
            f.write(env_content)
        
        print(f"{Fore.GREEN}✓ Created .env file")
    
    print(f"\n{Fore.YELLOW}Next steps:")
    print("1. Test your configuration: python jira_agent.py test")
    print("2. Parse your user stories: python jira_agent.py parse")
    print("3. Create JIRA issues: python jira_agent.py create")


def main():
    """Main entry point."""
    try:
        cli()
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Operation cancelled by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n{Fore.RED}Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()