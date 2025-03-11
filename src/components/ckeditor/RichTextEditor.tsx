import { Editor } from '@tinymce/tinymce-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
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
          'fullscreen', 'insertdatetime', 'media', 'table', 'code',
          'help', 'wordcount', 'pagebreak', 'nonbreaking',
          'save', 'directionality', 'emoticons', 'visualchars', 'quickbars'
        ],
        toolbar: [
          'file | undo redo | formatselect | fontselect | fontsizeselect |',
          'bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | lineheight |',
          'bullist numlist | outdent indent | link image media table | pagebreak | help'
        ].join(' '),
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
        statusbar: true,
        branding: false,
        promotion: false,
        font_formats: 'Arial=arial,helvetica,sans-serif; Arial Black=arial black,avant garde; Courier New=courier new,courier; Georgia=georgia,palatino; Helvetica=helvetica; Times New Roman=times new roman,times;',
        fontsize_formats: '8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt'
      }}
      value={value}
      onEditorChange={(content) => onChange(content)}
    />
  )
}