import { runAppleScript } from "@raycast/utils";

import { escapeDoubleQuotes } from "../helpers";

export async function createNote(text?: string) {
  const escapedText = text ? escapeDoubleQuotes(text) : "";

  return runAppleScript(`
    tell application "Notes"
      activate
      set newNote to make new note
      if ("${escapedText}" is not "") then
        set body of newNote to "${escapedText}"
      end if
      set selection to newNote
      show newNote
    end tell
    `);
}

export async function openNoteSeparately(id: string) {
  return runAppleScript(`
    tell application "Notes"
      set theNote to note id "${escapeDoubleQuotes(id)}"
      set theFolder to container of theNote
      show theFolder
      show theNote with separately
      activate
    end tell
    `);
}

export async function deleteNoteById(id: string) {
  return runAppleScript(`
    tell application "Notes"
      delete note id "${escapeDoubleQuotes(id)}"
    end tell
    `);
}

export async function restoreNoteById(id: string) {
  return runAppleScript(`
    tell application "Notes"
      set theNote to note id "${escapeDoubleQuotes(id)}"
      set theFolder to default folder of account 1
      move theNote to theFolder
    end tell
    `);
}

export async function getNoteBody(id: string) {
  return runAppleScript(`
    tell application "Notes"
      set theNote to note id "${escapeDoubleQuotes(id)}"
      return body of theNote
    end tell
    `);
}

export async function getNotePlainText(id: string) {
  return runAppleScript(`
    tell application "Notes"
      set theNote to note id "${escapeDoubleQuotes(id)}"
      return plaintext of theNote
    end tell
    `);
}

export async function setNoteBody(id: string, body: string) {
  return runAppleScript(`
    tell application "Notes"
      set theNote to note id "${escapeDoubleQuotes(id)}"
      set body of theNote to "${escapeDoubleQuotes(body)}"
    end tell
    `);
}

export async function getSelectedNote() {
  return runAppleScript(`
    tell application "Notes"
      set selectedNotes to selection
      if (count of selectedNotes) is 0 then
        error "No note is currently selected"
      else
        set theNote to item 1 of selectedNotes
        return id of theNote
      end if
    end tell
  `);
}

export type NotePlainTextEntry = {
  id: string;
  plaintext: string;
};

/**
 * Fetch plaintext content for all notes in batch.
 * Returns array of {id, plaintext} objects as JSON.
 */
export async function getAllNotesPlainText(): Promise<NotePlainTextEntry[]> {
  const result = await runAppleScript(`
    set output to "["
    set isFirst to true
    tell application "Notes"
      repeat with acc in accounts
        repeat with theNote in notes of acc
          try
            set noteId to id of theNote
            set noteText to plaintext of theNote
            -- Escape backslashes first, then quotes, then newlines/tabs
            set noteText to my replaceText(noteText, "\\\\", "\\\\\\\\")
            set noteText to my replaceText(noteText, "\\"", "\\\\\\"")
            set noteText to my replaceText(noteText, return, "\\\\n")
            set noteText to my replaceText(noteText, linefeed, "\\\\n")
            set noteText to my replaceText(noteText, tab, "\\\\t")
            if not isFirst then
              set output to output & ","
            end if
            set isFirst to false
            set output to output & "{\\"id\\":\\"" & noteId & "\\",\\"plaintext\\":\\"" & noteText & "\\"}"
          end try
        end repeat
      end repeat
    end tell
    set output to output & "]"
    return output

    on replaceText(theText, searchStr, replaceStr)
      set AppleScript's text item delimiters to searchStr
      set theItems to text items of theText
      set AppleScript's text item delimiters to replaceStr
      set theText to theItems as text
      set AppleScript's text item delimiters to ""
      return theText
    end replaceText
  `);

  try {
    return JSON.parse(result) as NotePlainTextEntry[];
  } catch {
    console.error("Failed to parse notes plaintext:", result);
    return [];
  }
}
