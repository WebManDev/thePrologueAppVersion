import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth } from '../firebaseConfig';

export interface UploadResult {
  success: boolean;
  downloadURL?: string;
  error?: string;
}

export const uploadImageToFirebase = async (
  imageUri: string, 
  type: 'profile' | 'cover' | 'post',
  onProgress?: (progress: string) => void
): Promise<UploadResult> => {
  try {
    console.log('Starting upload with auth state:', auth.currentUser ? 'Authenticated' : 'Not authenticated');
    console.log('Current user UID:', auth.currentUser?.uid);
    console.log('Image URI:', imageUri);
    console.log('Upload type:', type);
    
    if (!auth.currentUser) {
      return { success: false, error: 'No authenticated user found' };
    }

    onProgress?.('Fetching image...');
    
    // Convert local file URI to Blob
    let blob: Blob;
    try {
      console.log('Processing image URI:', imageUri);
      
      // Use fetch API to convert file URI to Blob
      const response = await fetch(imageUri);
      if (!response.ok) {
        console.error('Fetch response not ok:', response.status, response.statusText);
        return { 
          success: false, 
          error: `Failed to fetch image: ${response.status} ${response.statusText}` 
        };
      }
      
      blob = await response.blob();
      console.log('Blob created successfully, size:', blob.size, 'type:', blob.type);
      
    } catch (fetchError) {
      console.error('Error fetching image:', fetchError);
      return { 
        success: false, 
        error: 'Failed to process image file. Please try again.' 
      };
    }

    onProgress?.('Processing image...');

    // Validate file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (blob.size > maxSize) {
      return { 
        success: false, 
        error: 'Image file is too large. Please select an image smaller than 5MB.' 
      };
    }

    // Validate file type or set default
    if (!blob.type || blob.type === '') {
      console.log('No content type detected, setting to image/jpeg');
      blob = new Blob([blob], { type: 'image/jpeg' });
    } else if (!blob.type.startsWith('image/')) {
      return { 
        success: false, 
        error: 'Selected file is not an image. Please select a valid image file.' 
      };
    }

    const storage = getStorage();
    const uid = auth.currentUser.uid;
    const timestamp = Date.now();
    const fileName = `${type}-${uid}-${timestamp}.jpg`;
    
    // Use organized storage paths like the web app
    const storageRef = ref(storage, type === 'post' ? `blog-covers/${uid}/${timestamp}_${fileName}` : `athlete-${type}-pics/${fileName}`);

    onProgress?.('Uploading to Firebase...');
    console.log('Uploading blob to Firebase Storage:', {
      size: blob.size,
      type: blob.type,
      path: storageRef.fullPath
    });
    
    // Upload the blob to Firebase Storage
    try {
      await uploadBytes(storageRef, blob, {
        contentType: blob.type || 'image/jpeg',
        customMetadata: {
          uploadedBy: uid,
          uploadType: type,
          originalSize: blob.size.toString(),
          uploadedAt: new Date().toISOString(),
        }
      });
      console.log('Upload successful');
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    onProgress?.('Getting download URL...');
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    onProgress?.('Upload complete!');
    
    return { success: true, downloadURL };
    
  } catch (error) {
    console.error('Error uploading image:', error);
    console.error('Error details:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      serverResponse: (error as any)?.serverResponse,
    });
    
    let errorMessage = 'Failed to upload photo. Please try again.';
    if (error instanceof Error) {
      if (error.message.includes('storage/unauthorized')) {
        errorMessage = 'Upload failed: Unauthorized. Please check your permissions.';
      } else if (error.message.includes('storage/quota-exceeded')) {
        errorMessage = 'Upload failed: Storage quota exceeded.';
      } else if (error.message.includes('storage/retry-limit-exceeded')) {
        errorMessage = 'Upload failed: Network error. Please check your connection and try again.';
      } else if (error.message.includes('storage/unknown')) {
        errorMessage = 'Upload failed: Storage configuration issue. Please check Firebase Storage rules.';
      } else {
        errorMessage = `Upload failed: ${error.message}`;
      }
    }
    
    return { success: false, error: errorMessage };
  }
};

export const deleteImageFromFirebase = async (imageUrl: string): Promise<boolean> => {
  try {
    const storage = getStorage();
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
    console.log('Image deleted from Firebase Storage');
    return true;
  } catch (error) {
    console.error('Error deleting image from storage:', error);
    return false;
  }
};

export const validateImageFile = (fileSize?: number, fileType?: string): string | null => {
  if (fileSize && fileSize > 5 * 1024 * 1024) {
    return 'Image file is too large. Please select an image smaller than 5MB.';
  }
  
  // Only validate file type if it's provided and not empty
  if (fileType && fileType.trim() !== '' && !fileType.startsWith('image/')) {
    return 'Selected file is not an image. Please select a valid image file.';
  }
  
  return null;
};

// Test function to check Firebase Storage access
export const testFirebaseStorage = async (): Promise<boolean> => {
  try {
    const storage = getStorage();
    // Use a path that's allowed by our storage rules
    const testRef = ref(storage, 'athlete-profile-pics/test-upload.txt');
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    
    console.log('Testing Firebase Storage access...');
    console.log('Test blob size:', testBlob.size, 'type:', testBlob.type);
    
    await uploadBytes(testRef, testBlob);
    console.log('Firebase Storage test successful');
    
    // Clean up test file
    await deleteObject(testRef);
    return true;
  } catch (error) {
    console.error('Firebase Storage test failed:', error);
    console.error('Error details:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
    });
    return false;
  }
}; 