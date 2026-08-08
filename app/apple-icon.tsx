import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020617',
        }}
      >
        <div
          style={{
            width: 116,
            height: 116,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 32,
            background: '#10b981',
            color: '#020617',
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: -6,
          }}
        >
          W
        </div>
      </div>
    ),
    size,
  );
}
