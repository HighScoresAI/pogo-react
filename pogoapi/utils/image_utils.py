import os
from PIL import Image
from typing import Tuple, Optional
from werkzeug.exceptions import BadRequest

class ImageProcessor:
    """
    Handles image processing operations including resizing and optimization.
    """
    
    def __init__(self, max_width: int = 1920, max_height: int = 1080, quality: int = 85):
        """
        Initialize with processing parameters.
        
        Args:
            max_width (int): Maximum width for resized images
            max_height (int): Maximum height for resized images
            quality (int): JPEG quality for optimization (1-100)
        """
        self.max_width = max_width
        self.max_height = max_height
        self.quality = quality
        
    def resize_image(self, image_path: str, output_path: str) -> Tuple[bool, Optional[str]]:
        """
        Resize an image while maintaining aspect ratio.
        
        Args:
            image_path (str): Path to input image
            output_path (str): Path to save resized image
            
        Returns:
            Tuple[bool, Optional[str]]: (Success, Error message if any)
            
        Raises:
            BadRequest: If image processing fails
        """
        try:
            with Image.open(image_path) as img:
                # Calculate new dimensions while maintaining aspect ratio
                width, height = img.size
                ratio = min(self.max_width/width, self.max_height/height)
                new_size = (int(width*ratio), int(height*ratio))
                
                # Resize image
                resized_img = img.resize(new_size, Image.Resampling.LANCZOS)
                
                # Save with optimization
                resized_img.save(
                    output_path,
                    'JPEG',
                    quality=self.quality,
                    optimize=True
                )
                
                return True, None
                
        except Exception as e:
            return False, str(e)
            
    def optimize_image(self, image_path: str, output_path: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        """
        Optimize an image without resizing.
        
        Args:
            image_path (str): Path to input image
            output_path (Optional[str]): Path to save optimized image (defaults to input path)
            
        Returns:
            Tuple[bool, Optional[str]]: (Success, Error message if any)
            
        Raises:
            BadRequest: If image processing fails
        """
        try:
            output_path = output_path or image_path
            
            with Image.open(image_path) as img:
                # Save with optimization
                img.save(
                    output_path,
                    'JPEG',
                    quality=self.quality,
                    optimize=True
                )
                
                return True, None
                
        except Exception as e:
            return False, str(e)
            
    def process_session_images(self, session_dir: str) -> Tuple[bool, Optional[str]]:
        """
        Process all images in a session directory.
        
        Args:
            session_dir (str): Path to session directory
            
        Returns:
            Tuple[bool, Optional[str]]: (Success, Error message if any)
            
        Raises:
            BadRequest: If directory processing fails
        """
        try:
            # Create processed directory if it doesn't exist
            processed_dir = os.path.join(session_dir, 'processed')
            os.makedirs(processed_dir, exist_ok=True)
            
            # Process each image in the directory
            for filename in os.listdir(session_dir):
                if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                    input_path = os.path.join(session_dir, filename)
                    output_path = os.path.join(processed_dir, filename)
                    
                    success, error = self.resize_image(input_path, output_path)
                    if not success:
                        return False, f"Failed to process {filename}: {error}"
                        
            return True, None
            
        except Exception as e:
            return False, str(e)
            
    def get_image_dimensions(self, image_path: str) -> Tuple[int, int]:
        """
        Get dimensions of an image.
        
        Args:
            image_path (str): Path to image
            
        Returns:
            Tuple[int, int]: (width, height)
            
        Raises:
            BadRequest: If image cannot be opened
        """
        try:
            with Image.open(image_path) as img:
                return img.size
        except Exception as e:
            raise BadRequest(f"Failed to get image dimensions: {str(e)}")
            
    def validate_image(self, image_path: str) -> bool:
        """
        Validate if a file is a valid image.
        
        Args:
            image_path (str): Path to image
            
        Returns:
            bool: True if valid image, False otherwise
        """
        try:
            with Image.open(image_path) as img:
                img.verify()
                return True
        except:
            return False 