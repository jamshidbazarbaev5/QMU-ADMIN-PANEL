import { useState, useEffect } from "react";
import { PageHeader } from "../helpers/PageHeader";
import { TranslatedForm } from "../helpers/TranslatedForm";
import { useNavigate, useParams } from "react-router-dom";
import api2 from '../api/api2';

interface PostFormProps {
  initialData?: any;
  isEditing?: boolean;
}

interface TranslatedField {
  name: string;
  label: string;
  type: "text" | "textarea" | "richtext";
  required?: boolean;
  editorConfig?: any;
}

interface FileWithId {
  id?: number;
  name: string;
  url: string;
}

export function DraftForm({ initialData, isEditing }: PostFormProps) {
  const navigate = useNavigate();
  const { slug } = useParams();
 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postData, setPostData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [existingFiles, setExistingFiles] = useState<FileWithId[]>([]);
  const [, setCombinedFiles] = useState<any[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<number[]>([]);

  useEffect(() => {
    const fetchPost = async () => {
      if (!isEditing || !slug) return;

      try {
        setIsLoading(true);
        const response = await api2.get(`/publications/drafts/${slug}/`);
        const data = response.data;
        
        // Ensure all language translations exist
        const fullTranslations = {
          en: { title: "", description: "", slug: "" },
          ru: { title: "", description: "", slug: "" },
          uz: { title: "", description: "", slug: "" },
          kk: { title: "", description: "", slug: "" },
          ...data.translations,
        };

        // Set the same slug for all languages
        const availableSlug =
          data.translations.en?.slug ||
          data.translations.ru?.slug ||
          data.translations.uz?.slug ||
          data.translations.kk?.slug;

        if (availableSlug) {
          Object.keys(fullTranslations).forEach((lang) => {
            if (fullTranslations[lang]) {
              fullTranslations[lang].slug = availableSlug;
            }
          });
        }

        // Set the post data with translations
        setPostData({
          ...data,
          translations: fullTranslations,
        });

        // Handle files if they exist
        if (data.draft_files && Array.isArray(data.draft_files)) {
          const files = data.draft_files.map((fileObj: any) => ({
            id: fileObj.id,
            name: fileObj.file.split("/").pop(),
            url: fileObj.file,
          }));
          setExistingFiles(files);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        setErrorMessage("Error loading draft data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug, isEditing]);

  const handleFileUpload = (file: File) => {
    if (file.type.startsWith("image/")) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } else {
      setUploadedFiles(prevFiles => {
        const fileExists = prevFiles.some(f => 
          f.name === file.name || 
          (f.url && f.url.endsWith(file.name))
        );
        
        if (!fileExists) {
          return [...prevFiles, file];
        }
        return prevFiles;
      });
    }
  };


  useEffect(() => {
    const Files = [...existingFiles, ...uploadedFiles];
    setCombinedFiles(Files);
  }, [existingFiles, uploadedFiles]);

  

  if (isLoading) {
    return <div className="container mx-auto p-6 mt-[50px]">Loading...</div>;
  }

  const fields: TranslatedField[] = [
    { name: "title", label: "Title", type: "text", required: true },
    {
      name: "description",
      label: "Description",
      type: "richtext",
      required: false,
      editorConfig: {
        onFileUpload: handleFileUpload,
        images_upload_handler: handleFileUpload,
      },
    },
  ];

  const handleSubmit = async (translationsData: any) => {
    try {
      setIsSubmitting(true);

      // Debug log to see what translations look like
      console.log('Incoming translations:', translationsData);

      const translations = translationsData.translations;

      // Check if there's at least one valid translation
      const hasValidTranslation = Object.values(translations).some(
        (translation: any) => translation.title && translation.title.trim() !== ''
      );

      console.log('Has valid translation:', hasValidTranslation);

      if (!hasValidTranslation) {
        throw new Error("At least one translation must be provided");
      }

      const formData = new FormData();

      // Filter out translations with empty title
      const filteredTranslations = Object.fromEntries(
        Object.entries(translations).filter(([_, translation]: [string, any]) => {
          return translation.title && translation.title.trim() !== '';
        })
      );

      console.log('Filtered translations:', filteredTranslations);

      formData.append('translations', JSON.stringify(filteredTranslations));

  
   

      // Add uploaded files with numeric indices
      uploadedFiles.forEach((file, index) => {
        if (file instanceof File) {
          formData.append(`files[${index}]file`, file);
        }
      });

      // Add all files to delete
      if (filesToDelete.length > 0) {
        filesToDelete.forEach(fileId => {
          formData.append('files_to_delete', fileId.toString());
        });
      }

      // Debug log to verify the format
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const url = isEditing 
        ? `/publications/posts/${slug}/`
        : '/publications/posts/';
  
     await api2({
        method: isEditing ? 'put' : 'post',
        url: url,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });


      
  
      navigate('/karsu-new-admin-panel/posts');
    } catch (error: any) {
      console.error('Error saving post:', error);
      setErrorMessage(
        error.response?.data?.translations?.[0] || 
        error.response?.data?.message || 
        error.message || 
        'An error occurred while saving the post'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileDelete = (file: FileWithId) => {
    if (file.id !== undefined) {
      setFilesToDelete(prev => [...prev, Number(file.id)]);
      setExistingFiles(prev => prev.filter(f => f.id !== file.id));
    }
  };


  return (
    <div className="container mx-auto p-6 mt-[50px]">
      <PageHeader
        title={isEditing ? "Edit Post" : "Create Post"}
        createButtonLabel="Back to Posts"
        onCreateClick={() => navigate(
          '/karsu-new-admin-panel/posts'
        )}
      />

      <div className="bg-white rounded-lg shadow p-6">
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {errorMessage}
          </div>
        )}

      

       


        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Uploaded Files
          </label>
          <div className="space-y-2">
            {existingFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {file.name}
                </a>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleFileDelete(file)}
                >
                  Remove
                </button>
              </div>
            ))}
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <a
                  href={file.url || URL.createObjectURL(file)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {file.name}
                </a>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => {
                    setUploadedFiles((prev) =>
                      prev.filter((_, i) => i !== index)
                    );
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <TranslatedForm
          fields={fields}
          languages={["en", "ru", "uz", "kk"]}
          initialData={postData?.translations}
          onSubmit={handleSubmit}
          submitButton={
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-[#6C5DD3] text-white rounded-lg hover:bg-[#5b4eb8] transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Update Post"
                : "Create Post"}
            </button>
          }
          // sharedFields={uploadedFiles}
        />
      </div>
    </div>
  );
}
