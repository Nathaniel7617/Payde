// Type declarations for Expo modules and React

// React namespace and types
declare namespace React {
  type FC<P = {}> = (props: P) => any;
  type ReactNode = any;
  type ReactElement = any;
  
  interface Component<P = {}, S = {}> {}
  interface ComponentClass<P = {}> {}
  
  function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  function useState<S>(initialState: S | (() => S)): [S, (value: S | ((prev: S) => S)) => void];
  function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  function useRef<T>(initialValue?: T): { current: T };
  function useMemo<T>(factory: () => T, deps: any[]): T;
}

declare module 'react' {
  export = React;
  export as namespace React;
}

declare module 'expo-crypto' {
  export enum CryptoDigestAlgorithm {
    SHA1 = 'SHA1',
    SHA256 = 'SHA256',
    SHA384 = 'SHA384',
    SHA512 = 'SHA512',
    MD5 = 'MD5',
  }

  export function getRandomBytesAsync(byteCount: number): Promise<Uint8Array>;
  export function digestStringAsync(
    algorithm: CryptoDigestAlgorithm | string,
    data: string,
    options?: { encoding?: string }
  ): Promise<string>;
}

declare module 'expo-print' {
  export interface PrintOptions {
    html?: string;
    uri?: string;
    printerUrl?: string;
    orientation?: 'portrait' | 'landscape';
    useMarkupFormatter?: boolean;
    base64?: boolean;
  }

  export function printAsync(options: PrintOptions): Promise<void>;
  export function printToFileAsync(options: PrintOptions): Promise<{ uri: string; numberOfPages?: number }>;
}

declare module 'expo-sharing' {
  export function shareAsync(
    url: string,
    options?: {
      mimeType?: string;
      dialogTitle?: string;
      UTI?: string;
    }
  ): Promise<void>;

  export function isAvailableAsync(): Promise<boolean>;
}

declare module 'expo-mail-composer' {
  export interface MailComposerOptions {
    recipients?: string[];
    ccRecipients?: string[];
    bccRecipients?: string[];
    subject?: string;
    body?: string;
    isHtml?: boolean;
    attachments?: string[];
  }

  export function composeAsync(options: MailComposerOptions): Promise<{ status: string }>;
  export function isAvailableAsync(): Promise<boolean>;
}

declare module 'expo-file-system' {
  export const documentDirectory: string | null;
  export const cacheDirectory: string | null;

  export function writeAsStringAsync(
    fileUri: string,
    contents: string,
    options?: { encoding?: string }
  ): Promise<void>;

  export function readAsStringAsync(
    fileUri: string,
    options?: { encoding?: string }
  ): Promise<string>;

  export function deleteAsync(
    fileUri: string,
    options?: { idempotent?: boolean }
  ): Promise<void>;

  export function makeDirectoryAsync(
    fileUri: string,
    options?: { intermediates?: boolean }
  ): Promise<void>;

  export function moveAsync(options: {
    from: string;
    to: string;
  }): Promise<void>;

  export function getInfoAsync(
    fileUri: string,
    options?: { md5?: boolean; size?: boolean }
  ): Promise<{
    exists: boolean;
    uri: string;
    size?: number;
    isDirectory?: boolean;
    modificationTime?: number;
    md5?: string;
  }>;
}