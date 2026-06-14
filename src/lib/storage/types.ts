export type PutFileOptions = {
  contentType?: string;
  /** Replace an existing blob at the same pathname (logos plateforme / entreprise). */
  allowOverwrite?: boolean;
};

export type ReadFileResult = {
  body: Buffer | ReadableStream<Uint8Array>;
  contentType: string;
};

export interface StorageBackend {
  put(logicalKey: string, body: Buffer, options?: PutFileOptions): Promise<void>;
  read(logicalKey: string): Promise<ReadFileResult | null>;
  delete(logicalKey: string): Promise<void>;
}
