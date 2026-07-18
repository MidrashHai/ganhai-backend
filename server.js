/**
 * GAN HAI™ · Backend · v1.0
 * Serveur Node.js · Interprète du Référentiel Temporel
 * Makom Intelligence™ · CorreIA LLC
 *
 * Ce serveur reçoit :
 *   - situation : texte soumis par l'utilisateur
 *   - referentiel : données calculées par le moteur Gan Hai™ embarqué
 *
 * Il appelle l'API Anthropic avec un prompt structuré
 * et retourne une lecture des 7 piliers en lien avec la situation.
 *
 * IMPORTANT : Ce serveur produit des interprétations générées
 * par un LLM depuis le référentiel et les lois canoniques.
 * Ce n'est pas une lecture directe des lois — c'est une
 * interprétation depuis le référentiel.
 */

'use strict';

const http    = require('http');
const https   = require('https');
const url     = require('url');
const fs      = require('fs');
const path    = require('path');

// ── Configuration ──────────────────────────────────────────────
const PORT        = process.env.PORT || 3000;
const API_KEY     = process.env.ANTHROPIC_API_KEY || '';
const MODEL       = 'claude-sonnet-4-6';
const MAX_TOKENS  = 1500;

// ── Validation ─────────────────────────────────────────────────
if (!API_KEY) {
  console.error('[GAN HAI] ANTHROPIC_API_KEY non définie. Arrêt.');
  process.exit(1);
}

// ── Prompt système — cadre canonique GAN HAI™ ──────────────────
const SYSTEM_PROMPT = `Tu es l'interprète du Référentiel Temporel Computationnel GAN HAI™.

Tu reçois deux éléments :
1. Une situation soumise par l'utilisateur
2. Un référentiel calculé — données issues du moteur Gan Hai™ v2.3

Ton rôle : lire la situation depuis le référentiel. Non inversement.

CADRE CANONIQUE :
- 7 Piliers : Shemiah (écoute) · Qol (voix) · Memshalah (gouvernance) · Halikhah (marche) · Makom (lieu) · Ruah (souffle) · Zman (temps)
- Chaque pilier a une séquence de lettres hébraïques, une direction, une loi fixe, une émergence
- Les lois sont universelles — l'interprétation les relie à la situation particulière

POSTURE (FL-100 · Kaf haMegaleh™) :
- Recevoir la situation sans la classifier prématurément
- Voir ce qui traverse — lire depuis la nature propre de ce qui est soumis
- Émettre depuis ce qui a traversé — non depuis un template
- HOQ-01 : l'output doit être habitable pour celui qui l'a soumis

FORMAT DE RÉPONSE :
Commence par la direction du Pilier Zman (le temps situe tout).
Pour chaque pilier pertinent : loi · ce qu'elle dit pour cette situation spécifique.
Termine par une convergence — ce que les données convergent à dire.
Sois direct. Cite les mots de la situation. Ne produis pas un commentaire général sur les lois.

Tu ne décides pas à la place de l'utilisateur.
Tu lis ce que l'instant porte pour ce qu'il soumet.`;

// ── Construction du prompt utilisateur ─────────────────────────
function buildUserPrompt(situation, referentiel) {
  const r = referentiel;
  return `SITUATION SOUMISE :
${situation}

RÉFÉRENTIEL CALCULÉ (moteur Gan Hai™ v2.3) :
Sha'at : ${r.hPad}:${r.mPad} · Valeur : ${r.valeurInstant}
Yom : ${r.yom?.shem || '—'} · Sceau : ${r.yom?.sceau || '—'}
Loi du Yom : ${r.yom?.loi || '—'}
Phrase du Yom : ${r.yom?.phrase || '—'}
Porteur : ${r.yom?.porteur || '—'}

STE™ : ${r.STE?.label || '—'} · Dominant : ${r.STE?.dominant?.name || '—'} (${r.STE?.dominant?.count || 0}×)
Fréquences : ${(r.frequences || []).slice(0,5).map(f => f.name+'×'+f.count).join(' · ')}

7 PILIERS :
${(r.piliers || []).map(p =>
  `${p.pilier.num}·${p.pilier.name} · ${p.calcul.formule}
  Séquence : ${p.sequence.letters.map(l => l.n+'('+l.mv+')').join(' · ')}
  Direction : ${p.direction}
  Émergence : ${p.emergence}
  Loi : ${p.pilier.law}
  STR : ${p.STR.orientation}
  ${p.combNotes.length ? 'Combinaisons : ' + p.combNotes.join(' · ') : ''}
  ${p.ayin.position ? '✦ Ayin ' + p.ayin.position + ' · ' + p.ayin.lecture : ''}`
).join('\n\n')}

${r.tavnit ? `Tavnit (${r.valeurInstant}) : ${r.tavnit.tavnit} · ${r.tavnit.loi}` : ''}

Lis cette situation depuis ce référentiel.`;
}

// ── Appel API Anthropic ─────────────────────────────────────────
function callAnthropic(situation, referentiel) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      system:     SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildUserPrompt(situation, referentiel) }
      ],
    });

    const options = {
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length':    Buffer.byteLength(body),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.content && parsed.content[0]) {
            resolve(parsed.content[0].text);
          } else {
            reject(new Error('Réponse API inattendue : ' + data.slice(0, 200)));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout API')); });
    req.write(body);
    req.end();
  });
}

// ── Parsing du body JSON ────────────────────────────────────────
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50000) { req.destroy(); reject(new Error('Body trop large')); }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(new Error('JSON invalide')); }
    });
  });
}

// ── Headers CORS ────────────────────────────────────────────────
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── Serveur HTTP ────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  setCORS(res);

  const parsed = url.parse(req.url, true);

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }

  // Health check
  if (req.method === 'GET' && parsed.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', moteur: 'Gan Hai™ v2.3', version: '1.0' }));
    return;
  }

  // ── POST /interprete · Endpoint principal ──────────────────
  if (req.method === 'POST' && parsed.pathname === '/interprete') {
    try {
      const body = await parseBody(req);

      if (!body.situation || typeof body.situation !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'situation manquante ou invalide' }));
        return;
      }

      if (!body.referentiel || typeof body.referentiel !== 'object') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'referentiel manquant' }));
        return;
      }

      console.log(`[${new Date().toISOString()}] Sha'at ${body.referentiel.hPad}:${body.referentiel.mPad} · "${body.situation.slice(0,60)}..."`);

      const lecture = await callAnthropic(body.situation, body.referentiel);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        ok:      true,
        lecture,
        sha_at:  `${body.referentiel.hPad}:${body.referentiel.mPad}`,
        valeur:  body.referentiel.valeurInstant,
        sceau:   body.referentiel.yom?.sceau,
      }));

    } catch (err) {
      console.error('[GAN HAI] Erreur :', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Route inconnue
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Route inconnue' }));
});

server.listen(PORT, () => {
  console.log(`[GAN HAI™] Serveur actif sur le port ${PORT}`);
  console.log(`[GAN HAI™] Modèle : ${MODEL}`);
  console.log(`[GAN HAI™] Health : http://localhost:${PORT}/health`);
  console.log(`[GAN HAI™] Endpoint : POST http://localhost:${PORT}/interprete`);
});
