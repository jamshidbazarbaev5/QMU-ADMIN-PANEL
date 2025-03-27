import { useState, useEffect } from "react";
import { PageHeader } from "../helpers/PageHeader";
import { TranslatedForm } from "../helpers/TranslatedForm";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { fetchWithAuth, getAuthHeader } from "../api/api";
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


// interface UploadedFile extends File {
//   url?: string;
// }

export function PostForm({ initialData, isEditing }: PostFormProps) {
  const navigate = useNavigate();
  const { slug } = useParams();
  const currentLanguage = useLanguage();
  const token = localStorage.getItem("accessToken");
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
  const [existingImages, setExistingImages] = useState<any[]>([]);
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
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [combinedFiles, setCombinedFiles] = useState<any[]>([]);
  useEffect(() => {
    const fetchPost = async () => {
      if (!isEditing || !slug) return;
      if (!token) {
        console.error("No token found");
        navigate("/karsu-admin-panel/login");
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetchWithAuth(
          `https://karsu.uz/api/publications/posts/${slug}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        // Set hasImages to true if there are any images
        if (data.main_image || (data.images && data.images.length > 0)) {
          setHasImages(true);
        }

        // Set main image if it exists
        if (data.main_image) {
          setSelectedImage({
            file: null,
            preview: data.main_image
          });
        }

        // Set existing additional images
        setExistingImages(data.images || []);

        // Set the menu data
        if (data.menu) {
          const menuItem = menuItems.find((m) => m.id === data.menu);
          if (menuItem?.parent) {
            // If it's a child menu
            setSelectedParentMenu(menuItem.parent.toString());
            setSelectedMenu(menuItem.id.toString());
          } else {
            // If it's a parent menu
            setSelectedParentMenu(data.menu.toString());
          }
        }

        // Set the footer menu data
        if (data.footer_menu) {
          const footerMenuItem = footerMenuItems.find(
            (m) => m.id === data.footer_menu
          );
          if (footerMenuItem?.parent) {
            // If it's a child menu
            setSelectedParentFooterMenu(footerMenuItem.parent.toString());
            setSelectedFooterMenu(footerMenuItem.id.toString());
          } else {
            // If it's a parent menu
            setSelectedParentFooterMenu(data.footer_menu.toString());
          }
        }

        // Initialize empty translations for all languages if they don't exist
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
  }, [slug, isEditing, token, navigate, menuItems, footerMenuItems]);
  console.log("files", uploadedFiles);
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const [mainMenuResponse, footerMenuResponse] = await Promise.all([
          fetchWithAuth("https://karsu.uz/api/menus/main/", {
            headers: { ...getAuthHeader() },
          }),
          fetchWithAuth("https://karsu.uz/api/menus/footer/", {
            headers: { ...getAuthHeader() },
          }),
        ]);

        if (!mainMenuResponse.ok || !footerMenuResponse.ok) {
          throw new Error("Failed to fetch menu items");
        }

        const mainMenuData = await mainMenuResponse.json();
        const footerMenuData = await footerMenuResponse.json();

        console.log("All menus:", mainMenuData);
        setMenuItems(mainMenuData);

        console.log("All footer menus:", footerMenuData);
        setFooterMenuItems(footerMenuData);
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
      const fileExists = uploadedFiles.some(f => 
        f.name === file.name || 
        (f.url && f.url.endsWith(file.name))
      );
      
      if (!fileExists) {
        setUploadedFiles(prev => [...prev, file]);
      }
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

  // Add this useEffect to update combinedFiles whenever existingFiles or uploadedFiles change
  useEffect(() => {
    const combined = [
      ...existingFiles,
      ...uploadedFiles
    ];
    setCombinedFiles(combined);
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

  const handleSubmit = async (translations: any) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      
      // Filter translations
      const filteredTranslations = Object.fromEntries(
        Object.entries(translations.translations).filter(([_, translation]) => {
          const values = Object.values(translation as object);
          return values.some(value => value !== '' && value !== null && value !== undefined);
        })
      );
      
      formData.append('translations', JSON.stringify(filteredTranslations));
      
      // Add main image if selected
      if (selectedImage.file) {
        formData.append('main_image', selectedImage.file);
      }

      // Add new additional images
      uploadedImages.forEach((image) => {
        formData.append('uploaded_images', image);
      });

      // Add menu selections if present
      if (selectedMenu && selectedMenu !== '_none') {
        formData.append('menu', selectedMenu);
      }
      
      if (selectedFooterMenu && selectedFooterMenu !== '_none') {
        formData.append('footer_menu', selectedFooterMenu);
      }

      combinedFiles.forEach(file => {
        if (file instanceof File) {
          formData.append('uploaded_files', file);
        }
      });

      const url = isEditing 
        ? `https://karsu.uz/api/publications/posts/${slug}/`
        : 'https://karsu.uz/api/publications/posts/';
      
      const response = await fetchWithAuth(url, {
        method: isEditing ? 'PUT' : 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error('Failed to save post');
      }

      console.log("formData", formData);

      navigate('/karsu-admin-panel/posts');
    } catch (error) {
      console.error('Error saving post:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred while saving the post');
    } finally {
      setIsSubmitting(false);
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
                {existingImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image.image}
                      alt={`Existing ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                      onClick={() => {
                        setExistingImages((prev) =>
                          prev.filter((_, i) => i !== index)
                        );
                      }}
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
            {existingFiles.map((file, index) => (
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
                        setExistingFiles((prev) =>
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
