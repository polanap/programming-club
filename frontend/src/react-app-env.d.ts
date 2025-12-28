/// <reference types="react-scripts" />

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module 'sockjs-client' {
  interface SockJSOptions {
    transports?: string[];
    timeout?: number;
    sessionId?: number | (() => number);
    server?: string;
    devel?: boolean;
    debug?: boolean;
    protocols_whitelist?: string[];
    info?: {
      websocket?: boolean;
      cookie_needed?: boolean;
      null_origin?: boolean;
    };
  }

  class SockJS {
    constructor(url: string, protocols?: string[], options?: SockJSOptions);
    protocol: string;
    readyState: number;
    url: string;
    onopen: ((e: any) => void) | null;
    onmessage: ((e: any) => void) | null;
    onclose: ((e: any) => void) | null;
    onerror: ((e: any) => void) | null;
    send(data: string): void;
    close(code?: number, reason?: string): void;
  }

  export = SockJS;
}

