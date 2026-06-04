import "server-only";

const MP_AUTH_URL = "https://auth.mercadopago.com.ar/authorization";
const MP_TOKEN_URL = "https://api.mercadopago.com/oauth/token";

/** URL de callback registrada en la app de Mercado Pago. */
export function redirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/api/oauth/mercadopago/callback`;
}

/**
 * Arma la URL de autorización OAuth a la que se envía al profesional para
 * que conecte su cuenta de Mercado Pago. `state` se valida en el callback.
 */
export function buildAuthUrl(state: string): string {
  const clientId = process.env.MP_CLIENT_ID;
  if (!clientId) {
    throw new Error("Falta MP_CLIENT_ID en el entorno.");
  }
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    platform_id: "mp",
    redirect_uri: redirectUri(),
    state,
  });
  return `${MP_AUTH_URL}?${params.toString()}`;
}

export type TokenOAuth = {
  access_token: string;
  refresh_token?: string;
  user_id: number | string;
  // MP devuelve `public_key` en el response del code exchange (formato
  // `APP_USR-...`). La necesita el Wallet Brick para inicializar el SDK
  // del lado del cliente apuntando a la cuenta del profesional.
  public_key?: string;
};

/**
 * Intercambia el `code` del callback OAuth por el access token del
 * profesional. Lanza si Mercado Pago responde un error.
 */
export async function exchangeCode(code: string): Promise<TokenOAuth> {
  const clientId = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Faltan credenciales OAuth de Mercado Pago.");
  }

  const res = await fetch(MP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri(),
    }),
  });
  if (!res.ok) {
    throw new Error(`Mercado Pago OAuth respondió ${res.status}.`);
  }
  return (await res.json()) as TokenOAuth;
}
