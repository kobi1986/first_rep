"""
Configuration Loader Module

This module handles loading configuration from YAML files and environment variables.
"""

import os
import yaml
from typing import Dict, Any
from dotenv import load_dotenv


class ConfigLoader:
    """Configuration loader for JIRA agent."""
    
    def __init__(self, config_file: str = "config.yaml"):
        """
        Initialize configuration loader.
        
        Args:
            config_file: Path to YAML configuration file
        """
        self.config_file = config_file
        self.config = {}
        
        # Load environment variables from .env file if it exists
        if os.path.exists('.env'):
            load_dotenv()
    
    def load_config(self) -> Dict[str, Any]:
        """
        Load configuration from YAML file and environment variables.
        Environment variables take precedence over YAML config.
        
        Returns:
            Configuration dictionary
        """
        # Load from YAML file first
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r', encoding='utf-8') as file:
                    self.config = yaml.safe_load(file) or {}
            except Exception as e:
                print(f"Warning: Could not load config file {self.config_file}: {e}")
                self.config = {}
        else:
            print(f"Warning: Config file {self.config_file} not found, using defaults")
            self.config = {}
        
        # Override with environment variables
        self._load_from_env()
        
        # Set defaults for missing values
        self._set_defaults()
        
        return self.config
    
    def _load_from_env(self):
        """Load configuration from environment variables."""
        # JIRA configuration
        if not self.config.get('jira'):
            self.config['jira'] = {}
        
        env_mappings = {
            'JIRA_SERVER': ('jira', 'server'),
            'JIRA_USERNAME': ('jira', 'username'),
            'JIRA_API_TOKEN': ('jira', 'api_token'),
            'JIRA_PROJECT_KEY': ('jira', 'project_key'),
        }
        
        for env_var, (section, key) in env_mappings.items():
            value = os.getenv(env_var)
            if value:
                if section not in self.config:
                    self.config[section] = {}
                self.config[section][key] = value
    
    def _set_defaults(self):
        """Set default values for missing configuration."""
        # JIRA defaults
        jira_defaults = {
            'server': 'https://your-domain.atlassian.net',
            'username': 'your-email@example.com',
            'api_token': 'your-api-token',
            'project_key': 'PROJ'
        }
        
        if 'jira' not in self.config:
            self.config['jira'] = {}
        
        for key, default_value in jira_defaults.items():
            if key not in self.config['jira']:
                self.config['jira'][key] = default_value
        
        # Stories defaults
        stories_defaults = {
            'input_file': 'user_stories.txt',
            'epic_name_prefix': 'Epic: ',
            'story_type': 'Story',
            'epic_type': 'Epic'
        }
        
        if 'stories' not in self.config:
            self.config['stories'] = {}
        
        for key, default_value in stories_defaults.items():
            if key not in self.config['stories']:
                self.config['stories'][key] = default_value
    
    def validate_config(self) -> bool:
        """
        Validate that required configuration is present.
        
        Returns:
            True if configuration is valid, False otherwise
        """
        required_fields = [
            ('jira', 'server'),
            ('jira', 'username'),
            ('jira', 'api_token'),
            ('jira', 'project_key'),
            ('stories', 'input_file')
        ]
        
        missing_fields = []
        
        for section, field in required_fields:
            if section not in self.config or field not in self.config[section]:
                missing_fields.append(f"{section}.{field}")
            elif not self.config[section][field] or self.config[section][field].startswith('your-'):
                missing_fields.append(f"{section}.{field}")
        
        if missing_fields:
            print(f"Error: Missing or invalid configuration for: {', '.join(missing_fields)}")
            print("\nPlease update your config.yaml file or set environment variables:")
            print("  JIRA_SERVER, JIRA_USERNAME, JIRA_API_TOKEN, JIRA_PROJECT_KEY")
            return False
        
        return True
    
    def get_jira_config(self) -> Dict[str, str]:
        """Get JIRA configuration parameters."""
        return self.config.get('jira', {})
    
    def get_stories_config(self) -> Dict[str, str]:
        """Get stories configuration parameters."""
        return self.config.get('stories', {})
    
    def print_config(self):
        """Print current configuration (hiding sensitive data)."""
        print("\nCurrent Configuration:")
        print("=" * 40)
        
        jira_config = self.config.get('jira', {})
        print(f"JIRA Server: {jira_config.get('server', 'Not set')}")
        print(f"JIRA Username: {jira_config.get('username', 'Not set')}")
        print(f"JIRA API Token: {'*' * len(jira_config.get('api_token', '')) if jira_config.get('api_token') else 'Not set'}")
        print(f"JIRA Project Key: {jira_config.get('project_key', 'Not set')}")
        
        stories_config = self.config.get('stories', {})
        print(f"Input File: {stories_config.get('input_file', 'Not set')}")
        print(f"Epic Type: {stories_config.get('epic_type', 'Not set')}")
        print(f"Story Type: {stories_config.get('story_type', 'Not set')}")


if __name__ == "__main__":
    # Test the configuration loader
    loader = ConfigLoader()
    config = loader.load_config()
    loader.print_config()
    
    if loader.validate_config():
        print("\n✓ Configuration is valid")
    else:
        print("\n✗ Configuration is invalid")