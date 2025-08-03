#!/usr/bin/env python3
"""
Test script for JIRA Agent

This script demonstrates the functionality of the JIRA agent
without requiring actual JIRA credentials.
"""

import os
import sys
from colorama import Fore, init

# Initialize colorama
init(autoreset=True)

def main():
    """Run demonstration of JIRA agent functionality."""
    
    print(f"{Fore.CYAN}🧪 JIRA Agent Demonstration")
    print("=" * 40)
    
    print(f"\n{Fore.BLUE}1. Testing Story Parser...")
    
    # Test the story parser
    try:
        from story_parser import StoryParser
        parser = StoryParser()
        epics = parser.parse_file('user_stories.txt')
        
        total_stories = sum(len(epic.stories) for epic in epics)
        print(f"{Fore.GREEN}✓ Successfully parsed {len(epics)} epics with {total_stories} stories")
        
        # Show summary
        for i, epic in enumerate(epics, 1):
            high_priority = len([s for s in epic.stories if s.priority == 'High'])
            total_points = sum(s.story_points or 0 for s in epic.stories)
            print(f"  {i}. {epic.title}: {len(epic.stories)} stories, {high_priority} high priority, {total_points} story points")
    
    except Exception as e:
        print(f"{Fore.RED}✗ Parser test failed: {e}")
        return False
    
    print(f"\n{Fore.BLUE}2. Testing Configuration Loader...")
    
    # Test configuration loader
    try:
        from config_loader import ConfigLoader
        loader = ConfigLoader()
        config = loader.load_config()
        
        print(f"{Fore.GREEN}✓ Configuration loaded successfully")
        print(f"  - JIRA Server: {config.get('jira', {}).get('server', 'Not set')}")
        print(f"  - Input File: {config.get('stories', {}).get('input_file', 'Not set')}")
    
    except Exception as e:
        print(f"{Fore.RED}✗ Configuration test failed: {e}")
        return False
    
    print(f"\n{Fore.BLUE}3. Testing CLI Interface...")
    
    # Test CLI commands
    commands_to_test = [
        ("python jira_agent.py --help", "Help command"),
        ("python jira_agent.py parse", "Parse command"),
        ("python jira_agent.py create --dry-run", "Dry run command (will fail due to missing credentials)"),
    ]
    
    for cmd, description in commands_to_test:
        print(f"  Testing {description}...")
        
        # Run in virtual environment if available
        if os.path.exists('venv/bin/python'):
            full_cmd = f"source venv/bin/activate && {cmd}"
        else:
            full_cmd = cmd
        
        try:
            import subprocess
            result = subprocess.run(
                full_cmd, 
                shell=True, 
                capture_output=True, 
                text=True,
                timeout=10
            )
            
            if result.returncode == 0 or (cmd.endswith("--dry-run") and result.returncode == 1):
                print(f"{Fore.GREEN}    ✓ {description} works")
            else:
                print(f"{Fore.YELLOW}    ⚠ {description} returned code {result.returncode}")
        
        except Exception as e:
            print(f"{Fore.YELLOW}    ⚠ Could not test {description}: {e}")
    
    print(f"\n{Fore.GREEN}🎉 Demonstration Complete!")
    print(f"\n{Fore.CYAN}Next Steps:")
    print("1. Set up your JIRA credentials using: python jira_agent.py setup")
    print("2. Test connection with: python jira_agent.py test")
    print("3. Parse your user stories: python jira_agent.py parse")
    print("4. Create JIRA issues: python jira_agent.py create")
    
    print(f"\n{Fore.YELLOW}File Structure:")
    files = [
        "jira_agent.py - Main CLI script",
        "story_parser.py - User story parser",
        "jira_client.py - JIRA API integration",
        "config_loader.py - Configuration management",
        "user_stories.txt - Sample user stories",
        "config.yaml - Configuration template",
        "requirements.txt - Python dependencies",
        "README.md - Documentation"
    ]
    
    for file_desc in files:
        print(f"  - {file_desc}")
    
    return True


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Test interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n{Fore.RED}Unexpected error: {e}")
        sys.exit(1)