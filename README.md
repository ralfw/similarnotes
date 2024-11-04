# Notizen automatisch vernetzen

Die Anwendung ist ein Proof of Concept für die Idee, dass in einer modernen Notizen-App die Einträge nicht mehr manuell miteinander verbunden werden müssen.

In üblichen "Zettelkasten-Apps" wie 

- [Obsidian](https://obsidian.md/)
- [The Archive](https://zettelkasten.de/the-archive/)
- [Notion](https://notion.so/)
- [Craft](https://craft.do/)

werden Notizen manuell verbunden, um aus ihnen ein Wissensnetz zu weben. Man muss also wissen, welche Notizen man schon gemacht hat, um sie mit neuen zu verknüpfen.

Nur in [Mem](https://mem.ai/) ist es anders: dort werden in der Abo-Version auch Notizen in Beziehung gesetzt, die sich ähnlich sind.

Darin scheint mir die Zukunft zu liegen. Denn ich finde es anstrengend, den Überblick über Notizen zu behalten, um sie verweben.
Insbesondere wenn ich zu sehr unterschiedlichen Themen oder nur sporadisch Notizen mache, habe ich nicht im Kopf, was ich vielleicht schon einmal
in der Vergangenheit notiert habe, das dazu zu einer neuen Notiz passen könnte.

Notizen in Verzeichnissen oder vor allem mit Hashtags explizit mit Bedeutung aufzuladen und in einen Kontext zu setzen, ist eine schöne Sache.
Doch ich möchte dazu nicht gezwungen werden, nur damit ich zusammen passende Notizen auch zusammen im Überblick haben.

Natürlich müssen Notizen auch manuell verbunden werden können, wenn ich einen Bezug zwischen ihnen sehe, aber die App nicht.
Und ich will automatisch hergestellte Bezüge verneinen können.

Grundlegend für meine Notizensammlung, meinen Zettelkasten, sollen jedoch Verbindungen sein, die "sich von selbst ergeben", weil Notizen ähnliche Inhalte thematisieren.

## Beispielnutzung

In den Beispieldaten gibt es Notizen zu den Themen Atombindung und Echoortung bei Tieren. Das sind sehr verschiedene Themen.

<img width="645" alt="image" src="https://github.com/user-attachments/assets/bf334099-4107-4ebd-8c7a-9dc257775f9a">

Nach Programmstart werden alle Notizen in chronologischer Reihenfolge gelistet.

Nach Öffnen einer Notiz durch Eingabe ihrer Nummer in der Liste wird deren Inhalt gezeigt inkl. ähnlicher Notizen.
Einer solchen Referenz kann durch Eingabe deren Nummer gewechselt werden.

Die Benutzerschnittstelle ist primitiv. Es geht beim PoC nicht um UX, sondern um das Paradigma der automatischen Verknüpfung.
Deshalb ist die Eingabe des Notizentextes nicht sehr komfortabel.
Aber es wird mit Hilfe von KI wenigstens ein Titel vorgeschlagen. Das finde ich bequem, weil ein Titel in einer Übersicht nützlich ist, beim Schreiben einer Notiz jedoch eine Hürde darstellt.
Vom Inhalt auf eine abstraktere Ebene zu wechseln, ist anstrengend.

# Persistenz

Die Notizen werden im Verzeichnis `./notes` als simple Textdateien gespeichert. Keine Datenbank nötig, weil es nur um wenige Notizen geht.

Die Ähnlichkeit zwischen Notizen wird durch Vergleich von Embeddings bestimmt.
Die werden alle `embeddings_cache.json` gespeichert. Auch hier ist kein Vector Store nötig für die wenigen Notizen.

# KI-Nutzung

Ein OpenAI LLM wird benutzt für:

- Generierung eines Titelvorschlags
- Berechnung der Embeddings

Angesteuert werden die Modelle über [LangChain](https://langchain.com/).

# Architektur

Eine geplante Architektur gibt es für die App nicht. Sie ist ein PoC, den ich in 60min mit Claude "rausgehauen" habe.

# Konfiguration
Installiere die Deno Runtime: [https://deno.com/](https://deno.com/)

Bevor du die Anwendung laufen lassen kannst, musst du allerdings noch im Verzeichnis `./src` eine Datei `.env` mit diesem Inhalt anlegen:

```
OPENAI_API_KEY=<openai api key>
```

Danach startest du sie im `./src` Verzeichnis mit `deno run --allow-all main.ts`.
