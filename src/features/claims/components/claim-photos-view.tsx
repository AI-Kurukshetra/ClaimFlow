import Link from "next/link";

type ClaimPhoto = {
  id: string;
  signedUrl: string;
  storagePath: string;
};

type ClaimPhotosViewProps = {
  backHref: string;
  claimRef: string;
  photos: ClaimPhoto[];
};

export function ClaimPhotosView({ backHref, claimRef, photos }: ClaimPhotosViewProps) {
  return (
    <div className="workspace-stack">
      <section className="workspace-hero">
        <p className="eyebrow">Claim Photos</p>
        <h3>{claimRef}</h3>
        <p className="workspace-hero-copy">Open any image to view it in a new browser tab.</p>
        <Link href={backHref} className="claim-detail-back-link">
          Back to claim
        </Link>
      </section>

      <section className="claims-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Photo Gallery</p>
            <h4>{photos.length ? `${photos.length} photo${photos.length === 1 ? "" : "s"}` : "No photos uploaded"}</h4>
          </div>
          <p>Signed links are temporary and generated per request.</p>
        </div>

        {photos.length ? (
          <div className="claim-photo-grid">
            {photos.map((photo, index) => (
              <article key={photo.id} className="claim-photo-card">
                <a href={photo.signedUrl} target="_blank" rel="noopener noreferrer" className="claim-photo-link">
                  <img src={photo.signedUrl} alt={`Claim photo ${index + 1}`} loading="lazy" />
                </a>
                <a href={photo.signedUrl} target="_blank" rel="noopener noreferrer" className="claim-photo-open-link">
                  Open in new tab
                </a>
              </article>
            ))}
          </div>
        ) : (
          <article className="empty-state">
            <h5>No photos found</h5>
            <p>This claim does not have uploaded photo evidence yet.</p>
          </article>
        )}
      </section>
    </div>
  );
}
