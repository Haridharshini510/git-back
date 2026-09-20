import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { TodoItem } from "./types.js";

const TODO_PATTERN = /\b(TODO|FIXME|HACK|XXX)\b[:\s]*(.*)/i;

export function scanTodos(files: string[], cwd?: string): TodoItem[] {
  const basePath = cwd ?? process.cwd();
  const todos: TodoItem[] = [];

  for (const file of files) {
    try {
      const fullPath = resolve(basePath, file);
      const content = readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(TODO_PATTERN);
        if (match) {
          todos.push({
            file,
            line: i + 1,
            text: match[2]?.trim() || match[0],
            type: match[1].toUpperCase() as TodoItem["type"],
          });
        }
      }
    } catch {
      // skip files that can't be read
    }
  }

  return todos;
}
