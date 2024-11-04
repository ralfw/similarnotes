// embeddings.ts
import { OpenAIEmbeddings } from "https://esm.sh/@langchain/openai";
import { SimilarNote, EmbeddingCache } from "./types.ts";

const CACHE_FILE = "./embeddings_cache.json";
const embeddings = new OpenAIEmbeddings();

// Lädt den Embedding-Cache aus der Datei
async function loadEmbeddingCache(): Promise<EmbeddingCache> {
    try {
      const content = await Deno.readTextFile(CACHE_FILE);
      return JSON.parse(content) as EmbeddingCache;
    } catch {
      return {};
    }
  }
  

// Speichert den Embedding-Cache in die Datei
async function saveEmbeddingCache(cache: EmbeddingCache): Promise<void> {
  await Deno.writeTextFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// Berechnet die Cosinus-Ähnlichkeit zwischen zwei Vektoren
function cosineSimilarity(v1: number[], v2: number[]): number {
  const dotProduct = v1.reduce((acc, val, i) => acc + val * v2[i], 0);
  const mag1 = Math.sqrt(v1.reduce((acc, val) => acc + val * val, 0));
  const mag2 = Math.sqrt(v2.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (mag1 * mag2);
}

// Aktualisiert oder erstellt einen Embedding-Eintrag für eine Notiz
export async function updateEmbeddingCache(filename: string, content: string): Promise<void> {
  const cache = await loadEmbeddingCache();
  const vector = await embeddings.embedQuery(content);
  
  cache[filename] = {
    vector,
    timestamp: new Date().toISOString()
  };
  
  await saveEmbeddingCache(cache);
}

// Findet die 5 ähnlichsten Notizen zu einer gegebenen Notiz
export async function findSimilarNotes(filename: string): Promise<SimilarNote[]> {
  const cache = await loadEmbeddingCache();
  
  if (!cache[filename]) {
    console.error("Embedding für diese Notiz nicht gefunden!");
    return [];
  }

  const sourceVector = cache[filename].vector;
  const similarities: SimilarNote[] = [];

  // Berechne Ähnlichkeiten zu allen anderen Notizen
  for (const [otherFilename, otherData] of Object.entries(cache)) {
    if (otherFilename === filename) continue;

    const similarity = cosineSimilarity(sourceVector, otherData.vector);
    similarities.push({
      filename: otherFilename,
      similarity
    });
  }

  // Sortiere nach Ähnlichkeit und nimm die Top 5
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
}

// Optional: Bereinigt alte Einträge aus dem Cache
export async function cleanupEmbeddingCache(): Promise<void> {
  const cache = await loadEmbeddingCache();
  
  // Prüfe, ob die Notizen noch existieren
  for (const filename of Object.keys(cache)) {
    try {
      await Deno.stat(`./notes/${filename}`);
    } catch {
      // Datei existiert nicht mehr, entferne aus Cache
      delete cache[filename];
    }
  }
  
  await saveEmbeddingCache(cache);
}
