const { getMeta, setMeta } = require('./data');

const META_KEY = 'messenger_puede_modificar_valor';

async function readMap() {
  const raw = await getMeta(META_KEY);
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
  } catch (_e) {
    return {};
  }
}

async function writeMap(map) {
  await setMeta(META_KEY, JSON.stringify(map && typeof map === 'object' ? map : {}));
}

async function getPuedeModificarValor(userId) {
  if (userId == null || userId === '') return false;
  const map = await readMap();
  return !!map[String(userId)];
}

async function setPuedeModificarValor(userId, value) {
  if (userId == null || userId === '') return;
  const map = await readMap();
  const key = String(userId);
  if (value) map[key] = true;
  else delete map[key];
  await writeMap(map);
}

/** Añade `puedeModificarValor` al usuario público (solo aplica a mensajeros). */
async function enrichUserPublic(user) {
  if (!user) return null;
  const puede =
    user.role === 'mensajero' ? await getPuedeModificarValor(user.id) : false;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    puedeModificarValor: !!puede,
  };
}

async function enrichUsersList(users) {
  const map = await readMap();
  return (users || []).map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    created_at: u.created_at,
    puedeModificarValor: u.role === 'mensajero' ? !!map[String(u.id)] : false,
  }));
}

module.exports = {
  getPuedeModificarValor,
  setPuedeModificarValor,
  enrichUserPublic,
  enrichUsersList,
};
