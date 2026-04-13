import { Editor } from '@tinymce/tinymce-react'

interface RichTextEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    onFileUpload?: (file: File) => void
}

export function RichTextEditor({ value, onChange, onFileUpload }: RichTextEditorProps) {
    return (
        <Editor
            tinymceScriptSrc="/tinymce/tinymce.min.js"
            init={{
                height: 300,
                menubar: true,
                base_url: '/tinymce',
                suffix: '.min',
                model: 'dom',
                plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                    'preview', 'anchor', 'searchreplace', 'visualblocks',
                    'fullscreen', 'insertdatetime', 'media', 'table', 'code', 'codesample',
                    'help', 'wordcount', 'pagebreak', 'nonbreaking',
                    'save', 'directionality', 'emoticons', 'visualchars', 'quickbars',
                    'link', 'image', 'media', 'paste', 'powerpaste'
                ],
                toolbar_mode: 'wrap',
                toolbar_sticky: true,
                toolbar_items_size: 'small',
                toolbar: [
                    'uploadfile file | undo redo | formatselect | fontselect | fontsizeselect |',
                    'bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | lineheight |',
                    'bullist numlist | outdent indent | link image media | pagebreak | code codesample | help'
                ].join(' '),
                codesample_languages: [
                    { text: 'HTML/XML', value: 'markup' },
                    { text: 'CSS', value: 'css' }
                ],
                extended_valid_elements: 'style[type|media]',
                custom_elements: 'style',
                valid_children: '+body[style]',
                content_css: false,
                protect: [
                    /\<style[\s\S]*?\<\/style\>/g
                ],
                verify_html: false,
                content_style: `
                    body { font-family:Helvetica,Arial,sans-serif; font-size:16px }
                    .mce-content-body [style] { 
                        all: revert;
                    }
                    /* Add prism.js styles if needed */
                    pre[class*="language-"] {
                        margin: 1em 0;
                        padding: 1em;
                        background: #f5f5f5;
                        border-radius: 4px;
                        overflow: auto;
                    }
                `,
                statusbar: true,
                branding: false,
                promotion: false,
                font_formats: 'Arial=arial,helvetica,sans-serif; Arial Black=arial black,avant garde; Courier New=courier new,courier; Georgia=georgia,palatino; Helvetica=helvetica; Times New Roman=times new roman,times;',
                fontsize_formats: '8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt',
                init_instance_callback: function(editor) {
                    editor.on('BeforeSetContent BeforeGetContent', function(e) {
                        if (e.content) {
                            // Protect style tags before content operations
                            e.content = e.content.replace(
                                /(<style[\s\S]*?<\/style>)/g,
                                '[STYLE_PLACEHOLDER]$1[/STYLE_PLACEHOLDER]'
                            );
                        }
                    });
                    
                    editor.on('GetContent', function(e) {
                        if (e.content) {
                            // Remove the protection placeholders
                            e.content = e.content.replace(
                                /\[STYLE_PLACEHOLDER\]([\s\S]*?)\[\/STYLE_PLACEHOLDER\]/g,
                                '$1'
                            );
                        }
                    });
                },
                setup: function (editor) {
                    editor.ui.registry.addButton('uploadfile', {
                        text: 'Upload File',
                        icon: 'upload',
                        onAction: function () {
                            const input = document.createElement('input');
                            input.setAttribute('type', 'file');
                            input.setAttribute('accept', '.pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.csv');
                            
                            input.onchange = async function() {
                                const file = (input as HTMLInputElement).files?.[0];
                                if (!file) return;
                                
                                if (onFileUpload) {
                                    console.log('File uploaded via upload button:', file);
                                    onFileUpload(file);
                                }
                                
                                // Don't insert content into description
                                // editor.insertContent(`<p>File: ${file.name}</p>`);
                            };
                            
                            input.click();
                        }
                    });

                    // Update paste handler with better format handling
                    editor.on('paste', function(e) {
                        const files = e.clipboardData?.files;
                        const html = e.clipboardData?.getData('text/html');
                        const text = e.clipboardData?.getData('text/plain');
                        if (html) {
                            e.preventDefault();
                            
                            // Clean up the HTML to preserve table structure and formatting
                            let cleanHtml = html
                                .replace(/<\/?meta[^>]*>/g, '') // Remove meta tags
                                .replace(/<\/?style[^>]*>[^<]*<\/style>/g, '') // Remove style tags
                                .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
                                .replace(/xmlns:[^"]+"/g, ''); // Remove XML namespaces

                            // Preserve table structure if present
                            if (html.includes('<table')) {
                                cleanHtml = cleanHtml
                                    .replace(/class="[^"]*"/g, '') // Remove classes
                                    .replace(/style="[^"]*"/g, ''); // Remove inline styles
                            }

                            editor.insertContent(cleanHtml);
                            return;
                        }

                        // If there's only text content
                        if (text && !html && !files?.length) {
                            e.preventDefault();
                            const formattedText = text
                                .split('\n')
                                .map(line => `<p>${line}</p>`)
                                .join('');
                            editor.insertContent(formattedText);
                            return;
                        }

                        // Handle files
                        if (files && files.length > 0) {
                            e.preventDefault();
                            Array.from(files).forEach(file => {
                                if (file.type.startsWith('image/')) {
                                    if (onFileUpload) {
                                        onFileUpload(file);
                                    }
                                    const blobUrl = URL.createObjectURL(file);
                                    editor.insertContent(`<img src="${blobUrl}" alt="${file.name}" />`);
                                } else {
                                    editor.insertContent(`
                                        <div class="file-attachment" data-filename="${file.name}">
                                            📎 ${file.name}
                                        </div>
                                    `);
                                    if (onFileUpload) {
                                        onFileUpload(file);
                                    }
                                }
                            });
                        }
                    });

                    // Update drop handler to match
                    editor.on('drop', function(e) {
                        const files = e.dataTransfer?.files;
                        if (files && files.length > 0) {
                            e.preventDefault();
                            Array.from(files).forEach(file => {
                                if (file.type.startsWith('image/')) {
                                    // Handle image files same way as image picker
                                    if (onFileUpload) {
                                        onFileUpload(file);
                                    }
                                    
                                    const blobUrl = URL.createObjectURL(file);
                                    editor.insertContent(`<img src="${blobUrl}" alt="${file.name}" />`);
                                } else {
                                    // Handle other file types
                                    editor.insertContent(`
                                        <div class="file-attachment" data-filename="${file.name}">
                                            📎 ${file.name}
                                        </div>
                                    `);
                                    
                                    if (onFileUpload) {
                                        onFileUpload(file);
                                    }
                                }
                            });
                        }
                    });

                    // Modify file picker callback
                    editor.ui.registry.addButton('file', {
                        text: 'Add File',
                        icon: 'document',
                        onAction: function () {
                            const input = document.createElement('input');
                            input.setAttribute('type', 'file');
                            input.setAttribute('accept', '.pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.csv');
                            
                            input.onchange = async function() {
                                const file = (input as HTMLInputElement).files?.[0];
                                if (!file) return;
                                
                                if (onFileUpload) {
                                    onFileUpload(file);
                                }
                                
                                // Insert a placeholder for the file
                                editor.insertContent(`
                                    <div class="file-attachment" data-filename="${file.name}">
                                        📎 ${file.name}
                                    </div>
                                `);
                            };
                            
                            input.click();
                        }
                    });
                },
                file_picker_types: 'image media',
                file_picker_callback: function(callback, _value, meta) {
                    const input = document.createElement('input');
                    
                    if (meta.filetype === 'image') {
                        input.setAttribute('type', 'file');
                        input.setAttribute('accept', 'image/*');
                    } else if (meta.filetype === 'media') {
                        input.setAttribute('type', 'file');
                        input.setAttribute('accept', 'video/*,audio/*');
                    }
                    
                    input.onchange = function() {
                        const file = (input as HTMLInputElement).files?.[0];
                        if (!file) return;
                        
                        if (onFileUpload) {
                            onFileUpload(file);
                        }
                        
                        const blobUrl = URL.createObjectURL(file);
                        
                        if (meta.filetype === 'image') {
                            callback(blobUrl, { title: file.name });
                        } else if (meta.filetype === 'media') {
                            callback(blobUrl, { title: file.name });
                        }
                    };

                    input.click();
                },
                paste_data_images: false,
                automatic_uploads: false,
                images_upload_handler: function(blobInfo: any, _progress: any) {
                    return new Promise((resolve, _reject) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const base64 = reader.result as string;
                            resolve(base64);
                        };
                        reader.readAsDataURL(blobInfo.blob());
                    });
                },
                paste_retain_style_properties: "all",
                paste_word_valid_elements: "b,strong,i,em,h1,h2,h3,h4,h5,h6,p,ol,ul,li,table,tr,td,th,tbody,thead,span,div,br",
                paste_webkit_styles: "all",
                paste_merge_formats: true,
                paste_convert_word_fake_lists: false,
                paste_remove_styles_if_webkit: false,
                powerpaste_allow_local_images: true,
                powerpaste_word_import: 'prompt',
                powerpaste_html_import: 'prompt'
            }}
            value={value}
            onEditorChange={(content: any) => onChange(content)}
        />
    )
}