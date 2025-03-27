export interface TranslatedField {
    name: string;
    label: string;
    type: "text" | "textarea" | "richtext";
    required?: boolean;
    editorConfig?: any;
  }
  
  export interface MainMenuItem {
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
  
  export interface FooterMenuItem {
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
  
  export interface PostFormData {
    translations: {
      [key: string]: {
        title: string;
        description: string;
        slug: string;
      };
    };
    main_image?: string;
    images?: Array<{ image: string }>;
    menu?: number;
    footer_menu?: number;
    files?: Array<{ file: string }>;
  }