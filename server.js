/**
 * GAN HAI™ · Backend · v2.2 · Streaming · REHEM™ v1.7.3
 * Makom Intelligence™ · CorreIA LLC · Scribe du Souffle
 *
 * Architecture DevOps · Note Technique Corrective v1.7.1 · CTR-031
 * Séparation stricte : moteur déterministe / LLM interprète
 * v2.1 : Streaming activé  ✨  Server-Sent Events
 *
 * PRINCIPE D'OR :
 * Le moteur produit la vérité computationnelle du référentiel.
 * Le LLM produit l'expression linguistique de cette vérité.
 */

'use strict';

const http  = require('http');
const https = require('https');
const url   = require('url');

const PORT       = process.env.PORT || 3000;
const API_KEY    = process.env.ANTHROPIC_API_KEY || '';
const MODEL      = 'claude-sonnet-4-6';
const MAX_TOKENS = 3000;

if (!API_KEY) {
  console.error('[GAN HAI] ANTHROPIC_API_KEY non définie. Arrêt.');
  process.exit(1);
}

const SYSTEM_PROMPT = `Tu es REHEM™ · Observatoire Scientifique du Référentiel Temporel Computationnel GAN HAI™.
Version : CorreIA FL✦366™ v1.7.3 · Note RTC✦REHEM✦001

POSTURE OFFICIELLE :
Tu ne racontes pas. Tu documentes.
Tu ne produis pas une narration. Tu produis un RAPPORT RÉFÉRENTIEL.
Le sujet grammatical exclusif : le calcul · la structure calculée · le Référentiel · les paramètres actifs · les convergences · les contraintes.

VERBES INTERDITS ET REMPLACEMENTS :
reçoit → situe · entend → qualifie · voit → met en évidence · observe → indique
attend → maintient · cherche → est cohérent avec · veut → est orienté vers
porte → présente · confirme → est compatible avec · révèle → met en évidence

INTERDITS ABSOLUS :
✦ "Je pense / Je vois / Je ressens / Je peux / Je décide"
✦ Attribuer une intention · une volonté · une émotion · une perception au Référentiel
✦ Cela signifie que... · Vous cherchez... · Vous voulez...
✦ Inventer des lois · Modifier le calcul

STRUCTURE OBLIGATOIRE DU RAPPORT :

## RAPPORT RÉFÉRENTIEL
### Référentiel Temporel Computationnel · Analyse Contextuelle

---

## PARTIE 1 · RÉFÉRENTIEL CALCULÉ
Liste de données déterministes, une par ligne, format strict (PAS de tableau markdown, PAS de | ni de ---) :
**Sha'at** : [valeur]
**Valeur** : [valeur]
**Yom** : [valeur]
**Sceau** : [valeur]
**Pilier Zman** : [valeur]
**STE** : [valeur]
**Fréquences** : [valeur]
**Loi du Yom** : [valeur]
**Passouk** : [valeur]
**Porteur** : [valeur]
**Combinaisons actives** : [valeur]
NE PAS MODIFIER ces données. NE PAS utiliser de tableaux markdown.

---

## PARTIE 1.5 · FAITS COMPUTATIONNELS
Section entièrement déterministe. Aucune interprétation.
Lister : CTR · Valeur · Dominante · Sceau · Transitions calculées (format : A → B → C) · Loi du Yom.
Terminer par : "Les éléments ci-dessus constituent la base exclusive de l'analyse contextuelle."

---

## PARTIE 2 · ANALYSE CONTEXTUELLE
Commencer OBLIGATOIREMENT par cette phrase exacte :
"Les observations suivantes sont générées à partir du Référentiel Temporel Computationnel calculé par Gan Hai™. Elles constituent une analyse contextuelle des paramètres actifs et ne modifient en aucun cas les résultats déterministes du moteur."

Trois niveaux autorisés UNIQUEMENT :
Niveau 1 · Calcul : "Valeur = 43 · Dominante Aleph ×6"
Niveau 2 · Observation structurelle : "La combinaison Aleph·Beit est active."
Niveau 3 · Analyse contextuelle : "Cette configuration est compatible avec une phase d'ouverture avant inscription."

Pour chaque pilier pertinent : loi active → observation structurelle → analyse niveau 3.

---

## CONVERGENCES
Synthèse des convergences calculées.

---

## LIMITES DE L'ANALYSE
Terminer par ce texte standard exact :
"Cette analyse est produite à partir du Référentiel Temporel Computationnel calculé pour l'instant considéré. Elle contextualise la situation soumise mais ne constitue ni une prédiction, ni une décision, ni une inférence sur les intentions des personnes concernées. Toute décision relève de la responsabilité du décideur."

FORMAT : Markdown. Titres ## obligatoires. Structure en 5 parties dans l'ordre exact.`;

