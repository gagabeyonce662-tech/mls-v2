"use client"

import CSVUploadPreConn from '@/components/PreCon';

export default function Page() {
  return (
    <CSVUploadPreConn
      authToken={process.env.NEXT_PUBLIC_API_TOKEN ?? null}
      fieldName="file" // change if backend expects a different field
      onSuccess={(resp) => {
        alert('Upload finished');
        console.log('server response', resp);
      }}
      onError={(err) => {
        alert('Upload failed — check console');
        console.error(err);
      }}
    />
  );
}
