// main.ts

// Usage: deno run --allow-all main.ts

import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import { Input, Select } from "https://deno.land/x/cliffy@v0.25.7/prompt/mod.ts";
import { Table } from "https://deno.land/x/cliffy@v0.25.7/table/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";




import { load } from "https://deno.land/std@0.210.0/dotenv/mod.ts";

// Optional: Cache die URLs in einer import_map.json


// Rest des Codes bleibt gleich...



import { Note, SimilarNote } from "./types.ts";
import { generateTitle } from "./ai_services.ts";
import { updateEmbeddingCache, findSimilarNotes } from "./embeddings.ts";

const NOTES_DIR = "./notes";

await load({ export: true });

// Ensure notes directory exists
await Deno.mkdir(NOTES_DIR, { recursive: true });

async function listNotes(): Promise<Note[]> {
  const notes: Note[] = [];
  for await (const entry of Deno.readDir(NOTES_DIR)) {
    if (entry.isFile && entry.name.endsWith('.txt')) {
      const content = await Deno.readTextFile(`${NOTES_DIR}/${entry.name}`);
      const [timestamp, ...titleParts] = entry.name.replace('.txt', '').split(' -- ');
      notes.push({
        filename: entry.name,
        title: titleParts.join(' -- '),
        content,
        timestamp
      });
    }
  }
  return notes.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

async function createNewNote() {
  console.clear();
  console.log(colors.bold.blue("📝 Neue Notiz erstellen\n"));
  console.log("Geben Sie Ihre Notiz ein (Abschluss mit ENTER + CTRL+D):");

  const buffer = new Uint8Array(1024);
  let content = "";
  
  while (true) {
    const n = await Deno.stdin.read(buffer);
    if (n === null) break;
    content += new TextDecoder().decode(buffer.subarray(0, n));
  }

  content = content.trim();
  
  if (!content) {
    console.log(colors.yellow("\nKeine leeren Notizen erlaubt!"));
    await new Promise(resolve => setTimeout(resolve, 2000));
    return;
  }

  console.log("\nGeneriere Titelvorschlag...");
  const suggestedTitle = await generateTitle(content);
  console.log(colors.green(`Vorgeschlagener Titel: ${suggestedTitle}`));

  const title = await Input.prompt({
    message: "Titel eingeben (ENTER für Vorschlag)",
    default: suggestedTitle,
  });

  const timestamp = new Date().toISOString()
    .replace(/[:\.]/g, '-')
    .slice(0, 19);
  
  const filename = `${timestamp} -- ${title}.txt`;
  await Deno.writeTextFile(
    `${NOTES_DIR}/${filename}`, 
    content
  );

  await updateEmbeddingCache(filename, content);

  console.log(colors.green("\n✅ Notiz gespeichert!"));
  await new Promise(resolve => setTimeout(resolve, 1500));
}

async function selectAndShowNote() {
  const notes = await listNotes();
  if (notes.length === 0) {
    console.log(colors.yellow("\nKeine Notizen vorhanden!"));
    await new Promise(resolve => setTimeout(resolve, 2000));
    return;
  }

  const answer = await Input.prompt({
    message: "Welche Notiz möchten Sie öffnen? (1-" + notes.length + ")",
  });

  const index = parseInt(answer) - 1;
  if (isNaN(index) || index < 0 || index >= notes.length) {
    console.log(colors.red("\nUngültige Eingabe!"));
    await new Promise(resolve => setTimeout(resolve, 2000));
    return;
  }

  await showNote(notes[index]);
}



async function showNote(note: Note) {
  console.clear();
  console.log(colors.bold.blue(`📄 ${note.title}\n`));
  console.log(colors.dim("─".repeat(50)));
  console.log(note.content);
  console.log(colors.dim("─".repeat(50)));
  console.log();

  const similarNotes = await findSimilarNotes(note.filename);
  let relevantNotes: SimilarNote[] = [];
  
  // Versuche nacheinander mit abnehmenden Schwellwerten
  for (let threshold of [0.8, 0.7, 0.6, 0.5]) {
    relevantNotes = similarNotes.filter(note => note.similarity >= threshold);
    if (relevantNotes.length > 0) {
      if (threshold < 0.8) {
        console.log(colors.yellow(`Ähnlichkeitsschwelle auf ${threshold * 100}% herabgesetzt\n`));
      }
      break;
    }
  }
  
  if (relevantNotes.length > 0) {
    console.log(colors.bold("Ähnliche Notizen:"));
    relevantNotes.forEach((similar, index) => {
      const similarity = (similar.similarity * 100).toFixed(0);
      console.log(`${index + 1}. ${similar.filename} (${similarity}%)`);
    });

    console.log();
    const answer = await Input.prompt({
      message: `Nummer für ähnliche Notiz oder [L] für Liste`,
    });

    if (answer.toLowerCase() === 'l') {
      return;
    }

    const index = parseInt(answer) - 1;
    if (!isNaN(index) && index >= 0 && index < relevantNotes.length) {
      const similarNote = await getNoteByFilename(relevantNotes[index].filename);
      if (similarNote) {
        await showNote(similarNote);
      }
    }
  } else {
    console.log(colors.yellow("Keine ähnlichen Notizen gefunden (>= 50%)"));
    console.log();
    const answer = await Input.prompt({
      message: "[L] für Liste",
    });
    if (answer.toLowerCase() === 'l') {
      return;
    }
  }
}





async function getNoteByFilename(filename: string): Promise<Note | null> {
  try {
    const content = await Deno.readTextFile(`${NOTES_DIR}/${filename}`);
    const [timestamp, ...titleParts] = filename.replace('.txt', '').split(' -- ');
    return {
      filename,
      title: titleParts.join(' -- '),
      content,
      timestamp
    };
  } catch {
    return null;
  }
}

async function showMainMenu() {
  const notes = await listNotes();
  
  console.clear();
  console.log(colors.bold.blue("📝 Notizen-Übersicht:\n"));

  const table = new Table()
    .header(["#", "Datum", "Titel"])
    .padding(2);

  notes.forEach((note, index) => {
    const [datePart, timePart] = note.timestamp.split('T');
    const [year, month, day] = datePart.split('-');
    const [hour, minute, second] = timePart.split('-');
    
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    );

    const formattedDate = date.toLocaleString('de-DE', { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    });

    table.push([
      (index + 1).toString(),
      formattedDate,
      note.title
    ]);
  });

  console.log(table.toString());
  console.log();

  const answer = await Input.prompt({
    message: "[N]eu, [Q]uit oder Nummer der Notiz",
  });

  const input = answer.toLowerCase();
  if (input === 'n') {
    await createNewNote();
  } else if (input === 'q') {
    Deno.exit(0);
  } else {
    const index = parseInt(answer) - 1;
    if (!isNaN(index) && index >= 0 && index < notes.length) {
      await showNote(notes[index]);
    } else {
      console.log(colors.red("\nUngültige Eingabe!"));
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}



// Hauptprogramm
if (import.meta.main) {
  console.log(colors.bold.blue("🚀 Notizen-System wird gestartet...\n"));
  
  while (true) {
    await showMainMenu();
  }
}
