import { listPhotosForClaimIds } from "@/features/claims/repositories/claims.repository";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const claimPhotosBucket = "claim-photos";

type SignedClaimPhoto = {
  id: string;
  signedUrl: string;
  storagePath: string;
};

type StorageObjectRow = {
  id: string;
  name: string;
};

function normalizeStoragePath(path: string) {
  return path.trim().replace(/^\/+/, "");
}

function getOptionalSupabaseAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

async function listStoragePathsByClaimIdFallback(claimId: string) {
  const adminClient = getOptionalSupabaseAdminClient();

  if (!adminClient) {
    return [] as StorageObjectRow[];
  }

  const { data, error } = await adminClient
    .schema("storage")
    .from("objects")
    .select("id, name")
    .eq("bucket_id", claimPhotosBucket)
    .like("name", `%/${claimId}/%`);

  if (error || !data) {
    return [] as StorageObjectRow[];
  }

  return (data as StorageObjectRow[])
    .map((row) => ({
      id: row.id,
      name: normalizeStoragePath(row.name),
    }))
    .filter((row) => row.name.length > 0);
}

export async function getSignedPhotosForClaim(claimId: string, expiresInSeconds = 1800) {
  const { data: photoRecords } = await listPhotosForClaimIds([claimId]);
  const matchingRecords = photoRecords.filter((photo) => photo.claim_id === claimId);

  const tablePhotoEntries = matchingRecords
    .map((photo) => ({
      id: photo.id,
      storagePath: normalizeStoragePath(photo.storage_path),
    }))
    .filter((photo) => photo.storagePath.length > 0);

  const fallbackEntries = tablePhotoEntries.length > 0 ? [] : await listStoragePathsByClaimIdFallback(claimId);

  const sourceEntries =
    tablePhotoEntries.length > 0
      ? tablePhotoEntries
      : fallbackEntries.map((entry) => ({
          id: entry.id,
          storagePath: entry.name,
        }));

  if (sourceEntries.length === 0) {
    return [] as SignedClaimPhoto[];
  }

  const serverClient = await createSupabaseServerClient();
  const adminClient = getOptionalSupabaseAdminClient();
  const signerClient = adminClient ?? serverClient;

  const signedPhotos = await Promise.all(
    sourceEntries.map(async (photo) => {
      const { data, error } = await signerClient.storage
        .from(claimPhotosBucket)
        .createSignedUrl(photo.storagePath, expiresInSeconds);

      if (error || !data?.signedUrl) {
        return null;
      }

      return {
        id: photo.id,
        signedUrl: data.signedUrl,
        storagePath: photo.storagePath,
      } satisfies SignedClaimPhoto;
    }),
  );

  return signedPhotos.filter((photo): photo is SignedClaimPhoto => Boolean(photo));
}
