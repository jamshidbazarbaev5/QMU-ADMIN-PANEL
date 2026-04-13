// import { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { PageHeader } from "../helpers/PageHeader";
// import { TranslatedForm } from "../helpers/TranslatedForm";
// import { useLanguage } from "../hooks/useLanguage";
// import { fetchWithAuth, getAuthHeader } from "../api/api";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../components/ui/select";
// import { FooterMenuItem, MainMenuItem, TranslatedField } from "../types/post";

// // ... keep the same interfaces from PostForm ...

// export function EditPostForm() {
//   const navigate = useNavigate();
//   const { slug } = useParams();
//   const currentLanguage = useLanguage();
//   const token = localStorage.getItem("accessToken");
//   const [selectedImage, setSelectedImage] = useState<{
//     file: File | null;
//     preview?: string;
//   }>({ file: null });
//   const [selectedMenu, setSelectedMenu] = useState("");
//   const [selectedFooterMenu, setSelectedFooterMenu] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [postData, setPostData] = useState<any>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
//   const [menuItems, setMenuItems] = useState<MainMenuItem[]>([]);
//   const [footerMenuItems, setFooterMenuItems] = useState<FooterMenuItem[]>([]);
//   const [uploadedImages, setUploadedImages] = useState<File[]>([]);
//   const [existingImages, setExistingImages] = useState<any[]>([]);
//   const [selectedParentMenu, setSelectedParentMenu] = useState<string>("");
//   const [selectedParentFooterMenu, setSelectedParentFooterMenu] = useState<string>("");
//   const [activeMenuType, setActiveMenuType] = useState<"header" | "footer" | null>(null);
//   const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
//   const [existingFiles, setExistingFiles] = useState<any[]>([]);

//   // ... keep the same useEffects and handlers from PostForm ...

//   // Modify handleSubmit to handle updates
//   const handleSubmit = async (translations: any) => {
//     if (!slug) return;

//     try {
//       setIsSubmitting(true);
//       const formData = new FormData();

//       const filteredTranslations = Object.fromEntries(
//         Object.entries(translations.translations).filter(([_, translation]) => {
//           return Object.values(translation as object).some(value => value);
//         })
//       );

//       formData.append('translations', JSON.stringify(filteredTranslations));

//       if (selectedImage?.file) {
//         formData.append('main_image', selectedImage.file);
//       }

//       if (uploadedImages?.length) {
//         uploadedImages.forEach(image => formData.append('uploaded_images', image));
//       }

//       if (selectedMenu && selectedMenu !== '_none') {
//         formData.append('menu', selectedMenu);
//       }
//       if (selectedFooterMenu && selectedFooterMenu !== '_none') {
//         formData.append('footer_menu', selectedFooterMenu);
//       }

//       uploadedFiles.forEach(file => {
//         if (file instanceof File) {
//           formData.append('uploaded_files', file);
//         }
//       });

//       const response = await fetchWithAuth(`https://karsu.uz/api/publications/posts/${slug}/`, {
//         method: 'PUT',
//         body: formData,
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Failed to update post');
//       }

//       navigate('/karsu-admin-panel/posts');
//     } catch (error) {
//       console.error('Error updating post:', error);
//       setErrorMessage(error instanceof Error ? error.message : 'An error occurred while updating the post');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (isLoading) {
//     return <div className="container mx-auto p-6 mt-[50px]">Loading...</div>;
//   }

//   // ... keep the same fields definition ...

//   const fields: TranslatedField[] = [
//     { name: "title", label: "Title", type: "text", required: true },
//     {
//       name: "description",
//       label: "Description",
//       type: "richtext",
//       required: false,
//       editorConfig: {
//         onFileUpload: handleFileUpload,
//         images_upload_handler: handleFileUpload,
//       },
//     },
//   ];

//   return (
//     <div className="container mx-auto p-6 mt-[50px]">
//       <PageHeader
//         title="Edit Post"
//         createButtonLabel="Back to Posts"
//         onCreateClick={() => navigate('${BASE_ROUTE}/posts")}
//       />

//       <div className="bg-white rounded-lg shadow p-6">
//         {errorMessage && (
//           <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
//             {errorMessage}
//           </div>
//         )}

//         <div className="mb-6">
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Header Menu
//           </label>
//           <div className="space-y-4">
//             <Select
//               disabled={activeMenuType === "footer"}
//               value={selectedParentMenu}
//               onValueChange={(value) => {
//                 setSelectedParentMenu(value);
//                 setSelectedMenu("");
//                 if (value === "_none") {
//                   setActiveMenuType(null);
//                 } else if (value) {
//                   setActiveMenuType("header");
//                 }
//               }}
//             >
//               <SelectTrigger className="w-full">
//                 <SelectValue placeholder="Not in Header Menu" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="_none">Not in Header Menu</SelectItem>
//                 {menuItems.filter(item => item.parent === null).map((item) => (
//                   <SelectItem key={item.id} value={item.id.toString()}>
//                     {item.translations[currentLanguage]?.name ||
//                       item.translations["en"]?.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>

//             {selectedParentMenu && selectedParentMenu !== "_none" && (
//               <Select
//                 value={selectedMenu}
//                 onValueChange={(value) =>
//                   setSelectedMenu(value === "_none" ? "" : value)
//                 }
//               >
//                 <SelectTrigger className="w-full">
//                   <SelectValue placeholder="Select Sub-menu (Optional)" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="_none">No Sub-menu</SelectItem>
//                   {menuItems
//                     .filter(item => item.parent === Number(selectedParentMenu))
//                     .map((item) => (
//                       <SelectItem key={item.id} value={item.id.toString()}>
//                         {item.translations[currentLanguage]?.name ||
//                           item.translations["en"]?.name}
//                       </SelectItem>
//                     ))}
//                 </SelectContent>
//               </Select>
//             )}
//           </div>
//         </div>

