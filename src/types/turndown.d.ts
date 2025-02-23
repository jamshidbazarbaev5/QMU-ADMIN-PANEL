declare module 'turndown' {
    class TurndownService {
      constructor(options?: {
        headingStyle?: 'setext' | 'atx';
        horizontalRule?: string;
        bulletListMarker?: '-' | '+' | '*';
        codeBlockStyle?: 'indented' | 'fenced';
        fence?: '```' | '~~~';
        emDelimiter?: '_' | '*';
        strongDelimiter?: '__' | '**';
        linkStyle?: 'inlined' | 'referenced';
        linkReferenceStyle?: 'full' | 'collapsed' | 'shortcut';
      });
  
      turndown(html: string): string;
      use(plugin: any): this;
    }
  
    export = TurndownService;
  }