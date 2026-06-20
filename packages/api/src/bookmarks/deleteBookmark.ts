import { and, eq, inArray } from "drizzle-orm";
import type { Database } from "../db";
import { schema } from "../db";
import type { DeleteBookmarkInput } from "./types";

export const deleteBookmark = async (
  db: Database,
  input: DeleteBookmarkInput
): Promise<{ deletedBookmarkId: string }> => {
  const [deletedBookmark] = await db
    .delete(schema.savedItems)
    .where(
      and(
        eq(schema.savedItems.id, input.bookmarkId),
        inArray(schema.savedItems.libraryId, input.allowedLibraryIds)
      )
    )
    .returning({ id: schema.savedItems.id });

  if (!deletedBookmark) {
    throw new Error("Bookmark does not exist");
  }

  return { deletedBookmarkId: deletedBookmark.id };
};