//         <div className="mb-6">
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Footer Menu
//           </label>
//           <div className="space-y-4">
//             <Select
//               disabled={activeMenuType === "header"}
//               value={selectedParentFooterMenu}
//               onValueChange={(value) => {
//                 setSelectedParentFooterMenu(value);
//                 setSelectedFooterMenu("");
//                 if (value === "_none") {
//                   setActiveMenuType(null);
//                 } else if (value) {
//                   setActiveMenuType("footer");
//                 }
//               }}
//             >
//               <SelectTrigger className="w-full">
//                 <SelectValue placeholder="Not in Footer Menu" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="_none">Not in Footer Menu</SelectItem>
//                 {footerMenuItems.filter(item => item.parent === null).map((item) => (
//                   <SelectItem key={item.id} value={item.id.toString()}>
//                     {item.translations[currentLanguage]?.name ||
//                       item.translations["en"]?.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>

//             {selectedParentFooterMenu && selectedParentFooterMenu !== "_none" && (
//               <Select
//                 value={selectedFooterMenu}
//                 onValueChange={(value) =>
//                   setSelectedFooterMenu(value === "_none" ? "" : value)
//                 }
//               >
//                 <SelectTrigger className="w-full">
//                   <SelectValue placeholder="Select Sub-menu (Optional)" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="_none">No Sub-menu</SelectItem>
//                   {footerMenuItems
//                     .filter(item => item.parent === Number(selectedParentFooterMenu))
//                     .map((item) => (
//                       <SelectItem key={item.id} value={item.id.toString()}>
//                         {item.translations[currentLanguage]?.name ||
//                           item.translations["en"]?.name}
//                       </SelectItem>
//                     ))}
//                 </SelectContent>
//               </Select>
//             )}
//           </div>
//         </div>

//         <div className="mb-6">
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Main Image
//           </label>
//           <input
//             type="file"
//             accept="image/*"
//             onChange={handleMainImageChange}
//             className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#6C5DD3] file:text-white hover:file:bg-[#5b4eb8]"
//           />
//           {selectedImage.preview && (
//             <div className="mt-2 relative">
//               <img
//                 src={selectedImage.preview}
//                 alt="Main"
//                 className="h-32 object-cover rounded"
//               />
//               <button
//                 type="button"
//                 className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
//                 onClick={() => setSelectedImage({ file: null, preview: undefined })}
//               >
//                 ×
//               </button>
//             </div>
//           )}
//         </div>

//         <div className="mb-6">
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Additional Images
//           </label>
//           <input
//             type="file"
//             accept="image/*"
//             multiple
//             onChange={(e) => handleAdditionalImages(e.target.files)}
//             className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#6C5DD3] file:text-white hover:file:bg-[#5b4eb8]"
//           />

//           <div className="grid grid-cols-4 gap-4 mt-4">
//             {existingImages.map((image, index) => (
//               <div key={index} className="relative">
//                 <img
//                   src={image.image}
//                   alt={`Existing ${index + 1}`}
//                   className="w-full h-24 object-cover rounded"
//                 />
//                 <button
//                   type="button"
//                   className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
//                   onClick={() => {
//                     setExistingImages(prev => prev.filter((_, i) => i !== index));
//                   }}
//                 >
//                   ×
//                 </button>
//               </div>
//             ))}

//             {uploadedImages.map((file, index) => (
//               <div key={index} className="relative">
//                 <img
//                   src={URL.createObjectURL(file)}
//                   alt={`Preview ${index + 1}`}
//                   className="w-full h-24 object-cover rounded"
//                 />
//                 <button
//                   type="button"
//                   className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
//                   onClick={() => {
//                     setUploadedImages(prev => prev.filter((_, i) => i !== index));
//                   }}
//                 >
//                   ×
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>

//         <div className="mb-6">
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Uploaded Files
//           </label>
//           <div className="space-y-2">
//             {existingFiles.map((file, index) => (
//               <div
//                 key={index}
//                 className="flex items-center justify-between p-2 bg-gray-50 rounded"
//               >
//                 <a
//                   href={file.url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-blue-600 hover:text-blue-800"
//                 >
//                   {file.name}
//                 </a>
//                 <button
//                   type="button"
//                   className="text-red-500 hover:text-red-700"
//                   onClick={() => {
//                     setExistingFiles(prev => prev.filter((_, i) => i !== index));
//                   }}
//                 >
//                   Remove
//                 </button>
//               </div>
//             ))}
//             {uploadedFiles.map((file, index) => (
//               <div
//                 key={index}
//                 className="flex items-center justify-between p-2 bg-gray-50 rounded"
//               >
//                 <span className="text-gray-700">{file.name}</span>
//                 <button
//                   type="button"
//                   className="text-red-500 hover:text-red-700"
//                   onClick={() => {
//                     setUploadedFiles(prev => prev.filter((_, i) => i !== index));
//                   }}
//                 >
//                   Remove
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>

//         <TranslatedForm
//           fields={fields}
//           languages={["en", "ru", "uz", "kk"]}
//           initialData={postData?.translations}
//           onSubmit={handleSubmit}
//           submitButton={
//             <button
//               type="submit"
//               disabled={isSubmitting}
//               className="w-full px-4 py-2 bg-[#6C5DD3] text-white rounded-lg hover:bg-[#5b4eb8] transition-colors disabled:opacity-50"
//             >
//               {isSubmitting ? "Saving..." : "Update Post"}
//             </button>
//           }
//         />
//       </div>
//     </div>
//   );
// }