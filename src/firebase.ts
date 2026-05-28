// ═══════════════════════════════════════════════════════════
//  AfriShop — Point d'entrée Firebase Functions
// ═══════════════════════════════════════════════════════════
import * as functions from 'firebase-functions';
import { createNestApp, expressApp } from './main';

// Créer l'app au démarrage de la Function
let initialized = false;

const server = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '512MB',
  })
  .https.onRequest(async (req, res) => {
    if (!initialized) {
      await createNestApp();
      initialized = true;
    }
    expressApp(req, res);
  });

export const api = server;