function buildCTRS(referentiel) {
  const r = referentiel;
  return {
    sha_at:  `${r.hPad || '--'}:${r.mPad || '--'}`,
    valeur:  r.valeurInstant,
    yom: {
      shem:    r.yom?.shem    || '✦',
      sceau:   r.yom?.sceau   || '✦',
      loi:     r.yom?.loi     || '✦',
      phrase:  r.yom?.phrase  || '✦',
      porteur: r.yom?.porteur || '✦',
      passouk: r.yom?.passouk || '✦',
    },
    STE: {
      label:    r.STE?.label          || '✦',
      dominant: r.STE?.dominant?.name || '✦',
      count:    r.STE?.dominant?.count || 0,
    },
    piliers: (r.piliers || []).map(p => ({
      num:       p.pilier?.num,
      name:      p.pilier?.name,
      heb:       p.pilier?.heb,
      formule:   p.calcul?.formule,
      sequence:  (p.sequence?.letters || []).map(l => l.n + '(' + l.mv + ')').join(' · '),
      direction: p.direction,
      emergence: p.emergence,
      loi:       p.pilier?.law,
      ayin:      p.ayin?.position || null,
      combs:     p.combNotes || [],
      str:       p.STR?.orientation || '',
    })),
    frequences: (r.frequences || []).slice(0, 5).map(f => f.name + '×' + f.count),
    tavnit:    r.tavnit ? (r.tavnit.tavnit + ' · ' + r.tavnit.loi) : null,
  };
}

function buildPart1(ctrs) {
  const zman = ctrs.piliers.find(p => p.num === 7) || ctrs.piliers[ctrs.piliers.length-1];
  const combs = ctrs.piliers.flatMap(p => p.combs).filter(Boolean).slice(0,6);
  return [
    '## RAPPORT RÉFÉRENTIEL',
    '### Référentiel Temporel Computationnel · Analyse Contextuelle',
    '',
    '## PARTIE 1 · RÉFÉRENTIEL CALCULÉ',
    '',
    `**Sha'at** : ${ctrs.sha_at}`,
    `**Valeur** : ${ctrs.valeur}`,
    `**Yom** : ${ctrs.yom.shem}`,
    `**Sceau** : ${ctrs.yom.sceau}`,
    `**Pilier Zman** : ${zman ? zman.formule : '✦'}`,
    `**STE** : ${ctrs.STE.label} · Dominant : ${ctrs.STE.dominant} (${ctrs.STE.count}×)`,
    `**Fréquences** : ${ctrs.frequences.join(' · ')}`,
    `**Loi du Yom** : ${ctrs.yom.loi}`,
    `**Passouk** : ${ctrs.yom.passouk}`,
    `**Porteur** : ${ctrs.yom.porteur}`,
    combs.length ? `**Combinaisons actives** : ${combs.join(' · ')}` : '',
    ctrs.tavnit ? `**Tavnit** : ${ctrs.tavnit}` : '',
  ].filter(l => l !== null && l !== undefined).join('\n');
}

function buildUserPrompt(situation, ctrs) {
  const part1 = buildPart1(ctrs);
  return `SITUATION SOUMISE :
${situation}

CTRS COMPLET (source exclusive) :
Sha'at : ${ctrs.sha_at} · Valeur : ${ctrs.valeur}
Yom : ${ctrs.yom.shem} · Sceau : ${ctrs.yom.sceau}
Loi du Yom : ${ctrs.yom.loi}
Porteur : ${ctrs.yom.porteur}
Passouk : ${ctrs.yom.passouk}
STE : ${ctrs.STE.label} · Dominant : ${ctrs.STE.dominant} (${ctrs.STE.count}×)
Fréquences : ${ctrs.frequences.join(' · ')}
${ctrs.tavnit ? 'Tavnit : ' + ctrs.tavnit : ''}

7 PILIERS :
${ctrs.piliers.map(p =>
  `${p.num}·${p.name} · ${p.formule}
  Séquence : ${p.sequence}
  Direction : ${p.direction}
  Émergence : ${p.emergence}
  Loi : ${p.loi}
  ${p.combs.length ? 'Combinaisons : ' + p.combs.join(' · ') : ''}
  ${p.ayin ? 'Ayin ' + p.ayin : ''}`
).join('\n\n')}

INSTRUCTION PRIORITAIRE :
1. Copier EXACTEMENT la PARTIE 1 ci-dessous sans modification.
2. PARTIE 1.5 : listes brutes courtes uniquement.
3. PARTIE 2 : répondre D'ABORD DIRECTEMENT à la situation en 3-4 phrases depuis Zman et la Loi du Yom. Ensuite pour chaque pilier : UNE seule phrase niveau 3. Pas de niveau 1 ni 2 développés.
4. CONVERGENCES : 3 maximum, une phrase chacune.
5. LIMITES : texte standard court.
CONTRAINTE ABSOLUE : rester sous 2500 tokens. La concision est une exigence scientifique.

PARTIE 1 PRÉ-CONSTRUITE (à copier telle quelle) :
${part1}`;
}

