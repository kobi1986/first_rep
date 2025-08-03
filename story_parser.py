"""
User Story Parser Module

This module parses user stories from a text file format into structured data
that can be used to create JIRA epics and stories.
"""

import re
from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class UserStory:
    """Represents a single user story."""
    title: str
    description: str
    priority: Optional[str] = None
    story_points: Optional[int] = None


@dataclass
class Epic:
    """Represents an epic containing multiple user stories."""
    title: str
    stories: List[UserStory]


class StoryParser:
    """Parser for user stories text file."""
    
    def __init__(self):
        self.priority_pattern = r'\[(\w+)\]'
        self.story_points_pattern = r'\{(\d+)\}'
    
    def parse_file(self, file_path: str) -> List[Epic]:
        """
        Parse user stories from a text file.
        
        Args:
            file_path: Path to the user stories file
            
        Returns:
            List of Epic objects containing parsed stories
        """
        epics = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
        except FileNotFoundError:
            raise FileNotFoundError(f"User stories file not found: {file_path}")
        except Exception as e:
            raise Exception(f"Error reading file {file_path}: {str(e)}")
        
        # Split content into sections by EPIC lines
        epic_sections = self._split_into_epics(content)
        
        for section in epic_sections:
            epic = self._parse_epic_section(section)
            if epic and epic.stories:  # Only add epics that have stories
                epics.append(epic)
        
        return epics
    
    def _split_into_epics(self, content: str) -> List[str]:
        """Split content into epic sections."""
        lines = content.strip().split('\n')
        sections = []
        current_section = []
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines and comments
            if not line or line.startswith('#'):
                continue
            
            if line.startswith('EPIC:'):
                # Start a new epic section
                if current_section:
                    sections.append('\n'.join(current_section))
                current_section = [line]
            else:
                current_section.append(line)
        
        # Add the last section
        if current_section:
            sections.append('\n'.join(current_section))
        
        return sections
    
    def _parse_epic_section(self, section: str) -> Optional[Epic]:
        """Parse a single epic section."""
        lines = section.strip().split('\n')
        
        if not lines:
            return None
        
        # First line should be the epic title
        epic_line = lines[0]
        if not epic_line.startswith('EPIC:'):
            return None
        
        epic_title = epic_line.replace('EPIC:', '').strip()
        stories = []
        
        # Parse stories from remaining lines
        for line in lines[1:]:
            line = line.strip()
            if line.startswith('-'):
                story = self._parse_story(line)
                if story:
                    stories.append(story)
        
        return Epic(title=epic_title, stories=stories)
    
    def _parse_story(self, line: str) -> Optional[UserStory]:
        """Parse a single user story line."""
        # Remove the leading dash
        content = line[1:].strip()
        
        if not content:
            return None
        
        # Extract priority if present
        priority = None
        priority_match = re.search(self.priority_pattern, content)
        if priority_match:
            priority = priority_match.group(1)
            content = re.sub(self.priority_pattern, '', content).strip()
        
        # Extract story points if present
        story_points = None
        points_match = re.search(self.story_points_pattern, content)
        if points_match:
            story_points = int(points_match.group(1))
            content = re.sub(self.story_points_pattern, '', content).strip()
        
        # The remaining content is the story description
        description = content
        
        # Generate a title from the description (first part before "so that")
        title = self._generate_title(description)
        
        return UserStory(
            title=title,
            description=description,
            priority=priority,
            story_points=story_points
        )
    
    def _generate_title(self, description: str) -> str:
        """Generate a concise title from the story description."""
        # Try to extract the main action from "As a ... I want to ..."
        want_match = re.search(r'I want to ([^,]+)', description, re.IGNORECASE)
        if want_match:
            action = want_match.group(1).strip()
            # Capitalize first letter and ensure it's not too long
            title = action[0].upper() + action[1:] if action else description
            if len(title) > 60:
                title = title[:57] + "..."
            return title
        
        # Fallback: use first 60 characters
        if len(description) > 60:
            return description[:57] + "..."
        return description


def main():
    """Test the parser with the sample file."""
    parser = StoryParser()
    try:
        epics = parser.parse_file('user_stories.txt')
        
        print(f"Parsed {len(epics)} epics:")
        for epic in epics:
            print(f"\nEpic: {epic.title}")
            print(f"  Stories: {len(epic.stories)}")
            for story in epic.stories:
                print(f"    - {story.title}")
                if story.priority:
                    print(f"      Priority: {story.priority}")
                if story.story_points:
                    print(f"      Story Points: {story.story_points}")
    
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()