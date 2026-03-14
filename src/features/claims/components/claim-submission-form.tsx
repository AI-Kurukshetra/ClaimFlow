"use client";

import { useEffect, useRef, useState } from "react";

import { SubmitButton } from "@/components/submit-button";
import { submitClaimAction } from "@/features/claims/actions";

type CapturedPhoto = {
  file: File;
  id: string;
  previewUrl: string;
};

function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
}

export function ClaimSubmissionForm() {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const capturedPhotosInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturedPhotosRef = useRef<CapturedPhoto[]>([]);

  useEffect(() => {
    const input = capturedPhotosInputRef.current;

    if (!input || typeof DataTransfer === "undefined") {
      return;
    }

    const dataTransfer = new DataTransfer();

    capturedPhotos.forEach((photo) => {
      dataTransfer.items.add(photo.file);
    });

    input.files = dataTransfer.files;
  }, [capturedPhotos]);

  useEffect(() => {
    if (!isCameraOpen || !videoRef.current || !streamRef.current) {
      return;
    }

    const video = videoRef.current;
    video.srcObject = streamRef.current;
    void video.play().catch(() => {
      setCameraError("Camera preview could not start. Try reopening the camera.");
    });

    return () => {
      video.srcObject = null;
    };
  }, [isCameraOpen]);

  useEffect(() => {
    const previousPhotos = capturedPhotosRef.current;
    const removedPhotos = previousPhotos.filter(
      (previousPhoto) => !capturedPhotos.some((currentPhoto) => currentPhoto.id === previousPhoto.id),
    );

    removedPhotos.forEach((photo) => {
      URL.revokeObjectURL(photo.previewUrl);
    });

    capturedPhotosRef.current = capturedPhotos;
  }, [capturedPhotos]);

  useEffect(() => {
    return () => {
      stopMediaStream(streamRef.current);
      capturedPhotosRef.current.forEach((photo) => {
        URL.revokeObjectURL(photo.previewUrl);
      });
    };
  }, []);

  async function openCamera() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not supported in this browser.");
      return;
    }

    setCameraError(null);
    stopMediaStream(streamRef.current);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
        },
      });

      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch {
      setCameraError("Unable to access the device camera. Check browser permissions and try again.");
    }
  }

  function closeCamera() {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    setIsCameraOpen(false);
  }

  function capturePhoto() {
    const video = videoRef.current;

    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera is not ready yet. Wait for the preview and try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("Photo capture is not available right now.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Captured photo could not be processed. Try again.");
          return;
        }

        const timestamp = Date.now();
        const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `capture-${timestamp}`;
        const file = new File([blob], `claim-capture-${timestamp}.jpg`, { type: "image/jpeg" });
        const previewUrl = URL.createObjectURL(file);

        setCapturedPhotos((currentPhotos) => [
          ...currentPhotos,
          {
            file,
            id,
            previewUrl,
          },
        ]);

        setCameraError(null);
      },
      "image/jpeg",
      0.92,
    );
  }

  function removeCapturedPhoto(photoId: string) {
    setCapturedPhotos((currentPhotos) => currentPhotos.filter((photo) => photo.id !== photoId));
  }

  return (
    <form action={submitClaimAction} className="claim-form">
      <div className="split-fields">
        <label>
          <span>Incident date</span>
          <input name="incidentDate" type="date" required />
        </label>
        <label>
          <span>Vehicle year</span>
          <input name="vehicleYear" type="number" min={1980} max={2100} placeholder="2024" required />
        </label>
      </div>

      <div className="split-fields">
        <label>
          <span>Vehicle make</span>
          <input name="vehicleMake" type="text" placeholder="Toyota" maxLength={60} required />
        </label>
        <label>
          <span>Vehicle model</span>
          <input name="vehicleModel" type="text" placeholder="Camry" maxLength={60} required />
        </label>
      </div>

      <label>
        <span>Plate number (optional)</span>
        <input name="plateNumber" type="text" placeholder="ABC-1234" maxLength={20} />
      </label>

      <label>
        <span>Incident description</span>
        <textarea
          name="description"
          rows={5}
          placeholder="Describe what happened, where it happened, and visible damage."
          maxLength={2000}
          required
        />
      </label>

      <section className="claim-photo-intake" aria-label="Photo intake options">
        <article className="claim-photo-panel">
          <div className="claim-photo-panel-head">
            <h5>Upload photos</h5>
            <p className="claim-field-note">Select existing damage photos from the device.</p>
          </div>

          <label>
            <span>Photo library</span>
            <input name="photos" type="file" accept="image/*" multiple />
          </label>
        </article>

        <article className="claim-photo-panel">
          <div className="claim-photo-panel-head">
            <h5>Capture photo</h5>
            <p className="claim-field-note">Use the browser camera to take photos directly from the system camera.</p>
          </div>

          <input
            ref={capturedPhotosInputRef}
            name="photos"
            type="file"
            accept="image/*"
            multiple
            tabIndex={-1}
            aria-hidden="true"
            className="claim-hidden-file-input"
          />

          {cameraError ? <p className="form-alert error">{cameraError}</p> : null}

          {isCameraOpen ? (
            <div className="claim-camera-capture">
              <div className="claim-camera-preview">
                <video ref={videoRef} autoPlay muted playsInline />
              </div>

              <div className="claim-camera-actions">
                <button type="button" className="primary-button" onClick={capturePhoto}>
                  Capture Photo
                </button>
                <button type="button" className="secondary-button" onClick={closeCamera}>
                  Close Camera
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="secondary-button" onClick={openCamera}>
              Open Camera
            </button>
          )}

          {capturedPhotos.length ? (
            <div className="captured-photo-grid" aria-label="Captured photos">
              {capturedPhotos.map((photo, index) => (
                <article key={photo.id} className="captured-photo-card">
                  <img src={photo.previewUrl} alt={`Captured damage photo ${index + 1}`} />
                  <div className="captured-photo-meta">
                    <span>{photo.file.name}</span>
                    <button type="button" className="captured-photo-remove" onClick={() => removeCapturedPhoto(photo.id)}>
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </article>
      </section>

      <SubmitButton idleLabel="Submit Claim" pendingLabel="Submitting Claim..." />
    </form>
  );
}
