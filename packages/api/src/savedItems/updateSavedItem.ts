import { and, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "../db";
import { schema } from "../db";
import { savedItemSelectFields, serializeSavedItem } from "./savedItemRows";
import type { UpdateSavedItemInput } from "./types";

export const updateSavedItem = async (db: Database, input: UpdateSavedItemInput) => {
  return db.transaction(async (tx) => {
    const [existingItem] = await tx
      .select({
        id: schema.savedItems.id,
        libraryId: schema.savedItems.libraryId,
        url: schema.savedItems.url
      })
      .from(schema.savedItems)
      .where(
        and(
          eq(schema.savedItems.id, input.savedItemId),
          inArray(schema.savedItems.libraryId, input.allowedLibraryIds)
        )
      )
      .limit(1);

    if (!existingItem) {
      throw new Error("Saved item does not exist");
    }

    const targetFolderId = input.folderId ?? null;

    if (targetFolderId) {
      const [folder] = await tx
        .select({ id: schema.folders.id })
        .from(schema.folders)
        .where(
          and(
            eq(schema.folders.id, targetFolderId),
            eq(schema.folders.libraryId, existingItem.libraryId)
          )
        )
        .limit(1);

      if (!folder) {
        throw new Error("Choose an available folder");
      }
    }

    if (input.tagIds) {
      const selectedTagIds = [...new Set(input.tagIds)];

      if (selectedTagIds.length > 0) {
        const availableTags = await tx
          .select({ id: schema.tags.id })
          .from(schema.tags)
          .where(
            and(
              inArray(schema.tags.id, selectedTagIds),
              eq(schema.tags.libraryId, existingItem.libraryId)
            )
          );
        const availableTagIds = new Set(availableTags.map((tag) => tag.id));

        if (selectedTagIds.some((tagId) => !availableTagIds.has(tagId))) {
          throw new Error("Choose available tags");
        }
      }
    }

    const urlChanged = input.url !== existingItem.url;

    await tx
      .update(schema.savedItems)
      .set({
        description: input.description,
        faviconId: urlChanged ? null : sql`${schema.savedItems.faviconId}`,
        folderId: targetFolderId,
        imageUrl: urlChanged ? null : sql`${schema.savedItems.imageUrl}`,
        metadataFetchedAt: urlChanged ? null : sql`${schema.savedItems.metadataFetchedAt}`,
        metadataStatus: urlChanged ? "pending" : sql`${schema.savedItems.metadataStatus}`,
        siteName: urlChanged ? null : sql`${schema.savedItems.siteName}`,
        title: urlChanged ? null : sql`${schema.savedItems.title}`,
        updatedAt: sql`now()`,
        url: input.url
      })
      .where(eq(schema.savedItems.id, input.savedItemId));

    if (input.tagIds) {
      const selectedTagIds = [...new Set(input.tagIds)];

      await tx
        .delete(schema.savedItemTags)
        .where(eq(schema.savedItemTags.savedItemId, input.savedItemId));

      if (selectedTagIds.length > 0) {
        await tx
          .insert(schema.savedItemTags)
          .values(
            selectedTagIds.map((tagId) => ({
              libraryId: existingItem.libraryId,
              savedItemId: input.savedItemId,
              tagId
            }))
          )
          .onConflictDoNothing();
      }
    }

    const [row] = await tx
      .select(savedItemSelectFields)
      .from(schema.savedItems)
      .leftJoin(
        schema.folders,
        and(
          eq(schema.savedItems.folderId, schema.folders.id),
          eq(schema.savedItems.libraryId, schema.folders.libraryId)
        )
      )
      .where(eq(schema.savedItems.id, input.savedItemId))
      .limit(1);

    if (!row) {
      throw new Error("Unable to load saved item");
    }

    const tagRows = await tx
      .select({
        id: schema.tags.id,
        name: schema.tags.name,
        color: schema.tags.color
      })
      .from(schema.savedItemTags)
      .innerJoin(
        schema.tags,
        and(
          eq(schema.savedItemTags.tagId, schema.tags.id),
          eq(schema.savedItemTags.libraryId, schema.tags.libraryId)
        )
      )
      .where(eq(schema.savedItemTags.savedItemId, input.savedItemId))
      .orderBy(schema.tags.sortOrder, schema.tags.name, schema.tags.id);

    return serializeSavedItem(row, tagRows);
  });
};
