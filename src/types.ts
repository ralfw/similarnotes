// types.ts
export interface Note {
    filename: string;
    title: string;
    content: string;
    timestamp: string;
  }
  
  export interface EmbeddingCache {
    [filename: string]: {
      vector: number[];
      timestamp: string;
    }
  }
  
  export interface SimilarNote {
    filename: string;
    similarity: number;
  }
  