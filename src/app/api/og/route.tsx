import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Font loading could be added here for a custom font if needed.

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Common params
    const type = searchParams.get('type') || 'motivacional'; // promessa, devocional, data, motivacional, pregacao
    const text = searchParams.get('text') || 'VOCÊ NÃO PRECISA ESTAR SEMPRE BEM. MAS PRECISA SABER QUE MERECE O MELHOR, MESMO NOS DIAS RUINS.';
    const dateTitle = searchParams.get('dateTitle') || 'TERÇA-FEIRA, 5 DE AGOSTO';
    const reference = searchParams.get('reference') || 'ISAÍAS 41:10';
    const author = searchParams.get('author') || '@PRANDERSONSILVA';
    
    // System Configs
    const avatarUrl = searchParams.get('avatarUrl') || 'https://github.com/shadcn.png'; // Fallback for dev
    const name = searchParams.get('name') || 'DIARIODOCEU';
    const username = searchParams.get('username') || '@MEUDIARIODOCEU';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            fontFamily: 'sans-serif', // We will inject a custom font later if required
            padding: '80px',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              marginBottom: 'auto', // Pushes content to middle
            }}
          >
            <img
              src={avatarUrl}
              alt="Avatar"
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                marginRight: '30px',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#111' }}>{name}</span>
                {/* Verified Badge placeholder */}
                <svg width="40" height="40" viewBox="0 0 24 24" fill="#3b82f6" style={{ marginLeft: '10px' }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="white"/>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M10 17l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="white"/>
                </svg>
              </div>
              <span style={{ fontSize: '24px', color: '#666', marginTop: '4px' }}>{username}</span>
            </div>
          </div>

          {/* Body Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: type === 'promessa' || type === 'data' ? 'flex-start' : 'center',
              justifyContent: 'center',
              textAlign: type === 'promessa' || type === 'data' ? 'left' : 'center',
              width: '100%',
              flex: 1, // takes remaining space in middle
            }}
          >
            {type === 'data' && (
              <span style={{ fontSize: '50px', fontWeight: 'bold', color: '#111', marginBottom: '30px' }}>
                {dateTitle.toUpperCase()}
              </span>
            )}
            
            <span style={{ fontSize: '40px', fontWeight: 'bold', color: '#222', lineHeight: 1.3 }}>
              {text.toUpperCase()}
            </span>

            {type === 'promessa' && (
              <span style={{ fontSize: '32px', color: '#444', marginTop: '40px', letterSpacing: '4px' }}>
                {reference.toUpperCase()}
              </span>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              marginTop: 'auto',
            }}
          >
            {type === 'promessa' && (
              <span style={{ fontSize: '28px', color: '#555', letterSpacing: '8px', fontWeight: 600 }}>
                CAIXINHA DE PROMESSAS
              </span>
            )}
            {type === 'devocional' && (
              <span style={{ fontSize: '28px', color: '#555', letterSpacing: '8px', fontWeight: 600 }}>
                O CÉU TEM ALGO PARA TE DIZER HOJE
              </span>
            )}
            {type === 'pregacao' && (
              <span style={{ fontSize: '28px', color: '#555', letterSpacing: '6px', fontWeight: 600 }}>
                {author.toUpperCase()}
              </span>
            )}
            {(type === 'motivacional' || type === 'data') && (
              <span style={{ fontSize: '28px', color: '#555', letterSpacing: '8px', fontWeight: 600 }}>
                SIGA: {username.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1080,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
