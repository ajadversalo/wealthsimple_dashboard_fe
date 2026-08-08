import { ImageResponse } from 'next/og';
import { createElement } from 'react';

const supportedSizes = new Set([192, 512]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const requestedSize = Number((await params).size);
  if (!supportedSizes.has(requestedSize)) {
    return new Response('Not found', { status: 404 });
  }

  const tileSize = Math.round(requestedSize * 0.625);
  const tileRadius = Math.round(requestedSize * 0.172);

  return new ImageResponse(
    createElement(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020617',
        },
      },
      createElement(
        'div',
        {
          style: {
            width: tileSize,
            height: tileSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: tileRadius,
            background: '#10b981',
            color: '#020617',
            fontSize: Math.round(requestedSize * 0.39),
            fontWeight: 800,
            letterSpacing: Math.round(requestedSize * -0.025),
          },
        },
        'W',
      ),
    ),
    { width: requestedSize, height: requestedSize },
  );
}