// ── Streaming Anthropic → SSE client ──────────────────────────
function streamAnthropic(situation, ctrs, res) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      stream:     true,
      system:     SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(situation, ctrs) }],
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

    const req = https.request(options, apiRes => {
      let buffer = '';

      apiRes.on('data', chunk => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop(); // garder la ligne incomplète

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            // Extraire le texte delta
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              const text = parsed.delta.text;
              // Envoyer chunk SSE au client
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
            // Fin du stream
            if (parsed.type === 'message_stop') {
              res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
              resolve();
            }
          } catch (e) {
            // ligne non-JSON (ex: event: ...)  ✨  ignorer
          }
        }
      });

      apiRes.on('end', () => {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        resolve();
      });

      apiRes.on('error', reject);
    });

    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Timeout stream (60s)')); });
    req.write(body);
    req.end();
  });
}

// ── callAnthropic · Mode non-stream (pour /api/ctrs) ──────────
function callAnthropic(situation, ctrs) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      system:     SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(situation, ctrs) }],
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
          if (parsed.content && parsed.content[0]) resolve(parsed.content[0].text);
          else reject(new Error('Reponse API inattendue'));
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Timeout (60s)')); });
    req.write(body);
    req.end();
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 100000) { req.destroy(); reject(new Error('Body trop large')); }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(new Error('JSON invalide')); }
    });
  });
}

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function validateBody(body, res) {
  if (!body.situation || typeof body.situation !== 'string') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'situation manquante' }));
    return false;
  }
  if (!body.referentiel || typeof body.referentiel !== 'object') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'referentiel manquant' }));
    return false;
  }
  return true;
}

// ── SERVEUR ────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  setCORS(res);
  const parsed = url.parse(req.url, true);

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── GET /health ────────────────────────────────────────────
  if (req.method === 'GET' && parsed.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok', moteur: 'Gan Hai™ v2.3', version: '2.2',
      streaming: true,
      endpoints: ['POST /api/ctrs', 'POST /api/orientation', 'POST /interprete'],
    }));
    return;
  }

  // ── POST /api/ctrs · moteur pur · JSON ────────────────────
  if (req.method === 'POST' && parsed.pathname === '/api/ctrs') {
    try {
      const body = await parseBody(req);
      if (!validateBody(body, res)) return;
      const ctrs = buildCTRS(body.referentiel);
      console.log(`[MOTEUR] ${ctrs.sha_at} · valeur:${ctrs.valeur} · sceau:${ctrs.yom.sceau}`);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, ctrs }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // ── POST /api/orientation · STREAMING SSE ─────────────────
  if (req.method === 'POST' && (parsed.pathname === '/api/orientation' || parsed.pathname === '/interprete')) {
    try {
      const body = await parseBody(req);
      if (!validateBody(body, res)) return;

      const ctrs = buildCTRS(body.referentiel);
      console.log(`[MOTEUR] ${ctrs.sha_at} · valeur:${ctrs.valeur} · "${body.situation.slice(0,50)}"`);

      // Headers SSE
      res.writeHead(200, {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      // Envoyer le CTRS en premier event
      res.write(`data: ${JSON.stringify({ ctrs })}\n\n`);

      // Streamer la réponse LLM
      await streamAnthropic(body.situation, ctrs, res);
      console.log(`[LLM] Stream terminé`);
      res.end();

    } catch (err) {
      console.error('[LLM] Erreur stream :', err.message);
      try {
        res.write(`data: ${JSON.stringify({ error: err.message, done: true })}\n\n`);
        res.end();
      } catch(e) {}
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Route inconnue' }));
});

server.listen(PORT, () => {
  console.log(`[GAN HAI™ v2.1 · Streaming] Port ${PORT}`);
  console.log(`[GAN HAI™] /health · /api/ctrs · /api/orientation (SSE) · /interprete (SSE)`);
});
