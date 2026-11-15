import { REST, Routes } from 'discord.js'

export function createInteractionRest(authToken = '') {
  const rest = new REST({
    version: '10',
    userAgentAppendix: 'wotakoi-gacha',
    retries: 3,
    timeout: 10000,
  })
  if (authToken) rest.setToken(authToken)
  return rest
}

export async function patchOriginalInteractionResponse({
  applicationId,
  token,
  response,
  authToken = '',
  rest = createInteractionRest(authToken),
}) {
  if (!applicationId || !token) {
    throw new Error('Faltan el application id o el token de la interacción.')
  }

  return rest.patch(Routes.webhookMessage(applicationId, token, '@original'), {
    body: response,
    auth: Boolean(authToken),
  })
}
