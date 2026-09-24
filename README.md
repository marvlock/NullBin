# NullBin

Encrypted pastes. No accounts.

Write something. Encrypt it in the browser. Share the link.

## What it stores

The server gets ciphertext, paste metadata, and an expiry time.

The decryption key is kept after `#` in the URL. URL fragments are not sent in HTTP requests.

Password-protected pastes derive their key with PBKDF2 and AES-256-GCM.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Config

Create `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=nullbin
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

MongoDB is used for paste storage and TTL cleanup.

## Commands

```bash
npm run dev
npm run build
npm start
```

## Stack

Next.js · React · TypeScript · MongoDB · Web Crypto · Shiki

## Notes

- Don’t share a paste URL with people you don’t trust. The link holds the key.
- Expired pastes are deleted automatically.
- There is no account recovery. If the link or password is gone, the paste is gone.

MIT
