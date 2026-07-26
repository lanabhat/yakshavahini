// Uploads a File directly from the browser to Google Drive's resumable
// upload session URL — Django never sees the file bytes, so its disk usage
// is unaffected regardless of PDF size.
//
// Google's resumable-upload endpoint answers the CORS preflight correctly,
// but the actual PUT response never includes Access-Control-Allow-Origin
// (confirmed directly), so the browser blocks JS from reading it even when
// the upload itself succeeds. That means this can't resolve with a file id
// the way it looks like it should — the caller must independently verify
// the upload afterward (see verifyUpload in services/api.ts), which is the
// actual source of truth for success/failure here.
export function uploadDirectlyToDrive(
  uploadUrl: string,
  accessToken: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('Content-Type', 'application/pdf');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onloadend = () => resolve();
    xhr.send(file);
  });
}
