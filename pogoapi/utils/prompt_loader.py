"""
Utility for loading prompts from files.
"""

import os
from typing import Dict
from pathlib import Path

class PromptLoader:
    """
    Loads and manages prompts from files
    """
    
    def __init__(self, prompts_dir: str = "prompts"):
        """
        Initialize with prompts directory
        """
        # Get the absolute path to the prompts directory
        self.prompts_dir = str(Path(__file__).parent.parent / prompts_dir)
        self._prompts: Dict[str, str] = {}
        
    def get_prompt(self, prompt_name: str) -> str:
        """
        Get prompt content by name
        
        Args:
            prompt_name: Name of the prompt file (without .txt extension)
            
        Returns:
            str: Prompt content
            
        Raises:
            FileNotFoundError: If prompt file doesn't exist
        """
        # Check cache first
        if prompt_name in self._prompts:
            return self._prompts[prompt_name]
            
        # Load from file
        prompt_path = os.path.join(self.prompts_dir, f"{prompt_name}.txt")
        if not os.path.exists(prompt_path):
            raise FileNotFoundError(f"Prompt file not found: {prompt_path}")
            
        with open(prompt_path, "r", encoding="utf-8") as f:
            content = f.read().strip()
            
        # Cache the prompt
        self._prompts[prompt_name] = content
        return content 