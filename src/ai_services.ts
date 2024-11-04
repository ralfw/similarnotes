// ai_services.ts
import { ChatOpenAI } from "https://esm.sh/@langchain/openai";
import { OpenAIEmbeddings } from "https://esm.sh/@langchain/openai";
import { PromptTemplate } from "https://esm.sh/@langchain/core/prompts";
import { StringOutputParser } from "https://esm.sh/@langchain/core/output_parsers";

const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0.7,
});

const embeddings = new OpenAIEmbeddings();

// Prompt Template für Titelgenerierung
const titlePrompt = PromptTemplate.fromTemplate(
  `Generiere einen kurzen, prägnanten Titel (maximal 50 Zeichen) für folgenden Text:
  
  {text}
  
  Titel:`
);

export async function generateTitle(content: string): Promise<string> {
  const chain = titlePrompt.pipe(model).pipe(new StringOutputParser());
  const response = await chain.invoke({ text: content });
  return response.trim();
}

export async function createEmbedding(text: string): Promise<number[]> {
  return await embeddings.embedQuery(text);
}
