"""
Fake Image Detection Module for Wildlife Guardian
Uses Error Level Analysis (ELA) and metadata checking to detect manipulated images
"""

import cv2
import numpy as np
from PIL import Image
from PIL.ExifTags import TAGS
import os
from datetime import datetime

class FakeImageDetector:
    def __init__(self):
        """Initialize the fake image detector"""
        self.ela_threshold = 15  # Threshold for ELA detection
        
    def get_image_metadata(self, image_path):
        """Extract EXIF metadata from image"""
        try:
            image = Image.open(image_path)
            exif_data = {}
            
            if hasattr(image, '_getexif') and image._getexif():
                exif = image._getexif()
                for tag_id, value in exif.items():
                    tag = TAGS.get(tag_id, tag_id)
                    exif_data[tag] = value
            
            return exif_data
        except Exception as e:
            print(f"[ERROR] Could not extract metadata: {e}")
            return {}
    
    def error_level_analysis(self, image_path, quality=95):
        """
        Perform Error Level Analysis (ELA) to detect image manipulation
        
        ELA works by re-saving the image at a known quality level and comparing
        the difference. Manipulated areas will show different error levels.
        """
        try:
            # Read original image
            original = cv2.imread(image_path)
            if original is None:
                return None, 0.0
            
            # Create temporary compressed version
            temp_path = "temp_ela.jpg"
            cv2.imwrite(temp_path, original, [cv2.IMWRITE_JPEG_QUALITY, quality])
            
            # Read compressed version
            compressed = cv2.imread(temp_path)
            
            # Calculate difference
            ela_image = cv2.absdiff(original, compressed)
            
            # Convert to grayscale for analysis
            ela_gray = cv2.cvtColor(ela_image, cv2.COLOR_BGR2GRAY)
            
            # Calculate mean error level
            mean_error = np.mean(ela_gray)
            max_error = np.max(ela_gray)
            
            # Enhance ELA image for visualization
            ela_enhanced = cv2.normalize(ela_gray, None, 0, 255, cv2.NORM_MINMAX)
            
            # Clean up
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
            # Calculate authenticity score (0-100, higher = more authentic)
            # If error levels are uniform and low, image is likely authentic
            authenticity_score = max(0, 100 - (mean_error * 2))
            
            return ela_enhanced, authenticity_score
            
        except Exception as e:
            print(f"[ERROR] ELA failed: {e}")
            return None, 0.0
    
    def check_metadata_consistency(self, metadata):
        """
        Check if metadata is consistent with a real photo
        Returns: (is_consistent, issues_found)
        """
        issues = []
        
        # Check for missing critical metadata
        if not metadata:
            issues.append("No EXIF data found (possible screenshot or edited image)")
        
        # Check for camera information
        if 'Make' not in metadata and 'Model' not in metadata:
            issues.append("No camera information found")
        
        # Check for software editing
        if 'Software' in metadata:
            software = str(metadata['Software']).lower()
            editing_tools = ['photoshop', 'gimp', 'paint', 'canva', 'pixlr']
            if any(tool in software for tool in editing_tools):
                issues.append(f"Image edited with: {metadata['Software']}")
        
        # Check for date/time
        if 'DateTime' not in metadata:
            issues.append("No timestamp found")
        
        is_consistent = len(issues) == 0
        return is_consistent, issues
    
    def detect_fake(self, image_path):
        """
        Main detection function that combines multiple techniques
        
        Returns:
            dict: {
                'is_authentic': bool,
                'confidence': float (0-100),
                'ela_score': float,
                'metadata_issues': list,
                'verdict': str
            }
        """
        print(f"\n[ANALYSIS] Checking image: {image_path}")
        
        # 1. Error Level Analysis
        ela_image, ela_score = self.error_level_analysis(image_path)
        print(f"[ELA] Authenticity Score: {ela_score:.2f}/100")
        
        # 2. Metadata Analysis
        metadata = self.get_image_metadata(image_path)
        metadata_consistent, metadata_issues = self.check_metadata_consistency(metadata)
        print(f"[METADATA] Consistent: {metadata_consistent}")
        if metadata_issues:
            for issue in metadata_issues:
                print(f"  - {issue}")
        
        # 3. Calculate overall confidence
        # Weight: ELA (70%), Metadata (30%)
        ela_weight = 0.7
        metadata_weight = 0.3
        
        metadata_score = 100 if metadata_consistent else 30
        overall_confidence = (ela_score * ela_weight) + (metadata_score * metadata_weight)
        
        # 4. Determine verdict
        is_authentic = overall_confidence >= 60
        
        if overall_confidence >= 80:
            verdict = "AUTHENTIC - High confidence"
        elif overall_confidence >= 60:
            verdict = "LIKELY AUTHENTIC - Moderate confidence"
        elif overall_confidence >= 40:
            verdict = "SUSPICIOUS - Low confidence"
        else:
            verdict = "LIKELY FAKE - Very low confidence"
        
        result = {
            'is_authentic': is_authentic,
            'confidence': overall_confidence,
            'ela_score': ela_score,
            'metadata_issues': metadata_issues,
            'verdict': verdict,
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        print(f"\n[VERDICT] {verdict} (Confidence: {overall_confidence:.1f}%)")
        print("=" * 60)
        
        return result


# Example usage
if __name__ == "__main__":
    detector = FakeImageDetector()
    
    # Test with an image
    test_image = r"C:\Users\sayoo\Downloads\test_wildlife.jpg"
    
    if os.path.exists(test_image):
        result = detector.detect_fake(test_image)
        
        print("\n📊 DETECTION REPORT")
        print(f"Authentic: {result['is_authentic']}")
        print(f"Confidence: {result['confidence']:.1f}%")
        print(f"Verdict: {result['verdict']}")
        
        if result['metadata_issues']:
            print("\n⚠️ Metadata Issues:")
            for issue in result['metadata_issues']:
                print(f"  - {issue}")
    else:
        print(f"[ERROR] Test image not found: {test_image}")
        print("\nTo test, replace 'test_image' path with an actual image file.")
