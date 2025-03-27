import { useState, useEffect } from "react";
import { PageHeader } from "../helpers/PageHeader";
import { TranslatedForm } from "../helpers/TranslatedForm";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import api2 from '../api/api2';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

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

interface MainMenuItem {
  id: number;
  parent: number | null;
  translations: {
    [key: string]: {
      name: string;
      title: string;
      slug: string;
    };
  };
  menu_posts: number[];
}

interface FooterMenuItem {
  id: number;
  parent: number | null;
  translations: {
    [key: string]: {
      name: string;
      slug: string;
    };
  };
  footer_menu_posts: number[];
}

interface FileWithId {
  id?: number;
  name: string;
  url: string;
}

// interface UploadedFile extends File {
//   url?: string;
// }

export function PostForm({ initialData, isEditing }: PostFormProps) {
  const navigate = useNavigate();
  const { slug } = useParams();
  const currentLanguage = useLanguage();
  const [selectedImage, setSelectedImage] = useState<{
    file: File | null;
    preview?: string;
  }>({
    file: null,
    preview: initialData?.main_image || undefined
  });
  const [selectedMenu, setSelectedMenu] = useState(initialData?.menu || "");
  const [selectedFooterMenu, setSelectedFooterMenu] = useState(
    initialData?.footer_menu || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postData, setPostData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MainMenuItem[]>([]);
  const [footerMenuItems, setFooterMenuItems] = useState<FooterMenuItem[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<{
    id: number;
    image: string;
  }[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [selectedParentMenu, setSelectedParentMenu] = useState<string>("");
  const [selectedParentFooterMenu, setSelectedParentFooterMenu] =
    useState<string>("");
  const [activeMenuType, setActiveMenuType] = useState<
    "header" | "footer" | null
  >(null);
  const [hasImages, setHasImages] = useState<boolean | null>(
    initialData
      ? !!initialData.main_image || !!initialData.images?.length
      : null
  );
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [existingFiles, setExistingFiles] = useState<FileWithId[]>([]);
  const [combinedFiles, setCombinedFiles] = useState<any[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<number[]>([]);
  useEffect(() => {
    const fetchPost = async () => {
      if (!isEditing || !slug) return;

      try {
        setIsLoading(true);
        const response = await api2.get(`/publications/posts/${slug}/`);
        const data = response.data;

        if (data.main_image || (data.images && data.images.length > 0)) {
          setHasImages(true);
        }

        if (data.main_image) {
          setSelectedImage({
            file: null,
            preview: data.main_image
          });
        }

        if (data.images) {
          const images = data.images.map((imageObj: any) => ({
            id: imageObj.id,
            image: imageObj.image,
          }));
          setExistingImages(images);
        }

        if (data.menu) {
          const menuItem = menuItems.find((m) => m.id === data.menu);
          if (menuItem?.parent) {
            setSelectedParentMenu(menuItem.parent.toString());
            setSelectedMenu(menuItem.id.toString());
          } else {
            setSelectedParentMenu(data.menu.toString());
          }
        }

        if (data.footer_menu) {
          const footerMenuItem = footerMenuItems.find(
            (m) => m.id === data.footer_menu
          );
          if (footerMenuItem?.parent) {
            setSelectedParentFooterMenu(footerMenuItem.parent.toString());
            setSelectedFooterMenu(footerMenuItem.id.toString());
          } else {
            setSelectedParentFooterMenu(data.footer_menu.toString());
          }
        }

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

        setPostData({
          ...data,
          translations: fullTranslations,
        });

        if (data.files) {
          const files = data.files.map((fileObj: any) => ({
            id: fileObj.id,
            name: fileObj.file.split("/").pop(),
            url: fileObj.file,
          }));
          setExistingFiles(files);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        navigate("/karsu-admin-panel/posts");
      } finally {
        setIsLoading(false);
      }
    };

    if (menuItems.length > 0 && footerMenuItems.length > 0) {
      fetchPost();
    }
  }, [slug, isEditing, navigate, menuItems, footerMenuItems]);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const [mainMenuResponse, footerMenuResponse] = await Promise.all([
          api2.get("/menus/main/"),
          api2.get("/menus/footer/"),
        ]);

        console.log("All menus:", mainMenuResponse.data);
        setMenuItems(mainMenuResponse.data);

        console.log("All footer menus:", footerMenuResponse.data);
        setFooterMenuItems(footerMenuResponse.data);
      } catch (error) {
        console.error("Error fetching menu items:", error);
      }
    };

    fetchMenuItems();
  }, []);

  useEffect(() => {
    if (initialData?.menu) {
      setActiveMenuType("header");
    } else if (initialData?.footer_menu) {
      setActiveMenuType("footer");
    }
  }, [initialData]);

  const handleAdditionalImages = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setUploadedImages((prev) => [...prev, ...newFiles]);
    }
  };

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

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setSelectedImage({
        file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  useEffect(() => {
    const Files = [...existingFiles, ...uploadedFiles];
    setCombinedFiles(Files);
  }, [existingFiles, uploadedFiles]);

  if (!isEditing && hasImages === null) {
    return (
      <div className="container mx-auto p-6 mt-[50px]">
        <PageHeader
          title="Create Post"
          createButtonLabel="Back to Posts"
          onCreateClick={() => navigate("/karsu-admin-panel/posts")}
        />
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">
            Would you like to include images in this post?
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => setHasImages(true)}
              className="px-6 py-3 bg-[#6C5DD3] text-white rounded-lg hover:bg-[#5b4eb8] transition-colors"
            >
              Yes, include images
            </button>
            <button
              onClick={() => setHasImages(false)}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              No, text only
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      // Add main image if selected
      if (selectedImage?.file) {
        formData.append('main_image', selectedImage.file);
      }

      // Add additional images with numeric indices
      uploadedImages.forEach((image, index) => {
        formData.append(`images[${index}]image`, image);
      });

      // Add all images to delete
      if (imagesToDelete.length > 0) {
        imagesToDelete.forEach(imageId => {
          formData.append('images_to_delete', imageId.toString());
        });
      }

      // Add menu selections if present
      if (selectedMenu && selectedMenu !== '_none') {
        formData.append('menu', selectedMenu);
      }
      if (selectedFooterMenu && selectedFooterMenu !== '_none') {
        formData.append('footer_menu', selectedFooterMenu);
      }

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


      
  
      navigate('/karsu-admin-panel/posts');
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

  const handleImageDelete = (image: { id: number; image: string }) => {
    if (image.id !== undefined) {
      setImagesToDelete(prev => [...prev, Number(image.id)]);
      setExistingImages(prev => prev.filter(img => img.id !== image.id));
    }
  };

  const getParentMenuItems = (items: MainMenuItem[]) => {
    return items.filter((item) => item.parent === null);
  };

  const getSubMenuItems = (items: MainMenuItem[], parentId: number) => {
    return items.filter((item) => item.parent === parentId);
  };

  const getParentFooterMenuItems = (items: FooterMenuItem[]) => {
    return items.filter((item) => item.parent === null);
  };

  const getSubFooterMenuItems = (items: FooterMenuItem[], parentId: number) => {
    return items.filter((item) => item.parent === parentId);
  };


  console.log('existing files',existingFiles)
  console.log('uploaded files',uploadedFiles)

  console.log('combined files',combinedFiles) 

  return (
    <div className="container mx-auto p-6 mt-[50px]">
      <PageHeader
        title={isEditing ? "Edit Post" : "Create Post"}
        createButtonLabel="Back to Posts"
        onCreateClick={() => navigate("/karsu-admin-panel/posts")}
      />

      <div className="bg-white rounded-lg shadow p-6">
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {errorMessage}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Header Menu
          </label>
          <div className="space-y-4">
            <Select
              disabled={activeMenuType === "footer"}
              value={selectedParentMenu}
              onValueChange={(value) => {
                setSelectedParentMenu(value);
                setSelectedMenu("");
                if (value === "_none") {
                  setActiveMenuType(null);
                } else if (value) {
                  setActiveMenuType("header");
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Not in Header Menu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Not in Header Menu</SelectItem>
                {getParentMenuItems(menuItems).map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.translations[currentLanguage]?.name ||
                      item.translations["en"]?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedParentMenu && (
              <Select
                value={selectedMenu}
                onValueChange={(value) =>
                  setSelectedMenu(value === "_none" ? "" : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Sub-menu (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">
                    Select Sub-menu (Optional)
                  </SelectItem>
                  {getSubMenuItems(menuItems, Number(selectedParentMenu)).map(
                    (item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.translations[currentLanguage]?.name ||
                          item.translations["en"]?.name}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Footer Menu
          </label>
          <div className="space-y-4">
            <Select
              disabled={activeMenuType === "header"}
              value={selectedParentFooterMenu}
              onValueChange={(value) => {
                setSelectedParentFooterMenu(value);
                setSelectedFooterMenu("");
                if (value === "_none") {
                  setActiveMenuType(null);
                } else if (value) {
                  setActiveMenuType("footer");
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Not in Footer Menu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Not in Footer Menu</SelectItem>
                {getParentFooterMenuItems(footerMenuItems).map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.translations[currentLanguage]?.name ||
                      item.translations["en"]?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedParentFooterMenu && (
              <Select
                value={selectedFooterMenu}
                onValueChange={(value) =>
                  setSelectedFooterMenu(value === "_none" ? "" : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Sub-menu (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">
                    Select Sub-menu (Optional)
                  </SelectItem>
                  {getSubFooterMenuItems(
                    footerMenuItems,
                    Number(selectedParentFooterMenu)
                  ).map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.translations[currentLanguage]?.name ||
                        item.translations["en"]?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Show image fields if hasImages is true or we're editing a post with images */}
        {(hasImages || (isEditing && (initialData?.main_image || initialData?.images?.length > 0))) && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleMainImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#6C5DD3] file:text-white hover:file:bg-[#5b4eb8]"
              />
              {(selectedImage.preview || initialData?.main_image) && (
                <div className="mt-2 relative">
                  <img
                    src={selectedImage.preview || initialData.main_image}
                    alt="Main"
                    className="h-32 object-cover rounded"
                  />
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                    onClick={() => setSelectedImage({ file: null, preview: undefined })}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Images
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleAdditionalImages(e.target.files)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#6C5DD3] file:text-white hover:file:bg-[#5b4eb8]"
              />

              <div className="grid grid-cols-4 gap-4 mt-4">
                {existingImages.map((image) => (
                  <div key={image.id} className="relative">
                    <img
                      src={image.image}
                      alt={`Existing ${image.id}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                      onClick={() => handleImageDelete(image)}
                    >
                      ×
                    </button>
                  </div>
                ))}

                {uploadedImages.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                      onClick={() => {
                        setUploadedImages((prev) =>
                          prev.filter((_, i) => i !== index)
                        );
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Display uploaded files */}
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
