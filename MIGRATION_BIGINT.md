# 🔄 MIGRATION UUID → BIGINT

## 📋 Contexte

Certains serveurs PostgreSQL (notamment en hébergement mutualisé) **n'ont pas l'extension `pgcrypto`** nécessaire pour utiliser des UUID.

Cette migration permet de passer de **UUID (string)** à **BIGINT (number)** pour tous les ID de la base de données.

---

## ⚠️ CHANGEMENTS MAJEURS

### 1️⃣ **Base de données**

- **Ancien schéma** : `database/schema.sql` (utilise UUID avec pgcrypto)
- **Nouveau schéma** : `database/schema_nouid.sql` (utilise BIGSERIAL/BIGINT)

### 2️⃣ **Types TypeScript**

Les ID dans les interfaces TypeScript doivent passer de `string` à `number` :

```typescript
// ❌ AVANT (avec UUID)
export interface User {
  id: string  // UUID
  email: string
  // ...
}

// ✅ APRÈS (avec BIGINT)
export interface User {
  id: number  // BIGINT
  email: string
  // ...
}
```

### 3️⃣ **Code applicatif**

**Attention** : Les ID dans les **routes Next.js** restent des `string` (car ils viennent de l'URL).

```typescript
// Routes Next.js : les params sont toujours des strings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ Reste string (URL param)
) {
  const { id } = await params
  const numericId = parseInt(id, 10)  // ✅ Convertir en number pour la DB

  const result = await query('SELECT * FROM users WHERE id = $1', [numericId])
}
```

---

## 📁 FICHIERS AJOUTÉS

### 1. `database/schema_nouid.sql`
Schéma PostgreSQL sans UUID, utilisant BIGSERIAL au lieu de `uuid_generate_v4()`.

**Différences principales** :
```sql
-- AVANT (schema.sql)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- ...
);

-- APRÈS (schema_nouid.sql)
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  -- ...
);
```

### 2. `ecosystem.config.js.example`
Configuration PM2 pour la production.

**Usage** :
```bash
cp ecosystem.config.js.example ecosystem.config.js
nano ecosystem.config.js  # Remplir les vraies valeurs
./node_modules/.bin/pm2 start ecosystem.config.js
```

### 3. `.htaccess.production`
Configuration Apache pour le reverse proxy vers Node.js.

**Nouveautés importantes** :
- `DirectoryIndex disabled` : évite les conflits avec Apache
- Redirection `index.php` vers `/` : évite les erreurs 403

---

## 🔧 FICHIERS À MODIFIER

Si vous utilisez `schema_nouid.sql`, vous **DEVEZ** adapter les types TypeScript dans :

### ✅ À MODIFIER

1. **`lib/auth.ts`**
   - `User.id: string` → `User.id: number`
   - `JWTPayload.userId: string` → `JWTPayload.userId: number`

2. **`app/providers/AuthProvider.tsx`**
   - `User.id: string` → `User.id: number`
   - `Organization.id: string` → `Organization.id: number`

3. **Toutes les interfaces de données** (`app/*/page.tsx`)
   - Tournament, Match, Team, Player : tous les champs `id` en `number`

### ❌ NE PAS MODIFIER

Les **paramètres de routes Next.js** restent des `string` :

```typescript
// ✅ CORRECT - les params d'URL sont toujours des strings
{ params }: { params: Promise<{ id: string }> }
```

---

## 🚀 GUIDE DE MIGRATION

### Pour une nouvelle installation

1. Utilisez directement `schema_nouid.sql` :
   ```bash
   psql -h localhost -U user -d database < database/schema_nouid.sql
   ```

2. Les types TypeScript sont déjà adaptés (si vous êtes sur la bonne branche)

### Pour une base existante avec UUID

⚠️ **Migration complexe** - Nécessite :
1. Backup complet de la base
2. Script de migration SQL (non fourni)
3. Mise à jour de tout le code TypeScript

**Non recommandé en production** - Préférez recréer une nouvelle base.

---

## 📊 COMPARAISON

| Critère | UUID (string) | BIGINT (number) |
|---------|---------------|-----------------|
| **Taille** | 128 bits (16 bytes) | 64 bits (8 bytes) |
| **Performance** | Plus lent | Plus rapide |
| **Lisibilité** | Difficile (`550e8400-e29b-41d4-a716-446655440000`) | Facile (`12345`) |
| **Compatibilité** | Nécessite `pgcrypto` | Natif PostgreSQL |
| **Collision** | Quasi impossible | Possible (mais géré par SERIAL) |
| **Usage** | Systèmes distribués | Applications classiques |

---

## ✅ CHECKLIST

Avant de déployer avec `schema_nouid.sql` :

- [ ] Base de données créée avec `schema_nouid.sql`
- [ ] Types TypeScript adaptés (`id: number` au lieu de `id: string`)
- [ ] Conversions `parseInt()` ajoutées dans les routes API
- [ ] Tests effectués en local
- [ ] Variables d'environnement configurées
- [ ] Build production réussi (`npm run build`)

---

## 🆘 SUPPORT

Si vous avez des erreurs TypeScript après la migration :

1. Vérifiez que tous les champs `id` dans les interfaces sont bien `number`
2. Dans les routes API, convertissez les params : `const numericId = parseInt(id, 10)`
3. Vérifiez les requêtes SQL : les placeholders `$1` acceptent les numbers

---

**Créé le** : 2025-11-02
**Auteur** : Claude Code
**Version** : 1.0
